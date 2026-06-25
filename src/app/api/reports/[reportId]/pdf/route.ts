import { createClient } from '@/lib/supabase/server'
import type { ReportPDFProps } from '@/components/pdf/ReportPDF'

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

    const { data: report, error: rErr } = await supabase
      .from('reports')
      .select('id, report_type, status, report_content, created_at, family_members(full_name, date_of_birth, place_of_birth)')
      .eq('id', reportId)
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

    // All React/PDF imports are dynamic to avoid Turbopack static-analysis restrictions
    const [{ default: ReportPDF }, { pdf: pdfFactory }, { createElement }] = await Promise.all([
      import('@/components/pdf/ReportPDF'),
      import('@react-pdf/renderer'),
      import('react'),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = createElement(ReportPDF as any, { report: report as ReportPDFProps['report'], canvases })

    // ROOT CAUSE FIX:
    // @react-pdf/reconciler v4.5.1 (reconciler-33.js for React 19.2+) hardcodes
    // ConcurrentMode (mode=1) in createContainer. This makes updateContainer async
    // (scheduled via setImmediate by the React scheduler). renderToBuffer calls
    // render() synchronously before the async work runs → container.document is null.
    //
    // Fix: use pdf() + updateContainer(doc, callback). The callback fires AFTER the
    // reconciler commits, guaranteeing container.document is set before we call toBuffer().
    let buffer: Buffer
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = (pdfFactory as any)()

      // Capture component errors: React 19 ConcurrentMode swallows them and rethrows
      // via setTimeout. We intercept to get the real error message.
      const renderResult = await new Promise<'ok' | Error>((resolve) => {
        const tid = setTimeout(() => {
          process.off('uncaughtException', onErr)
          resolve(new Error('PDF reconciler timeout (30s)'))
        }, 30000)

        const onErr = (e: Error) => {
          clearTimeout(tid)
          resolve(e)
        }
        process.once('uncaughtException', onErr)

        // updateContainer(doc, callback) — callback fires after reconciler commits
        instance.updateContainer(doc, () => {
          clearTimeout(tid)
          process.off('uncaughtException', onErr)
          resolve('ok')
        })
      })

      if (renderResult !== 'ok') {
        const err = renderResult as Error
        console.error('[PDF] component render error:', err.message)
        return new Response(
          `PDF render error: ${err.message}\n${(err.stack || '').slice(0, 800)}\nFonts: ${fontCheck}`,
          { status: 500 }
        )
      }

      // container.document is now committed — safe to render the PDF stream
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream = await (instance as any).toBuffer()
      buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stream.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
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
