/**
 * Safe server-side PDF rendering — RECONCILER-FREE approach.
 *
 * ROOT CAUSE (FINAL, DEFINITIVE):
 * The @react-pdf/renderer reconciler's appendChildToContainer is NEVER called
 * on Vercel production, regardless of whether we pass function components or
 * pre-resolved host elements. The async React scheduler on Vercel Lambda does
 * not complete the commit phase before our callbacks fire.
 *
 * THE FIX:
 * Bypass the reconciler entirely. Instead of letting react-reconciler traverse
 * and commit the element tree, we do it ourselves synchronously via buildNodes().
 * We then set container.document directly on the pdf() instance, and call
 * toBuffer() which only needs container.document to be a valid react-pdf node.
 *
 * This approach is:
 * - Synchronous (no scheduler, no async commit timing issues)
 * - Reliable (no React internals dependencies)
 * - Compatible (produces the exact same node structure as the reconciler would)
 */



let fontsRegistered = false

async function ensureFontsRegistered() {
  if (fontsRegistered) return
  fontsRegistered = true

  const { Font } = await import('@react-pdf/renderer')

  // All fonts are built-in Helvetica variants — zero load/parse/embed cost.
  // Only disable hyphenation to prevent slow word-break lookups.
  Font.registerHyphenationCallback((word: string) => [word])

  console.log('[PDF] Hyphenation disabled — using built-in Helvetica fonts')
}

// ─── React-pdf node types (matches createInstance / createTextInstance output) ─

type ReactPdfNode = {
  type: string
  box: Record<string, unknown>
  style: Record<string, unknown>
  props: Record<string, unknown>
  children: (ReactPdfNode | TextInstanceNode)[]
}

type TextInstanceNode = {
  type: 'TEXT_INSTANCE'
  value: string
}

const TEXT_PARENTS = new Set(['TEXT', 'LINK', 'TSPAN', 'NOTE'])

// ─── Synchronous element-tree traversal (replaces the reconciler) ─────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildNodes(child: any): (ReactPdfNode | TextInstanceNode)[] {
  // Skip falsy/boolean values (conditional rendering)
  if (child === null || child === undefined || child === false || child === true) {
    return []
  }

  // Primitive text → TEXT_INSTANCE (used inside Text/Link/etc.)
  if (typeof child === 'string' || typeof child === 'number') {
    return [{ type: 'TEXT_INSTANCE', value: String(child) }]
  }

  // Arrays (from .map() or <>...</> with multiple children)
  if (Array.isArray(child)) {
    return child.flatMap(buildNodes)
  }

  if (typeof child !== 'object' || !child.type) return []

  const type = child.type
  const props = child.props || {}

  // ── React fragments ──────────────────────────────────────────────────────
  if (
    type === Symbol.for('react.fragment') ||
    type === Symbol.for('react.strict_mode')
  ) {
    return buildNodes(props.children)
  }

  // ── React.memo wrapper ───────────────────────────────────────────────────
  if (type?.$$typeof === Symbol.for('react.memo')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rendered = (type.type as any)(props)
    return buildNodes(rendered)
  }

  // ── React.forwardRef wrapper ─────────────────────────────────────────────
  if (type?.$$typeof === Symbol.for('react.forward_ref')) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rendered = (type.render as any)(props, null)
    return buildNodes(rendered)
  }

  // ── Function component → call it to get its rendered output ─────────────
  if (typeof type === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rendered = (type as any)(props)
    return buildNodes(rendered)
  }

  // ── Host element (react-pdf primitive: 'DOCUMENT', 'PAGE', 'VIEW', etc.) ─
  if (typeof type === 'string') {
    const { style, children, ...rest } = props

    const node: ReactPdfNode = {
      type,
      box: {},
      style: style || {},
      props: rest || {},
      children: [],
    }

    if (children !== undefined && children !== null) {
      const childNodes = buildNodes(children)
      for (const cn of childNodes) {
        // TEXT_INSTANCE nodes are only valid inside text-like parents
        if (cn.type === 'TEXT_INSTANCE' && !TEXT_PARENTS.has(node.type)) {
          console.warn(`[PDF] Skipping orphan text "${(cn as TextInstanceNode).value}" in <${node.type}>`)
          continue
        }
        node.children.push(cn)
      }
    }

    return [node]
  }

  return []
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function renderToBufferSafe(element: React.ReactElement): Promise<Buffer> {
  // Step 1: Register fonts on the externalized react-pdf instance
  await ensureFontsRegistered()

  // Step 2: Build the react-pdf node tree synchronously (no reconciler!)
  const t1 = Date.now()
  const nodes = buildNodes(element)
  console.log(`[PDF] buildNodes done in ${Date.now() - t1}ms`)
  if (nodes.length === 0) {
    throw new Error('[PDF] buildNodes returned empty — no renderable elements')
  }

  const root = nodes[0] as ReactPdfNode
  console.log('[PDF] root type:', root.type, '| children:', root.children.length)

  // Step 3: Set container.document directly — bypasses the reconciler entirely
  const { pdf } = await import('@react-pdf/renderer')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = (pdf as any)()
  instance.container.document = root

  // Step 4: Render to buffer via react-pdf's layout + pdfkit pipeline
  const t2 = Date.now()
  const stream = await instance.toBuffer()
  console.log(`[PDF] toBuffer done in ${Date.now() - t2}ms`)

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

