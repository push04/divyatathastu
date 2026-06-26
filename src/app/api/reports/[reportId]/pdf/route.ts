import { createClient } from '@/lib/supabase/server'
import type { ReportPDFProps } from '@/components/pdf/ReportPDF'
import { renderToBufferSafe } from '@/lib/pdf-utils'

export const maxDuration = 60
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
  return new Response('pdf-route-alive-v9', { status: 200 })
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

    // Ownership guard — users can only download PDFs for their own family's reports
    const { data: family } = await supabase.from('families').select('id').eq('owner_id', user.id).single()
    if (!family) return new Response('Report not found', { status: 404 })

    const { data: report, error: rErr } = await supabase
      .from('reports')
      .select('id, report_type, status, report_content, created_at, family_members(full_name, date_of_birth, place_of_birth)')
      .eq('id', reportId)
      .eq('family_id', (family as any).id)
      .single()

    if (rErr || !report) return new Response('Report not found', { status: 404 })
    if (!['generated', 'reviewed', 'delivered'].includes(String(report.status)))
      return new Response('Report not ready', { status: 422 })

    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const fontCheck = ['cg-400.woff2', 'cg-400i.woff2', 'cg-600.woff2', 'cg-700.woff2', 'cg-700i.woff2', 'lato-400.woff2', 'lato-700.woff2']
      .map(f => `${f}:${existsSync(join(process.cwd(), 'public', 'fonts', f)) ? 'OK' : 'MISSING'}`)
      .join(' ')
    console.log('[PDF] fonts:', fontCheck)
    console.log('[PDF] report_type:', report.report_type)

    // CRITICAL: Call ReportPDF() as a PLAIN FUNCTION, not as a React element.
    // When we do createElement(ReportPDF, props), the reconciler must call the
    // function-component itself during its async render phase. On Vercel production,
    // this async function-component resolution doesn't complete before the scheduler
    // moves on, leaving container.document null.
    //
    // By calling ReportPDF() directly here, we get a pre-resolved element tree
    // rooted at Document (a host element / string type 'DOCUMENT'). The reconciler
    // only needs to mount host elements — no async function-component resolution
    // needed — and appendChildToContainer is reliably called.
    //
    // This is the same pattern used in commit b50ca65 which was previously confirmed
    // to work for this exact scenario.
    const { default: ReportPDF } = await import('@/components/pdf/ReportPDF')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (ReportPDF as any)({ report: report as ReportPDFProps['report'], canvases })
    if (!doc) {
      return new Response('ReportPDF() returned null — no content to render', { status: 500 })
    }
    console.log('[PDF] doc element type:', doc?.type, 'props keys:', Object.keys(doc?.props || {}).join(','))

    let buffer: Buffer
    try {
      buffer = await renderToBufferSafe(doc)
    } catch (renderErr) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
      const stack = renderErr instanceof Error ? (renderErr.stack || '').slice(0, 1200) : ''
      console.error('[PDF] render pipeline failed:', msg)
      return new Response(`renderToBuffer error: ${msg}\n${stack}\nFonts: ${fontCheck}`, { status: 500 })
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
