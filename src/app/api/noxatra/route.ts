import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReportDataSafe } from '@/lib/noxatra/engine'
import type { ReportType } from '@/types/database.types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { family_member_id, report_types, order_id, vastu } = body as {
      family_member_id: string; report_types: ReportType[]; order_id?: string
      vastu?: { homeDirection: string; sleepDirection: string }
    }

    if (!family_member_id || !report_types?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's family first, then verify member belongs to it
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('*')
      .eq('id', family_member_id)
      .eq('family_id', family.id)
      .single()

    if (memberError || !member) {
      console.error('Member lookup error:', memberError)
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Create report records and process
    const results = []
    for (const reportType of report_types) {
      // Create pending report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          family_member_id,
          family_id: family.id,
          report_type: reportType,
          status: 'processing',
          order_id: order_id || null,
        })
        .select()
        .single()

      if (reportError || !report) {
        console.error(`Report insert error [${reportType}]:`, reportError)
        results.push({ report_id: null, report_type: reportType, status: 'failed', error: reportError?.message || 'Database insert failed' })
        continue
      }

      const { data: reportData, error: genError } = await generateReportDataSafe(
        member, reportType, reportType === 'astro_vastu' ? vastu : undefined
      )

      let reportStatus: 'generated' | 'failed' = 'failed'
      let errorDetail = ''

      if (genError || !reportData) {
        errorDetail = genError ?? 'Engine returned no data'
        console.error(`Report generation error [${reportType}]: ${errorDetail}`)
        await supabase.from('reports').update({ status: 'failed' }).eq('id', report.id)
      } else {
        const { error: updateError } = await supabase
          .from('reports')
          .update({
            status: 'generated',
            raw_data: reportData as any,
            report_content: reportData as any,
          })
          .eq('id', report.id)

        if (updateError) {
          errorDetail = `DB update failed: ${updateError.message}`
          console.error(`Report update error [${reportType}]:`, updateError)
          await supabase.from('reports').update({ status: 'failed' }).eq('id', report.id)
        } else {
          reportStatus = 'generated'
        }
      }

      results.push({ report_id: report.id, report_type: reportType, status: reportStatus, error: errorDetail || undefined })

      // Fire-and-forget — notification failure must never undo a successful report
      if (reportStatus === 'generated') {
        void Promise.resolve(
          supabase.from('notifications').insert({
            user_id: user.id,
            type: 'report_ready',
            title: `Your ${reportType.replace(/_/g, ' ')} report is ready!`,
            body: `${member.full_name}'s ${reportType.replace(/_/g, ' ')} report has been generated.`,
            data: { report_id: report.id, report_type: reportType } as any,
          })
        ).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('Noxatra error:', err)
    const msg = err instanceof Error ? err.message : 'Report generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
