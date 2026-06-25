import { createClient } from '@/lib/supabase/server'
import type { ReportPDFProps } from '@/components/pdf/ReportPDF'
import { Component, createElement, type ReactNode } from 'react'

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

// Module-level error boundary — must be at top level for React reconciler to recognise it
interface BoundaryProps {
  children?: ReactNode
  capture: { error: Error | null }
  FallbackDoc: React.ElementType
  FallbackPage: React.ElementType
}
class PDFErrorBoundary extends Component<BoundaryProps, { hasError: boolean }> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    this.props.capture.error = error
  }
  render() {
    if (this.state.hasError) {
      const { FallbackDoc, FallbackPage } = this.props
      return createElement(FallbackDoc, {}, createElement(FallbackPage, { size: 'A4' }))
    }
    return this.props.children
  }
}

export async function GET() {
  return new Response('pdf-route-alive-v2', { status: 200 })
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

    const [{ default: ReportPDF }, { renderToBuffer, Document, Page }] = await Promise.all([
      import('@/components/pdf/ReportPDF'),
      import('@react-pdf/renderer'),
    ])

    // Error capture object — shared between error boundary (render phase) and our handler
    const capture: { error: Error | null } = { error: null }

    const doc = createElement(PDFErrorBoundary, {
      capture,
      FallbackDoc: Document,
      FallbackPage: Page,
    }, createElement(ReportPDF, { report: report as ReportPDFProps['report'], canvases }))

    const { existsSync } = await import('fs')
    const { join } = await import('path')
    const fontCheck = ['cg-400.woff2', 'cg-400i.woff2', 'cg-600.woff2', 'cg-700.woff2', 'cg-700i.woff2', 'lato-400.woff2', 'lato-700.woff2']
      .map(f => `${f}:${existsSync(join(process.cwd(), 'public', 'fonts', f)) ? 'OK' : 'MISSING'}`)
      .join(' ')
    console.log('[PDF] fonts:', fontCheck)

    let buffer: Buffer
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buffer = await renderToBuffer(doc as any)
    } catch (renderErr) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
      const stack = renderErr instanceof Error ? (renderErr.stack || '').slice(0, 1000) : ''
      console.error('[PDF] renderToBuffer threw:', msg)
      const capturedMsg = capture.error ? ` | component: ${capture.error.message}` : ''
      return new Response(`renderToBuffer error: ${msg}${capturedMsg}\n${stack}\nFonts: ${fontCheck}`, { status: 500 })
    }

    // If error boundary caught a real component error, surface it now
    if (capture.error) {
      const msg = capture.error.message
      const stack = (capture.error.stack || '').slice(0, 1200)
      console.error('[PDF] component error (via boundary):', msg)
      return new Response(`Component render error: ${msg}\n${stack}\nFonts: ${fontCheck}`, { status: 500 })
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
