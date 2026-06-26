import { NextResponse } from 'next/server';
import React from 'react';
import { renderToBufferSafe } from '@/lib/pdf-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { Document, Page, Text } = await import('@react-pdf/renderer');
    const doc = React.createElement(Document, null, React.createElement(Page, null, React.createElement(Text, null, 'Hello Minimal PDF')));
    const buffer = await renderToBufferSafe(doc);
    console.log('[PDF-TEST] SUCCESS buffer length:', buffer.length);
    return new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf' } });
  } catch (e: any) {
    console.error('[PDF-TEST] failed:', e);
    return new NextResponse(e.message + '\n' + (e.stack || ''), { status: 500 });
  }
}
