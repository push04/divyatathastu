import React from 'react';
import { jsx } from 'react/jsx-runtime';
import { renderToBuffer, Document, Page, Text } from '@react-pdf/renderer';

const MyComponent = ({ text }) => {
  return jsx(Page, { children: jsx(Text, { children: text }) });
};

const doc = jsx(Document, { children: jsx(MyComponent, { text: 'Hello from Component' }) });

console.log('doc typeof:', doc.$$typeof.toString());

async function run() {
  try {
    const b = await renderToBuffer(doc);
    console.log('success', b.length);
  } catch (e) {
    console.error('fail', e.message);
  }
}
run();
