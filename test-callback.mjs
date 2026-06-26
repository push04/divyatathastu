import React from 'react';
import { pdf, Document, Page, Text } from '@react-pdf/renderer';

const doc = React.createElement(Document, null, React.createElement(Page, null, React.createElement(Text, null, 'Hello Callback PDF')));

const renderToBufferWithCallback = async (element) => {
  const instance = pdf();
  await new Promise((resolve) => {
    instance.updateContainer(element, resolve);
  });
  const stream = await instance.toBuffer();
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (error) => reject(error));
  });
};

async function run() {
  try {
    const buf = await renderToBufferWithCallback(doc);
    console.log('Success! Buffer length:', buf.length);
    console.log('Is Buffer?', Buffer.isBuffer(buf));
  } catch (e) {
    console.error('Failed:', e);
  }
}
run();
