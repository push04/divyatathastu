import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerClient, serializeCookieHeader } from '@supabase/ssr'
import React from 'react'
import { renderToStream } from '@react-pdf/renderer'
import ReportPDF, { type ReportPDFProps } from '@/components/pdf/ReportPDF'
import { existsSync } from 'fs'
import { join } from 'path'

export const config = {
  api: {
    responseLimit: '50mb',
  },
}

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const reportId = req.query.reportId as string

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map(name => ({ name, value: req.cookies[name] || '' }))
        },
        setAll(cookiesToSet) {
          try {
            res.setHeader(
              'Set-Cookie',
              cookiesToSet.map(c => serializeCookieHeader(c.name, c.value, c.options))
            )
          } catch {}
        },
      },
    })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return res.status(401).send('Unauthorized')
    }

    let canvases: Record<string, string> = {}
    try { canvases = req.body.canvases ?? {} } catch { /* ok */ }

    const { data: report, error: rErr } = await supabase
      .from('reports')
      .select('id, report_type, status, report_content, created_at, family_members(full_name, date_of_birth, place_of_birth)')
      .eq('id', reportId)
      .single()

    if (rErr || !report) return res.status(404).send('Report not found')
    if (!['generated', 'reviewed', 'delivered'].includes(String(report.status)))
      return res.status(422).send('Report not ready')

    const fontCheck = ['cg-400.woff2', 'cg-400i.woff2', 'cg-600.woff2', 'cg-700.woff2', 'cg-700i.woff2', 'lato-400.woff2', 'lato-700.woff2']
      .map(f => `${f}:${existsSync(join(process.cwd(), 'public', 'fonts', f)) ? 'OK' : 'MISSING'}`)
      .join(' ')
    console.log('[PDF Pages API] fonts:', fontCheck)

    const docElement = React.createElement(ReportPDF, { report: report as ReportPDFProps['report'], canvases })

    const stream = await renderToStream(docElement)

    const member = report.family_members as { full_name: string } | null
    const titleSlug = REPORT_TITLE_SLUGS[report.report_type] || 'Report'
    const nameSlug = (member?.full_name || 'Member').replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '_')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${nameSlug}_${titleSlug}.pdf"`)
    res.setHeader('Cache-Control', 'no-store')

    stream.pipe(res)

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? (err.stack || '').slice(0, 800) : ''
    console.error('[PDF Pages API] top-level error:', msg)
    res.status(500).send(`Pages API Error: ${msg}\n${stack}`)
  }
}
