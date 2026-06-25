import { NextResponse } from 'next/server';
import { renderToBuffer, Document, Page, Text } from '@react-pdf/renderer';
import React from 'react';

export async function GET() {
  try {
    const doc = React.createElement(Document, null, React.createElement(Page, null, React.createElement(Text, null, 'Hello Minimal PDF')));
    const buffer = await renderToBuffer(doc);
    return new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf' } });
  } catch (e: any) {
    return new NextResponse(e.message, { status: 500 });
  }
}
