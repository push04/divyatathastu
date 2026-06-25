import React from 'react';
import { jsx } from 'react/jsx-runtime';
import { renderToBuffer, Document, Page, Text } from '@react-pdf/renderer';

// React.createElement uses react.element
const doc1 = React.createElement(Document, null, React.createElement(Page, null, React.createElement(Text, null, 'createElement')));

// jsx() uses react.transitional.element
const doc2 = jsx(Document, { children: jsx(Page, { children: jsx(Text, { children: 'jsx runtime' }) }) });

console.log('doc1 typeof:', doc1.$$typeof.toString());
console.log('doc2 typeof:', doc2.$$typeof.toString());

async function run() {
  try {
    const b1 = await renderToBuffer(doc1);
    console.log('doc1 success', b1.length);
  } catch (e) {
    console.error('doc1 fail', e.message);
  }
  try {
    const b2 = await renderToBuffer(doc2);
    console.log('doc2 success', b2.length);
  } catch (e) {
    console.error('doc2 fail', e.message);
  }
}
run();
