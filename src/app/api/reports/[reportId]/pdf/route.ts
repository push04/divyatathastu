import { createClient } from '@/lib/supabase/server'
import type { ReportPDFProps } from '@/components/pdf/ReportPDF'

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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params

  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Parse body — client sends captured SVG-as-PNG data URLs (optional)
  let canvases: Record<string, string> = {}
  try {
    const body = await req.json()
    canvases = body.canvases ?? {}
  } catch {
    // empty body is fine — canvases remain empty
  }

  // Fetch report with member data
  const { data: report, error: reportErr } = await supabase
    .from('reports')
    .select('id, report_type, status, report_content, created_at, family_members(full_name, date_of_birth, place_of_birth)')
    .eq('id', reportId)
    .single()

  if (reportErr || !report) {
    return new Response('Report not found', { status: 404 })
  }

  // Status check — report must be in a ready state
  if (!['generated', 'reviewed', 'delivered'].includes(String(report.status))) {
    return new Response('Report not ready', { status: 422 })
  }

  // Dynamic imports — keep @react-pdf/renderer server-only
  const [{ default: ReportPDF }, reactPdf] = await Promise.all([
    import('@/components/pdf/ReportPDF'),
    import('@react-pdf/renderer'),
  ])

  const { createElement } = await import('react')

  const props: ReportPDFProps = {
    report: report as ReportPDFProps['report'],
    canvases,
  }

  const doc = createElement(ReportPDF, props)

  // Debug: verify font files are reachable before rendering
  const { existsSync } = await import('fs')
  const { join } = await import('path')
  const fontCheck = ['cg-700.woff2', 'lato-400.woff2'].map(f => {
    const p = join(process.cwd(), 'public', 'fonts', f)
    return `${f}:${existsSync(p) ? 'OK' : 'MISSING'}(cwd=${process.cwd()})`
  }).join(' ')
  console.log('[PDF] font check:', fontCheck)

  // renderToBuffer() calls pdf(element) which calls updateContainer() WITHOUT a callback.
  // In React 18, the reconciler schedules work asynchronously (microtask), so
  // container.document is still null when render() fires immediately after pdf() returns.
  // Fix: use the lower-level pdf() API with an explicit commit callback, then await it.
  let buffer: Buffer
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfInst = (reactPdf as any).pdf(null)  // null → skip auto-updateContainer

    // Wait for the reconciler to fully commit (sets container.document) or timeout
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('PDF reconciler timed out after 20s — a component likely threw silently')),
        20000
      )
      try {
        pdfInst.updateContainer(doc, () => { clearTimeout(timer); resolve() })
      } catch (err) {
        clearTimeout(timer)
        reject(err)
      }
    })

    if (!pdfInst.container?.document) {
      throw new Error('container.document is null after reconciler commit — reconciler failed silently')
    }

    const pdfStream = await pdfInst.toBuffer()
    buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      pdfStream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)))
      pdfStream.on('error', (err: Error) => reject(err))
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack?.slice(0, 800) : ''
    console.error('[PDF] generation failed:', err)
    return new Response(`PDF generation failed: ${msg}\n${stack}\nFonts: ${fontCheck}`, { status: 500 })
  }

  const member = report.family_members as { full_name: string } | null
  const titleSlug = REPORT_TITLE_SLUGS[report.report_type] || 'Report'
  const nameSlug = (member?.full_name || 'Member').replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '_')
  const filename = `${nameSlug}_${titleSlug}.pdf`

  const arrayBuffer = buffer.buffer instanceof ArrayBuffer
    ? buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    : new Uint8Array(buffer).buffer
  return new Response(arrayBuffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'no-store',
    },
  })
}
