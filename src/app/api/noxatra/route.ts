import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReportType } from '@/types/database.types'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { family_member_id, report_types, order_id, vastu } = body as {
      family_member_id: string
      report_types: ReportType[]
      order_id?: string
      vastu?: { homeDirection: string; sleepDirection: string }
    }

    if (!family_member_id || !report_types?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Payment gate: the UI only calls this after checkout, but nothing stops calling
    // this API directly — verify server-side that each requested report type is either
    // priced free (per the same authoritative pricing payment/create uses) or covered
    // by one of this user's own paid orders, before generating any (costly) content.
    const { data: pricingSetting } = await (supabase as any)
      .from('settings').select('value').eq('key', 'report_pricing').single()
    const reportPrices: Record<string, number> = pricingSetting?.value || {}

    const unpaidTypes = report_types.filter(rt => (reportPrices[rt] ?? 1) > 0)
    if (unpaidTypes.length) {
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('items')
        .eq('user_id', user.id)
        .eq('status', 'paid')
      const paidReportIds = new Set(
        (paidOrders || []).flatMap((o: any) =>
          ((o.items as any[]) || [])
            .filter(i => i.product_type === 'report')
            .map(i => i.id)
        )
      )
      const stillUnpaid = unpaidTypes.filter(rt => !paidReportIds.has(rt))
      if (stillUnpaid.length) {
        return NextResponse.json({ error: `Payment required for: ${stillUnpaid.join(', ')}` }, { status: 402 })
      }
    }

    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 })

    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('id, full_name')
      .eq('id', family_member_id)
      .eq('family_id', family.id)
      .single()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 })
    }

    // Create report records immediately — return IDs without blocking on generation
    const results = []
    for (const reportType of report_types) {
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          family_member_id,
          family_id: family.id,
          report_type: reportType,
          status: 'processing',
          order_id: order_id || null,
          // Store vastu input and member name for section generation later
          raw_data: { vastu: vastu || null, memberName: member.full_name } as any,
        })
        .select('id')
        .single()

      if (reportError || !report) {
        results.push({ report_id: null, report_type: reportType, status: 'failed' })
        continue
      }

      results.push({ report_id: report.id, report_type: reportType, status: 'processing' })
    }

    const primary = results[0]
    return NextResponse.json({
      success: true,
      results,
      reportId: primary?.report_id,
      reportType: primary?.report_type,
    })
  } catch (err) {
    console.error('Nakshatra create error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
