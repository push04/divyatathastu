'use strict'
// CommonJS wrapper so Turbopack resolves astronomy-engine via the `require`
// export condition (→ astronomy.js, CJS) instead of the `import` condition
// (→ esm/astronomy.js), which crashes when bundled into a CJS chunk.
// eslint-disable-next-line @typescript-eslint/no-require-imports
module.exports = require('astronomy-engine')
