import React from 'react';
import { renderToBuffer, Document, Page, Text } from '@react-pdf/renderer';

const NullComponent = () => null;

const doc = React.createElement(Document, null, [
  React.createElement(Page, { key: '1' }, React.createElement(Text, null, 'Hello')),
  React.createElement(NullComponent, { key: '2' })
]);

renderToBuffer(doc).then(b => console.log('success', b.length)).catch(e => console.error(e.message));
