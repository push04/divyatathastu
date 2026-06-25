import { createClient } from '@/lib/supabase/server'
import React from 'react'
import ReportPDF, { type ReportPDFProps } from '@/components/pdf/ReportPDF'
import { existsSync } from 'fs'
import { join } from 'path'

export const maxDuration = 60
// Ensure this runs in Node.js, not Edge
export const runtime = 'nodejs'
// Prevent static rendering of this route
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
  return new Response('pdf-route-alive-v7', { status: 200 })
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

    // Dynamically import react-pdf to isolate it from Next.js server component passes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let reactPdf: any
    try {
      reactPdf = await import('@react-pdf/renderer')
    } catch (e) {
      console.error('Failed to import react-pdf:', e)
      return new Response('Failed to load PDF engine', { status: 500 })
    }

    const { renderToStream } = reactPdf.default || reactPdf

    // Use a standard JSX tree. This passes the Component itself to the reconciler,
    // rather than calling it as a function.
    const docElement = React.createElement(ReportPDF, { report: report as ReportPDFProps['report'], canvases })

    let stream: any
    try {
      stream = await renderToStream(docElement)
    } catch (renderErr) {
      const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
      const stack = renderErr instanceof Error ? (renderErr.stack || '').slice(0, 1200) : ''
      console.error('[PDF] renderToStream threw:', msg)
      return new Response(`renderToStream error: ${msg}\n${stack}\nFonts: ${fontCheck}`, { status: 500 })
    }

    const member = report.family_members as { full_name: string } | null
    const titleSlug = REPORT_TITLE_SLUGS[report.report_type] || 'Report'
    const nameSlug = (member?.full_name || 'Member').replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '_')

    // Convert Node Readable stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)))
        stream.on('end', () => controller.close())
        stream.on('error', (err: Error) => controller.error(err))
      }
    })

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nameSlug}_${titleSlug}.pdf"`,
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
