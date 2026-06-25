import React from 'react';
import { renderToBuffer, Document, Page, Image } from '@react-pdf/renderer';

const doc = React.createElement(Document, null, React.createElement(Page, null, React.createElement(Image, { src: undefined })));

async function run() {
  try {
    const b = await renderToBuffer(doc);
    console.log('success', b.length);
  } catch (e) {
    console.error('fail', e.message);
  }
}
run();
