import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBufferSafe } from '@/lib/pdf-utils';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Debug endpoint — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  try {
    // Test 1: Simple inline element (host elements only, no function component)
    const { Document, Page, Text } = await import('@react-pdf/renderer');
    const simpleDoc = React.createElement(Document, null,
      React.createElement(Page, null,
        React.createElement(Text, null, 'Hello Minimal PDF - host elements only')
      )
    );
    const simpleBuffer = await renderToBufferSafe(simpleDoc);
    console.log('[PDF-TEST] Simple (host-only) buffer length:', simpleBuffer.length);

    // Test 2: Call ReportPDF as a plain function (same as main route does)
    const { default: ReportPDF } = await import('@/components/pdf/ReportPDF');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockReport = {
      id: 'test',
      report_type: 'numerology',
      status: 'generated',
      created_at: new Date().toISOString(),
      report_content: { numerology: { lifePathNumber: 7, expressionNumber: 5, soulUrgeNumber: 3 } },
      family_members: { full_name: 'Test User', date_of_birth: '1990-01-01', place_of_birth: 'Delhi' },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const componentDoc = (ReportPDF as any)({ report: mockReport, canvases: {} });
    console.log('[PDF-TEST] ReportPDF() returned type:', componentDoc?.type);
    const componentBuffer = await renderToBufferSafe(componentDoc);
    console.log('[PDF-TEST] Component buffer length:', componentBuffer.length);

    return new NextResponse(
      `Test 1 (simple): ${simpleBuffer.length} bytes\nTest 2 (ReportPDF function call): ${componentBuffer.length} bytes`,
      { status: 200, headers: { 'Content-Type': 'text/plain' } }
    );
  } catch (e: any) {
    console.error('[PDF-TEST] failed:', e);
    return new NextResponse(e.message + '\n' + (e.stack || ''), { status: 500 });
  }
}
