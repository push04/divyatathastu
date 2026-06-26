/**
 * Safe server-side PDF rendering utilities.
 *
 * WHY THIS EXISTS:
 * @react-pdf/renderer's built-in `renderToBuffer(element)` calls:
 *   1. `pdf(element)` — creates a container and immediately calls `updateContainer(element)` WITHOUT a callback
 *   2. `instance.toBuffer()` — which calls `render()` → `container.document.props` → CRASH if doc is null
 *
 * On Vercel (and other server environments), `updateContainer` without a callback
 * relies on `flushSyncWork()` to synchronously flush the React reconciler.
 * This fails when react-pdf's isolated scheduler context can't flush synchronously.
 *
 * THE FIX: Use `pdf()` + `updateContainer(element, callback)` — the callback
 * fires only after the reconciler has fully committed the tree (guaranteed),
 * so `container.document` is never null when we call `toBuffer()`.
 */

// These are dynamic imports — react-pdf is kept in serverExternalPackages so
// it loads its own isolated CJS React instance (one that has
// __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE available).
// Static top-level imports would make Turbopack bundle it with server React.

export async function renderToBufferSafe(element: React.ReactElement): Promise<Buffer> {
  // Dynamic import ensures react-pdf uses its own isolated Node.js require
  const { pdf } = await import('@react-pdf/renderer')

  const instance = (pdf as any)()

  // Wait for the reconciler to fully commit the element tree
  await new Promise<void>((resolve, reject) => {
    try {
      instance.updateContainer(element, () => resolve())
    } catch (err) {
      reject(err)
    }
  })

  // Now container.document is guaranteed to be non-null
  const stream = await instance.toBuffer()

  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
