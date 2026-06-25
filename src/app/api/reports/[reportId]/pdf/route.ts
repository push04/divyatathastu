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
  // ── Wrap EVERYTHING in a top-level try/catch so Next.js never returns a blank 500 ──
  try {
    const { reportId } = await params

    const supabase = await createClient()
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    let canvases: Record<string, string> = {}
    try {
      const body = await req.json()
      canvases = body.canvases ?? {}
    } catch {
      // empty body is fine
    }

    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .select('id, report_type, status, report_content, created_at, family_members(full_name, date_of_birth, place_of_birth)')
      .eq('id', reportId)
      .single()

    if (reportErr || !report) {
      return new Response('Report not found', { status: 404 })
    }

    if (!['generated', 'reviewed', 'delivered'].includes(String(report.status))) {
      return new Response('Report not ready', { status: 422 })
    }

    // ── Step 1: import react-pdf ──────────────────────────────────────────────
    console.log('[PDF] importing react-pdf…')
    let reactPdf: typeof import('@react-pdf/renderer')
    try {
      reactPdf = await import('@react-pdf/renderer')
      console.log('[PDF] react-pdf imported OK')
    } catch (e) {
      const m = e instanceof Error ? e.stack || e.message : String(e)
      console.error('[PDF] react-pdf import failed:', m)
      return new Response(`react-pdf import failed: ${m}`, { status: 500 })
    }

    // ── Step 2: import React (same instance as react-pdf uses) ───────────────
    console.log('[PDF] importing react…')
    let React: typeof import('react')
    try {
      React = await import('react')
      console.log('[PDF] react imported OK, version:', (React as any).version)
    } catch (e) {
      const m = e instanceof Error ? e.stack || e.message : String(e)
      console.error('[PDF] react import failed:', m)
      return new Response(`react import failed: ${m}`, { status: 500 })
    }

    // ── Step 3: import ReportPDF component ───────────────────────────────────
    console.log('[PDF] importing ReportPDF…')
    let ReportPDF: React.ComponentType<ReportPDFProps>
    try {
      const mod = await import('@/components/pdf/ReportPDF')
      ReportPDF = mod.default
      console.log('[PDF] ReportPDF imported OK')
    } catch (e) {
      const m = e instanceof Error ? e.stack || e.message : String(e)
      console.error('[PDF] ReportPDF import failed:', m)
      return new Response(`ReportPDF import failed: ${m}`, { status: 500 })
    }

    // ── Step 4: font check ───────────────────────────────────────────────────
    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const allFonts = ['cg-400.woff2','cg-400i.woff2','cg-600.woff2','cg-700.woff2','cg-700i.woff2','lato-400.woff2','lato-700.woff2']
    const fontCheck = allFonts.map(f => {
      const p = join(process.cwd(), 'public', 'fonts', f)
      return `${f}:${existsSync(p) ? 'OK' : 'MISSING'}`
    }).join(' ')
    console.log('[PDF] fonts:', fontCheck)

    // ── Step 5: error boundary class ─────────────────────────────────────────
    const caughtErrors: string[] = []
    class PDFErrorCatcher extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
      }
      static getDerivedStateFromError(error: Error) {
        caughtErrors.push(
          `${error?.message || String(error)}\n${error?.stack || ''}`.slice(0, 1000)
        )
        return { hasError: true }
      }
      render(): React.ReactNode {
        return this.state.hasError ? null : this.props.children
      }
    }

    // ── Step 6: render ───────────────────────────────────────────────────────
    const props: ReportPDFProps = { report: report as ReportPDFProps['report'], canvases }
    const doc = React.createElement(PDFErrorCatcher, null, React.createElement(ReportPDF, props))

    console.log('[PDF] starting reconciler render…')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfInst = (reactPdf as any).pdf(null)

    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('reconciler timed out after 20s')), 20000)
        try {
          pdfInst.updateContainer(doc, () => { clearTimeout(timer); resolve() })
        } catch (err) {
          clearTimeout(timer); reject(err)
        }
      })
    } catch (e) {
      const m = e instanceof Error ? e.stack || e.message : String(e)
      console.error('[PDF] reconciler threw:', m)
      return new Response(`reconciler error: ${m}\nFonts: ${fontCheck}`, { status: 500 })
    }

    console.log('[PDF] reconciler done. caughtErrors:', caughtErrors.length, 'container.document:', !!pdfInst.container?.document)

    if (caughtErrors.length > 0) {
      const msg = `PDF component error:\n${caughtErrors.join('\n---\n')}`
      console.error('[PDF]', msg)
      return new Response(`${msg}\nFonts: ${fontCheck}`, { status: 500 })
    }

    if (!pdfInst.container?.document) {
      const msg = 'container.document is null (error boundary did not fire)'
      console.error('[PDF]', msg)
      return new Response(`${msg}\nFonts: ${fontCheck}`, { status: 500 })
    }

    // ── Step 7: stream to buffer ─────────────────────────────────────────────
    console.log('[PDF] calling toBuffer…')
    let buffer: Buffer
    try {
      const pdfStream = await pdfInst.toBuffer()
      buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        pdfStream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
        pdfStream.on('end', () => resolve(Buffer.concat(chunks)))
        pdfStream.on('error', (err: Error) => reject(err))
      })
      console.log('[PDF] buffer ready, bytes:', buffer.length)
    } catch (e) {
      const m = e instanceof Error ? e.stack || e.message : String(e)
      console.error('[PDF] toBuffer failed:', m)
      return new Response(`toBuffer failed: ${m}\nFonts: ${fontCheck}`, { status: 500 })
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

  } catch (topLevel) {
    // Safety net — catches anything that escaped inner try/catch blocks
    const m = topLevel instanceof Error ? topLevel.stack || topLevel.message : String(topLevel)
    console.error('[PDF] top-level uncaught error:', m)
    return new Response(`Internal error: ${m}`, { status: 500 })
  }
}
