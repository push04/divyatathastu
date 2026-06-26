/**
 * Safe server-side PDF rendering utilities.
 *
 * ROOT CAUSE HISTORY:
 *
 * 1. Split module singleton: @react-pdf/renderer is in serverExternalPackages,
 *    so it loads via Node.js CJS require as an isolated module instance.
 *    ReportPDF.tsx is bundled by Turbopack and gets a DIFFERENT react-pdf
 *    instance. Any Font.register() calls in ReportPDF.tsx register fonts on
 *    the wrong (Turbopack-bundled) instance — the renderer never sees them.
 *    This causes rendering to fail silently (react-pdf tries to load fonts
 *    that aren't registered), and container.document stays null.
 *
 * 2. Scheduler timing: updateContainer() without a callback relies on
 *    flushSyncWork() which can be a no-op in some Vercel Lambda contexts.
 *    We use the callback form to guarantee the commit happened.
 *
 * THE FIX:
 * - Font.register() is called HERE (in pdf-utils.ts) via dynamic import,
 *   ensuring it runs on the same externalized CJS react-pdf instance that
 *   does the actual rendering.
 * - renderToBufferSafe() uses callback-based updateContainer() so
 *   container.document is guaranteed non-null before toBuffer().
 */

import path from 'path'

let fontsRegistered = false

async function ensureFontsRegistered() {
  if (fontsRegistered) return
  fontsRegistered = true

  const { Font } = await import('@react-pdf/renderer')

  // Fonts are in public/fonts/ which Vercel always bundles (outputFileTracingIncludes)
  const f = (name: string) => path.join(process.cwd(), 'public', 'fonts', name)

  // Register each weight/style as its own family name to avoid fontWeight
  // resolution bugs in react-pdf (it doesn't reliably map weight:700 → bold file)
  Font.register({ family: 'CG',       src: f('cg-400.woff2') })
  Font.register({ family: 'CGi',      src: f('cg-400i.woff2') })
  Font.register({ family: 'CGsb',     src: f('cg-600.woff2') })
  Font.register({ family: 'CGb',      src: f('cg-700.woff2') })
  Font.register({ family: 'CGbi',     src: f('cg-700i.woff2') })
  Font.register({ family: 'Lato',     src: f('lato-400.woff2') })
  Font.register({ family: 'LatoBold', src: f('lato-700.woff2') })
  Font.registerHyphenationCallback((word: string) => [word])

  console.log('[PDF] Fonts registered on externalized react-pdf instance')
}

export async function renderToBufferSafe(element: React.ReactElement): Promise<Buffer> {
  // Step 1: Register fonts on the externalized react-pdf instance
  // (must happen here, NOT in ReportPDF.tsx which is bundled separately)
  await ensureFontsRegistered()

  // Step 2: Dynamic import — react-pdf is in serverExternalPackages so this
  // loads via CJS require, getting the same isolated instance as ensureFontsRegistered()
  const { pdf } = await import('@react-pdf/renderer')

  const instance = (pdf as any)()

  // Step 3: Wait for the reconciler to fully commit the element tree.
  // The callback fires AFTER appendChildToContainer sets container.document,
  // so container.document is guaranteed non-null when we call toBuffer().
  await new Promise<void>((resolve, reject) => {
    try {
      instance.updateContainer(element, () => resolve())
    } catch (err) {
      reject(err)
    }
  })

  // container.document is set — safe to render
  const stream = await instance.toBuffer()

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
