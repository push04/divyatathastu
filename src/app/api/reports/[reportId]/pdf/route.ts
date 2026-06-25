// @react-pdf/renderer is auto-externalized by Turbopack because it uses
// Node.js built-ins (fs, buffer). When external, its bundled reconciler's
// flushSyncWork() runs in an isolated scheduler context that Next.js's server
// execution interferes with — making it a no-op. container.document stays null.
//
// FIX: Use pdf() directly with the event-based 'change' API.
// react-pdf fires 'change' from resetAfterCommit (AFTER appendChildToContainer
// sets container.document). By awaiting the change event before calling
// toBuffer(), we bypass flushSyncWork entirely and work with either sync or
// async reconciler commits.
import { createClient } from '@/lib/supabase/server'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { pdf } from '@react-pdf/renderer'
import ReportPDF, { type ReportPDFProps } from '@/components/pdf/ReportPDF'
import { existsSync } from 'fs'
import { join } from 'path'

export const maxDuration = 60

const REPORT_TITLE_SLUGS: Record<string, string> = {
  full_tathastu: 'Full_Tathastu_Report',
  astrology: 'Kundli_Birth_Chart',
  numerology: 'Numerology_Analysis',
  shakti_chakra: 'Shakti_Chakra_Report',
  prakriti: 'Prakriti_Ayurveda',
  yantra_colour: 'Yantra_Colour_Therapy',
  mantra_chanting: 'Mantra_Chanting_Guide',
  mantra_writing: 'Likhit_Japa_Guide',
  astro_vastu: 'Astro_Vastu_Report',
  psychology: 'Vedic_Psychology',
  dmit: 'DMIT_Intelligence',
  colour_therapy: 'Colour_Therapy',
  child_development: 'Child_Development',
  mobile_number: 'Mobile_Number_Analysis',
}

export async function GET() {
  return new Response('pdf-route-alive-v6', { status: 200 })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return new Response('Unauthorized', { status: 401 })

    let canvases: Record<string, string> = {}
    try { const b = await req.json(); canvases = b.canvases ?? {} } catch { /* ok */ }

    const { data: report, error: rErr } = await supabase
      .from('reports')
      .select('id, report_type, status, report_content, created_at, family_members(full_name, date_of_birth, place_of_birth)')
      .eq('id', reportId)
      .single()

    if (rErr || !report) return new Response('Report not found', { status: 404 })
    if (!['generated', 'reviewed', 'delivered'].includes(String(report.status)))
      return new Response('Report not ready', { status: 422 })

    // Font check
    const fontCheck = ['cg-400.woff2', 'cg-400i.woff2', 'cg-600.woff2', 'cg-700.woff2', 'cg-700i.woff2', 'lato-400.woff2', 'lato-700.woff2']
      .map(f => `${f}:${existsSync(join(process.cwd(), 'public', 'fonts', f)) ? 'OK' : 'MISSING'}`)
      .join(' ')
    console.log('[PDF] fonts:', fontCheck)

    // Build the react-pdf element tree by calling the component directly
    const docElement = ReportPDF({ report: report as ReportPDFProps['report'], canvases })

    // Create a pdf() instance WITHOUT an initial value so updateContainer
    // hasn't been called yet and no reconciler work is queued.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const instance = (pdf as any)()

    // Wait for the reconciler's resetAfterCommit hook to fire ('change' event).
    // This is guaranteed to fire AFTER appendChildToContainer sets
    // container.document. Works whether the commit is sync or async — no
    // dependency on flushSyncWork being functional in the server context.
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error(`PDF reconciler timeout — container.document=${JSON.stringify(instance.container?.document)}`)),
        30_000
      )
      instance.on('change', () => { clearTimeout(timeout); resolve() })
      instance.updateContainer(docElement)
      // Guard: if the reconciler committed synchronously before we registered
      // the listener (very rare in async server context, common locally):
      if (instance.container?.document) { clearTimeout(timeout); resolve() }
    })

    console.log('[PDF] container.document set:', !!instance.container?.document)

    let buffer: Buffer
    try {
      // toBuffer() calls render() which now safely reads container.document.props
      const stream = await instance.toBuffer()
      buffer = await new Promise<Buffer>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chunks: Buffer[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).on('data', (c: Buffer) => chunks.push(c));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).on('end', () => resolve(Buffer.concat(chunks)));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).on('error', reject)
      })
    } catch (renderErr) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
      const stack = renderErr instanceof Error ? (renderErr.stack || '').slice(0, 1200) : ''
      console.error('[PDF] toBuffer threw:', msg)
      return new Response(`toBuffer error: ${msg}\n${stack}\nFonts: ${fontCheck}`, { status: 500 })
    }

    const member = report.family_members as { full_name: string } | null
    const titleSlug = REPORT_TITLE_SLUGS[report.report_type] || 'Report'
    const nameSlug = (member?.full_name || 'Member').replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '_')

    const ab = buffer.buffer instanceof ArrayBuffer
      ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
      : new Uint8Array(buffer).buffer

    return new Response(ab as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nameSlug}_${titleSlug}.pdf"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? (err.stack || '').slice(0, 800) : ''
    console.error('[PDF] top-level error:', msg)
    return new Response(`Error: ${msg}\n${stack}`, { status: 500 })
  }
}
