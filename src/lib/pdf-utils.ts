/**
 * Safe server-side PDF rendering utilities.
 *
 * THE SPLIT-MODULE-SINGLETON PROBLEM:
 * @react-pdf/renderer is in serverExternalPackages so it loads as an isolated
 * CJS module instance. ReportPDF.tsx is bundled by Turbopack and gets a
 * DIFFERENT react-pdf instance.
 *
 * Therefore:
 * - Font.register() MUST happen here (not in ReportPDF.tsx)
 * - Components (Document, Page, etc.) are identified by string type constants
 *   ('DOCUMENT', 'PAGE', etc.) so they work across module boundaries
 *
 * NULL CONTAINER PROBLEM:
 * container.document stays null when React's render phase throws a component
 * error. React 19 swallows these errors silently in custom renderer contexts.
 * We intercept console.error to capture and re-surface the real error.
 */

import path from 'path'

let fontsRegistered = false

async function ensureFontsRegistered() {
  if (fontsRegistered) return
  fontsRegistered = true

  const { Font } = await import('@react-pdf/renderer')

  const f = (name: string) => path.join(process.cwd(), 'public', 'fonts', name)

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
  await ensureFontsRegistered()

  // ── Intercept console.error to catch React 19's swallowed component errors ──
  // React 19 catches component errors internally and calls console.error instead
  // of propagating them in custom renderer contexts. We capture them here so
  // the real error is visible in the 500 response body and Vercel logs.
  const capturedErrors: string[] = []
  const origConsoleError = console.error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    const msg = args.map(a => (a instanceof Error ? a.stack || a.message : String(a))).join(' ')
    capturedErrors.push(msg)
    origConsoleError(...args)
  }

  let buffer: Buffer
  try {
    const { pdf } = await import('@react-pdf/renderer')
    const instance = (pdf as any)()

    // Use the 'change' event (fires from resetAfterCommit, AFTER appendChildToContainer)
    // AND the updateContainer callback (fires after layout effects) as belt-and-suspenders.
    // Whichever fires first resolves the Promise.
    await new Promise<void>((resolve, reject) => {
      let resolved = false
      const done = () => { if (!resolved) { resolved = true; resolve() } }

      // resetAfterCommit fires AFTER appendChildToContainer → container.document is set
      instance.on('change', done)

      try {
        instance.updateContainer(element, done)
      } catch (err) {
        reject(err)
      }
    })

    // Verify container.document was actually set (if React threw during render,
    // it may still have called our callbacks without committing anything)
    if (!instance.container.document) {
      const reactErrors = capturedErrors.join('\n').slice(0, 2000)
      throw new Error(
        `PDF render: container.document is null after commit callbacks fired.\n` +
        `This means React threw during render phase but swallowed the error.\n` +
        `Captured React errors:\n${reactErrors || '(none — check Vercel function logs)'}`
      )
    }

    const stream = await instance.toBuffer()
    buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  } finally {
    console.error = origConsoleError
  }

  return buffer
}
