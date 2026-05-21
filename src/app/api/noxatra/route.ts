import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReportData } from '@/lib/noxatra/engine'
import type { ReportType } from '@/types/database.types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { family_member_id, report_types, order_id } = body as {
      family_member_id: string; report_types: ReportType[]; order_id?: string
    }

    if (!family_member_id || !report_types?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify family member belongs to user
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('*, families!inner(owner_id)')
      .eq('id', family_member_id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Get user's family
    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

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

      if (reportError || !report) continue

      try {
        // Generate report data
        const reportData = await generateReportData(member, reportType)

        // Update report with generated data
        await supabase
          .from('reports')
          .update({
            status: 'generated',
            raw_data: reportData as any,
            report_content: reportData as any,
          })
          .eq('id', report.id)

        // Create notification
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'report_ready',
          title: `Your ${reportType.replace(/_/g, ' ')} report is ready!`,
          body: `${member.full_name}'s ${reportType.replace(/_/g, ' ')} report has been generated.`,
          data: { report_id: report.id, report_type: reportType } as any,
        })

        results.push({ report_id: report.id, report_type: reportType, status: 'generated' })
      } catch (genError) {
        await supabase
          .from('reports')
          .update({ status: 'pending' })
          .eq('id', report.id)
        results.push({ report_id: report.id, report_type: reportType, status: 'failed' })
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('Noxatra error:', err)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}
