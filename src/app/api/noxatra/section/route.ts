import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateReportDataSafe,
  generateAnnualPrediction,
  generateMuhurtaGuide,
  generateRemediesSummary,
} from '@/lib/noxatra/engine'
import type { ReportType } from '@/types/database.types'

export const maxDuration = 60

// Keys to extract from each individual section result when building a full_tathastu report
function extractForFullTathastu(sectionType: string, data: Record<string, unknown>): Record<string, unknown> {
  switch (sectionType) {
    case 'astrology':
      return { kundli: data.kundli, analysis: data.analysis }
    case 'numerology':
      return { numerology: data.numerology }
    case 'shakti_chakra':
      return { chakras: data.chakras, overallBalance: data.overallBalance }
    case 'prakriti':
      return { prakriti: data.prakriti }
    case 'yantra_colour':
      return { yantra: data.yantra }
    case 'mantra_chanting':
      return { mantras: data.mantras }
    case 'psychology':
      return { psychology: data.psychology }
    case 'astro_vastu':
      return { vastuAnalysis: data.vastu }
    case 'dmit':
      return { dmit: data.dmit }
    case 'colour_therapy':
      return { colourTherapy: data.colourTherapy }
    default:
      return data
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { reportId, sectionType, isFinal } = await req.json() as {
      reportId: string
      sectionType: string
      isFinal?: boolean
    }

    if (!reportId || !sectionType) {
      return NextResponse.json({ error: 'Missing reportId or sectionType' }, { status: 400 })
    }

    // Fetch report + member data in one query
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .select(`
        id, report_type, report_content, raw_data, status,
        family_members!inner(
          id, full_name, date_of_birth, time_of_birth, place_of_birth,
          birth_latitude, birth_longitude, birth_timezone, gender, mobile_number,
          families!inner(owner_id)
        )
      `)
      .eq('id', reportId)
      .single()

    if (reportErr || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Verify ownership
    const fm = report.family_members as any
    if (fm?.families?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const member = fm as {
      id: string; full_name: string; date_of_birth: string; time_of_birth: string | null
      place_of_birth: string; birth_latitude: number | null; birth_longitude: number | null
      birth_timezone: string | null; gender: string | null; mobile_number: string | null
    }

    const existingContent = (report.report_content || {}) as Record<string, unknown>
    const rawData = (report.raw_data || {}) as Record<string, unknown>
    const vastu = rawData.vastu as { homeDirection: string; sleepDirection: string } | undefined
    const isFullTathastu = report.report_type === 'full_tathastu'

    let newData: Record<string, unknown> = {}

    if (sectionType === '_finale') {
      // Generate the full_tathastu-only sections using cached kundli + numerology
      const kundli = existingContent.kundli as any
      const numerology = existingContent.numerology as any

      if (!kundli) {
        return NextResponse.json({ error: 'Kundli not yet generated — run astrology section first' }, { status: 400 })
      }

      newData = {
        annualPrediction: generateAnnualPrediction(kundli),
        muhurta: generateMuhurtaGuide(kundli, numerology || { luckyNumbers: [1, 3, 5], luckyDays: ['Monday', 'Thursday'], personalYearNumber: 5 }),
        remediesSummary: generateRemediesSummary(kundli, numerology || { luckyNumbers: [1, 3, 5], luckyDays: ['Monday', 'Thursday'] }),
      }
    } else {
      // Generate this section using the calculation engine
      const { data: sectionData, error: genErr } = await generateReportDataSafe(
        member,
        sectionType as ReportType,
        sectionType === 'astro_vastu' ? vastu : undefined
      )

      if (genErr || !sectionData) {
        return NextResponse.json({ error: genErr || 'Generation failed' }, { status: 500 })
      }

      // For full_tathastu, only extract the relevant keys with correct field names
      newData = isFullTathastu ? extractForFullTathastu(sectionType, sectionData) : sectionData
    }

    // Merge with existing content
    const merged: Record<string, unknown> = {
      ...existingContent,
      ...newData,
      // Always keep member info from the first section
      member: (existingContent.member as any) || { name: member.full_name, dob: member.date_of_birth, pob: member.place_of_birth },
    }

    // If first astrology section, make sure member info is updated from the richer version
    if (sectionType === 'astrology' && newData.kundli) {
      merged.member = { name: member.full_name, dob: member.date_of_birth, pob: member.place_of_birth }
    }

    const { error: updateErr } = await supabase
      .from('reports')
      .update(isFinal
        ? { report_content: merged as any, status: 'generated' as any }
        : { report_content: merged as any }
      )
      .eq('id', reportId)

    if (updateErr) {
      return NextResponse.json({ error: `DB update failed: ${updateErr.message}` }, { status: 500 })
    }

    // Fire notification when fully done
    if (isFinal) {
      void Promise.resolve(
        supabase.from('notifications').insert({
          user_id: user.id,
          type: 'report_ready',
          title: `Your ${report.report_type.replace(/_/g, ' ')} report is ready!`,
          body: `${member.full_name}'s report has been generated.`,
          data: { report_id: reportId, report_type: report.report_type } as any,
        })
      ).catch(() => {})
    }

    return NextResponse.json({ success: true, section: sectionType, isFinal: !!isFinal })
  } catch (err) {
    console.error('Section generation error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Section generation failed' }, { status: 500 })
  }
}
