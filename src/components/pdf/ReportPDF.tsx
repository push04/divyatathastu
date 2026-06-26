import React from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet,
  Svg, Circle, Ellipse, Polygon, Path,
} from '@react-pdf/renderer'

// ── NOTE: Font.register() is intentionally NOT here. ─────────────────────────
// @react-pdf/renderer is in serverExternalPackages so it loads as an isolated
// CJS module instance. ReportPDF.tsx is bundled by Turbopack and gets a
// DIFFERENT react-pdf instance. Font.register() calls here would silently
// register fonts on the wrong instance and the renderer would never see them.
//
// Font registration is done in src/lib/pdf-utils.ts via dynamic import(),
// which guarantees it runs on the same externalized CJS instance as the renderer.
// ─────────────────────────────────────────────────────────────────────────────

// ── Brand colours ─────────────────────────────────────────────────────────────
// Premium design tokens (WCAG AA compliant on their intended backgrounds)
const C = {
  // --- new premium tokens ---
  bgPage:        '#F4ECD8',  // warm cream page bg
  bgDark:        '#162040',  // deep navy for headers/footers
  bgCard:        '#EDE3CC',  // slightly darker cream for cards
  bgAccent:      '#1E2D55',  // secondary navy

  // contrast: 16:1 on bgPage
  textPrimary:   '#1C1409',
  // contrast: 9:1 on bgPage
  textSecondary: '#3A2E1A',
  // contrast: 5.5:1 on bgPage
  textMeta:      '#5C4A2A',
  // contrast: 12:1 on bgDark
  textOnDark:    '#F0E6CE',
  // contrast: 6:1 on bgDark
  goldOnDark:    '#D4A843',
  // contrast: 6.5:1 on bgPage
  goldOnCream:   '#7A5A0A',

  // decorative (not for body text)
  goldBright:    '#C9912A',
  goldLight:     '#E2B96A',

  // accent — max 2 uses per page; contrast: 8:1 on bgPage
  vermillion:    '#7A1212',

  // borders
  borderStrong:  '#B8922A',
  borderSubtle:  '#D4B86A',

  // --- backward-compatible aliases (keep all existing section pages working) ---
  navyDark:      '#162040',
  navy:          '#162040',
  navyMid:       '#1E2D55',
  saffron:       '#E36414',
  saffronDark:   '#A33D00',
  saffronLight:  '#F5A623',
  gold:          '#C9912A',
  goldMid:       '#B8922A',
  goldPale:      '#E2B96A',
  warmSand:      '#EDE3CC',
  parchment:     '#F4ECD8',
  offWhite:      '#FDF8EE',
  charcoal:      '#3A2E1A',
  crimson:       '#7A1212',
  white:         '#FFFFFF',
  gray:          '#5C4A2A',
  grayLight:     '#D4B86A',
  grayMid:       '#8B7355',
  text:          '#3A2E1A',
  textDark:      '#1C1409',
  emerald:       '#059669',
  amber:         '#d97706',
  purple:        '#7c3aed',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.parchment,
    paddingTop: 34,
    paddingBottom: 34,
    paddingLeft: 32,
    paddingRight: 32,
    fontFamily: 'Lato',
    position: 'relative',
  },
  h1: { fontSize: 19, fontFamily: 'CGb', color: C.navy, marginBottom: 5 },
  h2: { fontSize: 13, fontFamily: 'CGb', color: C.navy, marginBottom: 4 },
  h3: { fontSize: 10.5, fontFamily: 'CGb', color: C.navy, marginBottom: 3 },
  label: { fontSize: 7, fontFamily: 'LatoBold', color: C.grayMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'LatoBold', color: C.navy },
  body: { fontSize: 9, fontFamily: 'Lato', color: C.charcoal, lineHeight: 1.6 },
  bodySmall: { fontSize: 8, fontFamily: 'Lato', color: C.text, lineHeight: 1.55 },
  bodyMuted: { fontSize: 8, fontFamily: 'Lato', color: C.gray, lineHeight: 1.5 },
  italic: { fontSize: 8.5, fontFamily: 'CGi', color: C.gray, lineHeight: 1.5 },
  bullet: { fontSize: 9, fontFamily: 'Lato', color: C.textDark, lineHeight: 1.6, marginBottom: 2 },
  row: { flexDirection: 'row', gap: 5 },
  dividerGold: { height: 1, backgroundColor: C.goldMid, marginVertical: 7 },
  dividerLight: { height: 0.5, backgroundColor: C.grayLight, marginVertical: 5 },
  card: {
    backgroundColor: C.offWhite,
    borderTop: `2.5pt solid ${C.gold}`,
    borderBottom: `0.5pt solid ${C.grayLight}`,
    borderLeft: `0.5pt solid ${C.grayLight}`,
    borderRight: `0.5pt solid ${C.grayLight}`,
    padding: '5pt 7pt',
    marginBottom: 4,
  },
  cardBlue: { backgroundColor: C.navy, padding: '7pt 10pt', marginBottom: 5 },
  highlight: {
    backgroundColor: C.offWhite,
    padding: '6pt 9pt',
    borderLeft: `4pt solid ${C.saffron}`,
    borderBottom: `0.5pt solid ${C.grayLight}`,
    marginBottom: 5,
  },
  highlightGold: {
    backgroundColor: '#fef9e7',
    padding: '7pt 10pt',
    borderLeft: `4pt solid ${C.gold}`,
    borderBottom: `0.5pt solid ${C.goldPale}`,
    marginBottom: 5,
  },
  table: { width: '100%', marginTop: 3 },
  tableHeader: { flexDirection: 'row', backgroundColor: C.navy, padding: '4pt 5pt' },
  tableRow: { flexDirection: 'row', padding: '3.5pt 5pt', borderBottom: `0.5pt solid ${C.grayLight}`, backgroundColor: C.offWhite },
  tableRowAlt: { flexDirection: 'row', padding: '3.5pt 5pt', borderBottom: `0.5pt solid ${C.grayLight}`, backgroundColor: '#fdf8f0' },
  th: { fontSize: 7, fontFamily: 'LatoBold', color: C.white, letterSpacing: 0.3 },
  td: { fontSize: 8, fontFamily: 'Lato', color: C.text },
  tdBold: { fontSize: 8, fontFamily: 'LatoBold', color: C.navy },
  progressBg: { height: 6, backgroundColor: C.grayLight, borderRadius: 3, overflow: 'hidden', marginTop: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  tag: { backgroundColor: C.warmSand, border: `0.5pt solid ${C.goldLight}`, padding: '2pt 6pt', borderRadius: 9 },
  tagNavy: { backgroundColor: C.navy, padding: '2pt 7pt', borderRadius: 9 },
  tagSaffron: { backgroundColor: C.saffron, padding: '2pt 7pt', borderRadius: 9 },
})

// ── Sudarshan Chakra (site logo) ──────────────────────────────────────────────
function SudarshanChakra({ size = 100 }: { size?: number }) {
  const outerPetals = Array.from({ length: 16 }, (_, i) => i * 22.5)
  const innerPetals = Array.from({ length: 8 }, (_, i) => i * 45)
  const spokes      = Array.from({ length: 8 }, (_, i) => i * 45)
  const spokeDots   = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5)
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Polygon
        points="100,4 121.5,19.8 148,16.9 158.7,41.3 183.1,52 180.2,78.5 196,100 180.2,121.5 183.1,148 158.7,158.7 148,183.1 121.5,180.2 100,196 78.5,180.2 52,183.1 41.3,158.7 16.9,148 19.8,121.5 4,100 19.8,78.5 16.9,52 41.3,41.3 52,16.9 78.5,19.8"
        fill="#E36414" />
      <Circle cx={100} cy={100} r={82} fill="#FEF5EC" />
      <Circle cx={100} cy={100} r={80} fill="none" stroke="#E36414" strokeWidth={2.5} />
      {outerPetals.map((a) => <Ellipse key={a} cx={100} cy={28} rx={5} ry={11} fill="#E36414" stroke="#D4A017" strokeWidth={0.7} transform={`rotate(${a} 100 100)`} />)}
      <Circle cx={100} cy={100} r={62} fill="none" stroke="#D4A017" strokeWidth={2} />
      {spokes.map((a) => <Path key={a} d="M 100,41 L 96.5,51 L 100,59 L 103.5,51 Z" fill="#2F2A44" transform={`rotate(${a} 100 100)`} />)}
      {spokeDots.map((a) => <Circle key={a} cx={100} cy={50} r={2.5} fill="#E36414" transform={`rotate(${a} 100 100)`} />)}
      <Circle cx={100} cy={100} r={40} fill="none" stroke="#D4A017" strokeWidth={2.5} />
      {innerPetals.map((a) => <Ellipse key={a} cx={100} cy={65} rx={3.5} ry={8} fill="#C67D53" stroke="#D4A017" strokeWidth={0.6} transform={`rotate(${a} 100 100)`} />)}
      <Circle cx={100} cy={100} r={27} fill="#2F2A44" />
      <Circle cx={100} cy={100} r={25} fill="none" stroke="#D4A017" strokeWidth={1.5} />
      <Circle cx={100} cy={100} r={16} fill="#E36414" />
      <Circle cx={100} cy={100} r={9}  fill="#2F2A44" />
      <Circle cx={100} cy={100} r={5}  fill="#D4A017" />
    </Svg>
  )
}

// ── Ornament divider ──────────────────────────────────────────────────────────
function OrnamentDivider({ color = C.gold, mt = 8, mb = 8, width = 200 }: { color?: string; mt?: number; mb?: number; width?: number }) {
  const cx = width / 2
  return (
    <View style={{ alignItems: 'center', marginTop: mt, marginBottom: mb }}>
      <Svg width={width} height={14} viewBox={`0 0 ${width} 14`}>
        <Path d={`M 0,7 L ${cx - 20},7`} stroke={color} strokeWidth={0.75} />
        <Path d={`M ${cx - 17},7 L ${cx - 11},2 L ${cx - 5},7 L ${cx - 11},12 Z`} fill={color} />
        <Path d={`M ${cx - 2},7 L ${cx},2 L ${cx + 2},7 L ${cx},12 Z`} fill={color} />
        <Path d={`M ${cx + 5},7 L ${cx + 11},2 L ${cx + 17},7 L ${cx + 11},12 Z`} fill={color} />
        <Path d={`M ${cx + 20},7 L ${width},7`} stroke={color} strokeWidth={0.75} />
      </Svg>
    </View>
  )
}

// ── Diamond corner marks ──────────────────────────────────────────────────────
function DiamondCorners({ inset = 3, size = 9, color = C.gold }: { inset?: number; size?: number; color?: string }) {
  const d = `M ${size / 2},0 L ${size},${size / 2} L ${size / 2},${size} L 0,${size / 2} Z`
  const corners = [
    { top: inset, left: inset },
    { top: inset, right: inset },
    { bottom: inset, left: inset },
    { bottom: inset, right: inset },
  ]
  return (
    <>
      {corners.map((pos, i) => (
        <View key={i} style={{ position: 'absolute', ...pos }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Path d={d} fill={color} /></Svg>
        </View>
      ))}
    </>
  )
}

// ── Corner lotus ornaments (4 orientations, no CSS transform) ─────────────────
function CornerLotusTopLeft({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={4} cy={4} r={2.5} fill={C.gold} />
      <Path d="M 6,4 Q 17,1 27,4 Q 17,7 6,4 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 4,6 Q 1,17 4,27 Q 7,17 4,6 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 13,4 Q 9,9 4,13" stroke={C.gold} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Circle cx={9}  cy={9}  r={1.8} fill={C.gold} opacity={0.55} />
      <Circle cx={15} cy={15} r={1.2} fill={C.gold} opacity={0.4} />
      <Circle cx={21} cy={21} r={0.8} fill={C.gold} opacity={0.25} />
    </Svg>
  )
}
function CornerLotusTopRight({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={36} cy={4} r={2.5} fill={C.gold} />
      <Path d="M 34,4 Q 23,1 13,4 Q 23,7 34,4 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 36,6 Q 39,17 36,27 Q 33,17 36,6 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 27,4 Q 31,9 36,13" stroke={C.gold} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Circle cx={31} cy={9}  r={1.8} fill={C.gold} opacity={0.55} />
      <Circle cx={25} cy={15} r={1.2} fill={C.gold} opacity={0.4} />
      <Circle cx={19} cy={21} r={0.8} fill={C.gold} opacity={0.25} />
    </Svg>
  )
}
function CornerLotusBottomLeft({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={4} cy={36} r={2.5} fill={C.gold} />
      <Path d="M 6,36 Q 17,39 27,36 Q 17,33 6,36 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 4,34 Q 1,23 4,13 Q 7,23 4,34 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 13,36 Q 9,31 4,27" stroke={C.gold} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Circle cx={9}  cy={31} r={1.8} fill={C.gold} opacity={0.55} />
      <Circle cx={15} cy={25} r={1.2} fill={C.gold} opacity={0.4} />
      <Circle cx={21} cy={19} r={0.8} fill={C.gold} opacity={0.25} />
    </Svg>
  )
}
function CornerLotusBottomRight({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={36} cy={36} r={2.5} fill={C.gold} />
      <Path d="M 34,36 Q 23,39 13,36 Q 23,33 34,36 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 36,34 Q 39,23 36,13 Q 33,23 36,34 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 27,36 Q 31,31 36,27" stroke={C.gold} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Circle cx={31} cy={31} r={1.8} fill={C.gold} opacity={0.55} />
      <Circle cx={25} cy={25} r={1.2} fill={C.gold} opacity={0.4} />
      <Circle cx={19} cy={19} r={0.8} fill={C.gold} opacity={0.25} />
    </Svg>
  )
}

// ── Gold concentric circles watermark on navy sections ────────────────────────
function NavyWatermarkCircles({ w = 507, h = 260 }: { w?: number; h?: number }) {
  const cx = w / 2, cy = h / 2
  return (
    <View style={{ position: 'absolute', top: 0, left: 0 }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Circle cx={cx} cy={cy} r={120} fill="none" stroke={C.goldMid} strokeWidth={0.5} opacity={0.12} />
        <Circle cx={cx} cy={cy} r={90}  fill="none" stroke={C.goldMid} strokeWidth={0.5} opacity={0.12} strokeDasharray="5 5" />
        <Circle cx={cx} cy={cy} r={60}  fill="none" stroke={C.goldMid} strokeWidth={0.4} opacity={0.12} />
        <Circle cx={cx} cy={cy} r={35}  fill="none" stroke={C.goldMid} strokeWidth={0.3} opacity={0.12} />
      </Svg>
    </View>
  )
}

// ── Interior page border ──────────────────────────────────────────────────────
function PageBorder() {
  return (
    <>
      <View style={{ position: 'absolute', top: 6,  left: 6,  right: 6,  bottom: 6,  border: `2pt solid ${C.gold}` }} />
      <View style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: `0.5pt solid ${C.goldLight}` }} />
      <DiamondCorners inset={3} size={9} />
    </>
  )
}

// ── Very faint chakra watermark — bottom-right, not overlapping content ───────
function PageWatermark() {
  return (
    <View style={{ position: 'absolute', bottom: 26, right: 24, opacity: 0.04 }}>
      <SudarshanChakra size={110} />
    </View>
  )
}

// ── Mandala SVG for cover page header ────────────────────────────────────────
function MandalaHeaderSVG({ size = 120 }: { size?: number }) {
  const cx = size / 2, cy = size / 2
  const scale = size / 140  // design is based on 140px viewBox
  const toRad = (d: number) => d * Math.PI / 180

  // 16 tick marks between r=62 and r=66 (scaled)
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const r = toRad(i * 22.5)
    const r1 = 62 * scale, r2 = 66 * scale
    const x1 = (cx + r1 * Math.sin(r)).toFixed(2)
    const y1 = (cy - r1 * Math.cos(r)).toFixed(2)
    const x2 = (cx + r2 * Math.sin(r)).toFixed(2)
    const y2 = (cy - r2 * Math.cos(r)).toFixed(2)
    return `M ${x1},${y1} L ${x2},${y2}`
  })

  // 8 lotus petals — teardrop from inner r=44 to outer r=58
  const petals = Array.from({ length: 8 }, (_, i) => {
    const a = toRad(i * 45)
    const rot = (px: number, py: number) => {
      const ox = px * scale, oy = py * scale
      const rx = cx + (ox - cx) * Math.cos(a) - (oy - cy) * Math.sin(a)
      const ry = cy + (ox - cx) * Math.sin(a) + (oy - cy) * Math.cos(a)
      return `${rx.toFixed(2)},${ry.toFixed(2)}`
    }
    const base  = rot(cx, cy - 44 * scale)
    const c1    = rot(cx - 7 * scale, cy - 49 * scale)
    const c2    = rot(cx - 3 * scale, cy - 56 * scale)
    const tip   = rot(cx,             cy - 58 * scale)
    const c3    = rot(cx + 3 * scale, cy - 56 * scale)
    const c4    = rot(cx + 7 * scale, cy - 49 * scale)
    return `M ${base} C ${c1} ${c2} ${tip} C ${c3} ${c4} ${base} Z`
  })

  // Octagram: two overlapping squares at r=34
  const r34 = 34 * scale
  const d34 = (34 * scale * Math.cos(Math.PI / 4)).toFixed(2)
  const sq1 = `${cx},${(cy - r34).toFixed(2)} ${(cx + r34).toFixed(2)},${cy} ${cx},${(cy + r34).toFixed(2)} ${(cx - r34).toFixed(2)},${cy}`
  const dd = parseFloat(d34)
  const sq2 = `${(cx + dd).toFixed(2)},${(cy - dd).toFixed(2)} ${(cx + dd).toFixed(2)},${(cy + dd).toFixed(2)} ${(cx - dd).toFixed(2)},${(cy + dd).toFixed(2)} ${(cx - dd).toFixed(2)},${(cy - dd).toFixed(2)}`

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx} cy={cy} r={68 * scale} stroke={C.goldLight} strokeWidth={0.5} fill="none" />
      <Circle cx={cx} cy={cy} r={62 * scale} stroke={C.goldBright} strokeWidth={1} fill="none" />
      {ticks.map((d, i) => <Path key={i} d={d} stroke={C.goldLight} strokeWidth={0.5} />)}
      {petals.map((d, i) => <Path key={i} d={d} stroke={C.goldBright} strokeWidth={0.8} fill={C.goldBright} opacity={0.18} />)}
      <Circle cx={cx} cy={cy} r={42 * scale} stroke={C.goldBright} strokeWidth={0.5} fill="none" />
      <Polygon points={sq1} stroke={C.goldLight} strokeWidth={0.8} fill="none" />
      <Polygon points={sq2} stroke={C.goldLight} strokeWidth={0.8} fill="none" />
      <Circle cx={cx} cy={cy} r={22 * scale} stroke={C.goldBright} strokeWidth={1} fill="none" />
      {/* Center circle fill at 20% opacity */}
      <Circle cx={cx} cy={cy} r={10 * scale} fill={C.goldBright} opacity={0.2} />
      <Circle cx={cx} cy={cy} r={10 * scale} fill="none" stroke={C.goldBright} strokeWidth={1} />
      <Circle cx={cx} cy={cy} r={3 * scale} fill={C.goldBright} />
    </Svg>
  )
}

// ── Diamond transition strip (full page width) ────────────────────────────────
function DiamondTransitionStrip() {
  const w = 595, h = 22, cy = h / 2
  const diamonds: React.ReactElement[] = []
  let x = 8, idx = 0
  while (x <= w) {
    const isLarge = idx % 2 === 0
    const s = isLarge ? 5 : 3
    const d = `M ${x},${cy - s} L ${x + s},${cy} L ${x},${cy + s} L ${x - s},${cy} Z`
    diamonds.push(<Path key={idx} d={d} fill={isLarge ? C.goldBright : C.goldLight} />)
    x += 14
    idx++
  }
  return (
    <View style={{ backgroundColor: C.bgDark, width: '100%' }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>{diamonds}</Svg>
    </View>
  )
}

// ── Diamond divider for interior pages ────────────────────────────────────────
function DiamondDivider({ mt = 10, mb = 10, padH = 44 }: { mt?: number; mb?: number; padH?: number }) {
  const w = 595 - padH * 2
  const half = w / 2
  return (
    <View style={{ paddingHorizontal: padH, marginTop: mt, marginBottom: mb }}>
      <Svg width={w} height={14} viewBox={`0 0 ${w} 14`}>
        <Path d={`M 0,7 L ${half - 22},7`} stroke={C.borderSubtle} strokeWidth={1} />
        <Path d={`M ${half - 16},7 L ${half - 11},2 L ${half - 6},7 L ${half - 11},12 Z`} fill={C.goldBright} />
        <Path d={`M ${half - 3},7 L ${half},3 L ${half + 3},7 L ${half},11 Z`} fill={C.goldBright} />
        <Path d={`M ${half + 6},7 L ${half + 11},2 L ${half + 16},7 L ${half + 11},12 Z`} fill={C.goldBright} />
        <Path d={`M ${half + 22},7 L ${w},7`} stroke={C.borderSubtle} strokeWidth={1} />
      </Svg>
    </View>
  )
}

// ── L-shaped corner ornaments for framed blocks ───────────────────────────────
function LineageCorners({ size = 12 }: { size?: number }) {
  const s = size, sw = 1, gc = C.goldBright
  return (
    <>
      <View style={{ position: 'absolute', top: -1, left: -1 }}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Path d={`M 0,${s} L 0,0 L ${s},0`} stroke={gc} strokeWidth={sw} fill="none" />
        </Svg>
      </View>
      <View style={{ position: 'absolute', top: -1, right: -1 }}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Path d={`M ${s},${s} L ${s},0 L 0,0`} stroke={gc} strokeWidth={sw} fill="none" />
        </Svg>
      </View>
      <View style={{ position: 'absolute', bottom: -1, left: -1 }}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Path d={`M 0,0 L 0,${s} L ${s},${s}`} stroke={gc} strokeWidth={sw} fill="none" />
        </Svg>
      </View>
      <View style={{ position: 'absolute', bottom: -1, right: -1 }}>
        <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <Path d={`M 0,${s} L ${s},${s} L ${s},0`} stroke={gc} strokeWidth={sw} fill="none" />
        </Svg>
      </View>
    </>
  )
}

// ── Three-column page footer ──────────────────────────────────────────────────
function PageFooter() {
  return (
    <View style={{ position: 'absolute', bottom: 14, left: 32, right: 32 }}>
      <View style={{ height: 0.75, backgroundColor: C.goldBright, opacity: 0.5, marginBottom: 4 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 7, fontFamily: 'Lato', color: C.textMeta, letterSpacing: 0.3 }}>www.mahatathastu.com</Text>
        <Text style={{ fontSize: 7.5, fontFamily: 'LatoBold', color: C.navy, letterSpacing: 1.5 }}>MAHATATHASTU</Text>
        <Text style={{ fontSize: 7, fontFamily: 'Lato', color: C.textMeta, letterSpacing: 0.3 }}>9858784784</Text>
      </View>
    </View>
  )
}

// ── Chapter header — wax seal ─────────────────────────────────────────────────
function ChapterHeader({ number, title, sanskrit }: { number: string; title: string; sanskrit?: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ height: 3, backgroundColor: C.saffron }} />
      <View style={{ backgroundColor: C.navy, padding: '11pt 15pt', flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ marginRight: 13, alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
          <View style={{ position: 'absolute', width: 46, height: 46, borderRadius: 23, border: `1pt solid ${C.saffronLight}`, opacity: 0.3 }} />
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.saffron, border: `1.5pt solid ${C.goldLight}`, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 32, height: 32, borderRadius: 16, backgroundColor: C.saffronDark, opacity: 0.3 }} />
            <Text style={{ fontSize: 13, fontFamily: 'LatoBold', color: C.white }}>{number}</Text>
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontFamily: 'CGb', color: C.white, letterSpacing: 0.5 }}>{title}</Text>
          {sanskrit ? <Text style={{ fontSize: 8, fontFamily: 'CGi', color: C.goldLight, marginTop: 2, letterSpacing: 1 }}>{sanskrit}</Text> : null}
        </View>
        <View style={{ opacity: 0.85 }}>
          <Text style={{ fontSize: 20, fontFamily: 'CGb', color: C.gold }}>OM</Text>
        </View>
      </View>
      <View style={{ height: 2, backgroundColor: C.gold }} />
    </View>
  )
}

// ── Title header (non-chapter pages) ─────────────────────────────────────────
function TitleHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ height: 3, backgroundColor: C.gold }} />
      <View style={{ backgroundColor: C.navy, padding: '10pt 15pt', alignItems: 'center' }}>
        <Text style={{ fontSize: 17, fontFamily: 'CGb', color: C.white, letterSpacing: 1.5 }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 8, fontFamily: 'CGi', color: C.goldLight, marginTop: 3, letterSpacing: 1 }}>{subtitle}</Text> : null}
      </View>
      <View style={{ height: 2, backgroundColor: C.gold }} />
    </View>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <View style={{ marginBottom: 7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ width: 4, height: 14, backgroundColor: C.saffron, borderRadius: 1, marginRight: 8 }} />
        <Text style={{ fontSize: 11, fontFamily: 'LatoBold', color: C.navy, letterSpacing: 0.3 }}>{children}</Text>
      </View>
      <View style={{ height: 0.75, backgroundColor: C.goldPale }} />
    </View>
  )
}

// ── InfoGrid ──────────────────────────────────────────────────────────────────
function InfoGrid({ items, cols = 4 }: { items: { label: string; value?: any }[]; cols?: number }) {
  const pct = cols === 4 ? '23%' : cols === 3 ? '31%' : '48%'
  const filled = items.filter(i => i.value != null && i.value !== '')
  if (!filled.length) return null
  return (
    <View style={[styles.row, { flexWrap: 'wrap', marginBottom: 6 }]}>
      {filled.map((item) => (
        <View key={item.label} style={[styles.card, { width: pct, flexGrow: 0 }]}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{String(item.value)}</Text>
        </View>
      ))}
    </View>
  )
}

// ── BulletList ────────────────────────────────────────────────────────────────
function BulletList({ items, accent = C.saffron }: { items: string[]; accent?: string }) {
  const arr = Array.isArray(items) ? items : []
  if (!arr.length) return null
  return (
    <View>
      {arr.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
          <Svg width={8} height={9} viewBox="0 0 24 24" style={{ marginTop: 2, marginRight: 6, flexShrink: 0 }}>
            <Path d="M12 2L22 20H2L12 2Z" fill={accent} />
          </Svg>
          <Text style={[styles.bullet, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

// ── TagRow ────────────────────────────────────────────────────────────────────
function TagRow({ items, variant = 'warm' }: { items: string[]; variant?: 'warm' | 'navy' | 'saffron' }) {
  if (!items?.length) return null
  const arr = Array.isArray(items) ? items : [items]
  const s = variant === 'navy' ? styles.tagNavy : variant === 'saffron' ? styles.tagSaffron : styles.tag
  const tc = variant === 'warm' ? C.navy : C.white
  return (
    <View style={styles.tagRow}>
      {arr.map((t, i) => (
        <View key={i} style={s}>
          <Text style={{ fontSize: 7.5, color: tc }}>{t}</Text>
        </View>
      ))}
    </View>
  )
}

// ── HighlightBox ──────────────────────────────────────────────────────────────
function HighlightBox({ label, text, accent = C.saffron }: { label?: string; text: string; accent?: string }) {
  if (!text) return null
  return (
    <View style={[styles.highlight, { borderLeftColor: accent }]}>
      {label ? <Text style={[styles.label, { color: accent, marginBottom: 3 }]}>{label}</Text> : null}
      <Text style={styles.body}>{text}</Text>
    </View>
  )
}

// ── Two-column info box ───────────────────────────────────────────────────────
function TwoColInfo({ left, right }: { left: { label: string; items: string[] }; right: { label: string; items: string[] } }) {
  if (!left.items?.length && !right.items?.length) return null
  return (
    <View style={[styles.row, { marginBottom: 6 }]}>
      {left.items?.length ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { marginBottom: 3 }]}>{left.label}</Text>
          <BulletList items={left.items.slice(0, 6)} />
        </View>
      ) : null}
      {right.items?.length ? (
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { marginBottom: 3 }]}>{right.label}</Text>
          <BulletList items={right.items.slice(0, 6)} />
        </View>
      ) : null}
    </View>
  )
}

// ── COVER PAGE ────────────────────────────────────────────────────────────────
function CoverPage({ report, member, title }: { report: any; member: any; title: string }) {
  const dob = member?.date_of_birth
    ? new Date(member.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
  const gen = new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Page size="A4" style={{ backgroundColor: C.bgPage, fontFamily: 'Lato', flexDirection: 'column', position: 'relative' }}>

      {/* ── ZONE 1: TOP HEADER BAND (navy, ~210pt tall) ── */}
      <View style={{ backgroundColor: C.bgDark, paddingTop: 16, paddingBottom: 16, paddingHorizontal: 44, alignItems: 'center', position: 'relative' }}>
        <NavyWatermarkCircles w={507} h={210} />

        {/* Sanskrit invocations — side by side with separator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1, marginBottom: 10, opacity: 0.7 }}>
          <Text style={{ fontSize: 7, fontFamily: 'Lato', color: C.textOnDark, letterSpacing: 1.8 }}>
            SHREE MATRA NAMAH
          </Text>
          <View style={{ width: 0.5, height: 12, backgroundColor: C.goldLight, marginHorizontal: 10 }} />
          <Text style={{ fontSize: 7, fontFamily: 'Lato', color: C.textOnDark, letterSpacing: 1.8 }}>
            OM MAHAGANPATAYE NAMAH
          </Text>
        </View>

        {/* Mandala — the centrepiece */}
        <View style={{ zIndex: 1 }}>
          <MandalaHeaderSVG size={118} />
        </View>

        {/* Horizontal rule below mandala */}
        <View style={{ width: 72, height: 0.5, backgroundColor: C.goldLight, opacity: 0.6, marginTop: 8, zIndex: 1 }} />

        {/* Brand name */}
        <Text style={{ fontSize: 32, fontFamily: 'CGb', color: C.goldOnDark, letterSpacing: 5, marginTop: 8, zIndex: 1 }}>
          MAHATATHASTU
        </Text>

        {/* Thin rule */}
        <View style={{ width: 56, height: 1, backgroundColor: C.goldBright, marginTop: 6, zIndex: 1 }} />

        {/* Tagline */}
        <View style={{ opacity: 0.65, marginTop: 6 }}>
          <Text style={{ fontSize: 6.5, fontFamily: 'Lato', color: C.textOnDark, letterSpacing: 2 }}>
            DECODE YOUR LIFE  ·  DESIGN YOUR FUTURE
          </Text>
        </View>
      </View>

      {/* ── ZONE 2: DECORATIVE DIAMOND TRANSITION STRIP ── */}
      <DiamondTransitionStrip />
      <View style={{ height: 1, backgroundColor: C.borderStrong }} />

      {/* ── ZONE 3: CREAM BODY ── */}
      <View style={{ flex: 1, backgroundColor: C.bgPage, paddingHorizontal: 44, paddingTop: 26, paddingBottom: 60, position: 'relative' }}>
        {/* Subtle corner lotus ornaments */}
        <View style={{ position: 'absolute', top: 26, left: 44 }}><CornerLotusTopLeft size={22} /></View>
        <View style={{ position: 'absolute', top: 26, right: 44 }}><CornerLotusTopRight size={22} /></View>
        <View style={{ position: 'absolute', bottom: 60, left: 44 }}><CornerLotusBottomLeft size={22} /></View>
        <View style={{ position: 'absolute', bottom: 60, right: 44 }}><CornerLotusBottomRight size={22} /></View>

        {/* Report type label — vermillion pill */}
        <View style={{ border: `1.5pt solid ${C.vermillion}`, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, marginBottom: 16 }}>
          <Text style={{ fontSize: 8, fontFamily: 'LatoBold', color: C.vermillion, letterSpacing: 2 }}>
            {title.toUpperCase()}
          </Text>
        </View>

        {/* Person name */}
        {member?.full_name ? (
          <Text style={{ fontSize: 32, fontFamily: 'CGb', color: C.textPrimary, letterSpacing: 2, lineHeight: 1.2 }}>
            {member.full_name.toUpperCase()}
          </Text>
        ) : null}

        {/* Gold rule */}
        <View style={{ height: 1.5, backgroundColor: C.borderStrong, marginTop: 12, marginBottom: 12 }} />

        {/* Birth details row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          {dob ? (
            <Text style={{ fontSize: 10.5, fontFamily: 'Lato', color: C.textSecondary, letterSpacing: 0.3 }}>{dob}</Text>
          ) : null}
          {dob && member?.place_of_birth ? (
            <Text style={{ fontSize: 14, color: C.goldBright, marginHorizontal: 8, lineHeight: 1 }}>·</Text>
          ) : null}
          {member?.place_of_birth ? (
            <Text style={{ fontSize: 10.5, fontFamily: 'Lato', color: C.textSecondary, letterSpacing: 0.3 }}>{member.place_of_birth}</Text>
          ) : null}
        </View>
        <Text style={{ fontSize: 8.5, fontFamily: 'Lato', color: C.textMeta, letterSpacing: 0.3 }}>
          Report Generated: {gen}
        </Text>

        {/* ── Lineage Block — framed with corner ornaments ── */}
        <View style={{ marginTop: 28, border: `1pt solid ${C.borderSubtle}`, paddingHorizontal: 28, paddingVertical: 18, position: 'relative' }}>
          <LineageCorners size={11} />

          <Text style={{ fontSize: 8, fontFamily: 'LatoBold', color: C.goldOnCream, letterSpacing: 2, textAlign: 'center', marginBottom: 8 }}>
            LINEAGE & TRADITION
          </Text>
          <View style={{ width: 48, height: 0.5, backgroundColor: C.borderSubtle, alignSelf: 'center', marginBottom: 10 }} />
          <Text style={{ fontSize: 11, fontFamily: 'CGi', color: C.textSecondary, textAlign: 'center', lineHeight: 1.7, marginBottom: 6 }}>
            Lineage of Maharishi Bhrigu  ·  Tradition of Vasishtha
          </Text>
          <Text style={{ fontSize: 9, fontFamily: 'Lato', color: C.textMeta, textAlign: 'center', letterSpacing: 0.5, lineHeight: 1.6 }}>
            Surya · Pitamaha · Vyasa · Vasishtha · Atri · Parashara · Kashyapa
          </Text>
        </View>

        {/* ── Institution credit ── */}
        <View style={{ marginTop: 18, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, fontFamily: 'LatoBold', color: C.goldOnCream, letterSpacing: 2, marginBottom: 4 }}>
            AN INITIATIVE OF ANUSHTHAAN INDIA
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'CGi', color: C.textMeta }}>
            GYANAMEETHAM · Educating Society with Wisdom for a Better Life
          </Text>
        </View>
      </View>

      {/* ── FOOTER BAR (absolute, 44pt) ── */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 44, backgroundColor: C.bgDark, borderTop: `2pt solid ${C.goldBright}`, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 44, justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 9, fontFamily: 'LatoBold', color: C.goldOnDark, letterSpacing: 1.8 }}>MAHATATHASTU</Text>
        <View style={{ opacity: 0.8 }}><Text style={{ fontSize: 8, fontFamily: 'Lato', color: C.textOnDark }}>www.mahatathastu.com</Text></View>
        <View style={{ opacity: 0.8 }}><Text style={{ fontSize: 8, fontFamily: 'Lato', color: C.textOnDark }}>9858784784</Text></View>
      </View>

    </Page>
  )
}

// ── GUIDANCE PAGE ─────────────────────────────────────────────────────────────
function GuidancePage() {
  const cards = [
    {
      num: '01',
      title: 'Faith is the Foundation',
      body: 'Follow all remedies with full dedication, discipline, and unwavering faith. Faith and devotion are the strongest mediums through which divine blessings flow into one\'s life. The sincerity of your intention multiplies the potency of every remedy manifold.',
    },
    {
      num: '02',
      title: '90-Day Minimum Practice',
      body: 'For purification and correction of karmic energies, practice the remedies continuously for a minimum of 90 days without interruption. Karmic patterns take time to shift — consistency is the key that unlocks transformation.',
    },
    {
      num: '03',
      title: 'Daily Consistency',
      body: 'Performing remedies at the same time each day — especially during sunrise or the prescribed muhurta — amplifies their effectiveness significantly. The cosmic energies are most receptive at fixed daily intervals.',
    },
    {
      num: '04',
      title: 'Sattvic Lifestyle & Inner Sincerity',
      body: 'Maintain a sattvic diet, avoid intoxicants, speak truthfully, and practice charitable acts during the remedy period. Approach every mantra, ritual, and remedy as a direct conversation with the divine — external actions without inner sincerity yield limited results.',
    },
  ]

  return (
    <Page size="A4" style={{ backgroundColor: C.bgPage, fontFamily: 'Lato', flexDirection: 'column', position: 'relative' }}>

      {/* ── PAGE HEADER — navy, 80pt ── */}
      <View style={{ backgroundColor: C.bgDark, paddingTop: 16, paddingBottom: 18, paddingHorizontal: 44, position: 'relative' }}>
        <NavyWatermarkCircles w={507} h={80} />
        <View style={{ opacity: 0.6 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Lato', color: C.textOnDark, letterSpacing: 2.5 }}>
            MAHATATHASTU · ANUSHTHAAN INDIA
          </Text>
        </View>
        <Text style={{ fontSize: 26, fontFamily: 'CGbi', color: C.goldOnDark, letterSpacing: 1.5, marginTop: 4, zIndex: 1 }}>
          Divine Guidance
        </Text>
        <View style={{ opacity: 0.7, marginTop: 3 }}>
          <Text style={{ fontSize: 9, fontFamily: 'Lato', color: C.textOnDark }}>
            How to use this Report
          </Text>
        </View>
      </View>

      {/* ── Thin gold rule ── */}
      <View style={{ height: 1.5, backgroundColor: C.borderStrong }} />

      {/* ── BODY ── */}
      <View style={{ flex: 1, paddingHorizontal: 44, paddingTop: 22, paddingBottom: 70 }}>

        {/* Intro paragraph with drop cap "T" */}
        <View style={{ flexDirection: 'row', marginBottom: 14 }}>
          {/* Drop cap */}
          <View style={{ width: 36, height: 36, backgroundColor: C.bgDark, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 2 }}>
            <Text style={{ fontSize: 26, fontFamily: 'CGb', color: C.goldOnDark, lineHeight: 1 }}>T</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10.5, fontFamily: 'Lato', color: C.textSecondary, lineHeight: 1.85 }}>
              his Tathastu report has been prepared by the MahaTathastu Team based on your unique birth details and name vibration. It integrates Vedic Astrology, Numerology, Ayurveda, Chakra Science, Yantra, Mantra, and Vedic Psychology into a comprehensive, personalised guidance system crafted exclusively for your journey toward self-knowledge and dharmic living.
            </Text>
          </View>
        </View>

        <DiamondDivider mt={4} mb={18} />

        {/* Numbered cards with vertical connector line */}
        <View style={{ position: 'relative' }}>
          {/* Vertical connector line */}
          <View style={{ position: 'absolute', left: 17, top: 24, bottom: 16, width: 1, backgroundColor: C.borderSubtle }} />

          {cards.map((card) => (
            <View key={card.num} style={{ flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' }}>
              {/* Number badge */}
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.bgDark, alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                <Text style={{ fontSize: 9, fontFamily: 'LatoBold', color: C.goldOnDark, letterSpacing: 0.5 }}>
                  {card.num}
                </Text>
              </View>
              {/* Card body */}
              <View style={{ flex: 1, borderLeft: `2pt solid ${C.borderStrong}`, paddingLeft: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: 'CGb', color: C.textPrimary, marginBottom: 4, letterSpacing: 0.3 }}>
                  {card.title}
                </Text>
                <Text style={{ fontSize: 9.5, fontFamily: 'Lato', color: C.textSecondary, lineHeight: 1.75 }}>
                  {card.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <DiamondDivider mt={10} mb={14} />

        {/* Om Tat Sat closing block */}
        <View style={{ backgroundColor: C.bgCard, borderTop: `2pt solid ${C.borderStrong}`, borderBottom: `2pt solid ${C.borderStrong}`, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontFamily: 'CGbi', color: C.vermillion, letterSpacing: 2, marginBottom: 6 }}>
            Om Tat Sat
          </Text>
          <Text style={{ fontSize: 10, fontFamily: 'Lato', color: C.textSecondary, textAlign: 'center', lineHeight: 1.8 }}>
            May this report illuminate your path to self-knowledge, purpose, and dharmic living.
          </Text>
          <Text style={{ fontSize: 9, fontFamily: 'LatoBold', color: C.goldOnCream, textAlign: 'center', marginTop: 8, letterSpacing: 1 }}>
            — MahaTathastu Team · Anushthaan India
          </Text>
        </View>

      </View>

      <PageFooter />
    </Page>
  )
}

// ── KUNDLI SECTION ────────────────────────────────────────────────────────────
function KundliPages({ data, canvasImg, number }: { data: any; canvasImg?: string; number: string }) {
  const k = data.kundli || data
  const analysis = data.analysis
  if (!k?.ascendant) return null

  const exalted = k.planets?.filter((p: any) => p.dignity === 'exalted' || p.isExalted)
  const debilitated = k.planets?.filter((p: any) => p.dignity === 'debilitated' || p.isDebilitated)
  const retrograde = k.planets?.filter((p: any) => p.retrograde)
  const combust = k.planets?.filter((p: any) => p.combust || p.isCombust)

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Kundli & Birth Chart" sanskrit="Graha Jyotisha — Vedic Astrology" />

      {canvasImg ? (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Image src={canvasImg} style={{ width: 180, height: 180 }} />
        </View>
      ) : null}

      {/* Core chart data */}
      <InfoGrid items={[
        { label: 'Ascendant (Lagna)', value: k.ascendant },
        { label: 'Moon Sign (Rashi)', value: k.moonSign },
        { label: 'Sun Sign', value: k.sunSign },
        { label: 'Nakshatra', value: k.nakshatra },
        { label: 'Nakshatra Pada', value: k.nakshatraPada ? `Pada ${k.nakshatraPada}` : undefined },
        { label: 'Nakshatra Lord', value: k.nakshatraLord },
        { label: 'Ayanamsa', value: k.ayanamsa ? `Lahiri ${Number(k.ayanamsa).toFixed(4)}°` : undefined },
        { label: 'Chart Style', value: k.chartStyle || 'North Indian' },
      ]} />

      {/* Dasha */}
      <InfoGrid cols={2} items={[
        { label: 'Current Mahadasha', value: k.currentDasha },
        { label: 'Antardasha', value: k.currentAntardasha },
        { label: 'Dasha Lord', value: k.dashaLord },
        { label: 'Dasha End', value: k.dashaEndDate },
      ]} />

      {/* Planetary table */}
      {k.planets?.length > 0 ? (
        <View style={{ marginTop: 6 }}>
          <SectionLabel>Planetary Positions</SectionLabel>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {['Planet', 'Sign / Rashi', 'Degree', 'House', 'Nakshatra', 'Status'].map((h) => (
                <Text key={h} style={[styles.th, { flex: 1 }]}>{h}</Text>
              ))}
            </View>
            {k.planets.map((p: any, i: number) => (
              <View key={p.name} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tdBold, { flex: 1 }]}>{p.name}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.rashi}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.degree != null ? `${Number(p.degree).toFixed(1)}°` : '-'}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.house || '-'}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.nakshatra || '-'}</Text>
                <Text style={[styles.td, { flex: 1, color: p.retrograde ? C.saffron : p.dignity === 'exalted' ? C.emerald : C.text }]}>
                  {p.retrograde ? 'Retro' : p.dignity || '-'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Dignity summary */}
      {(exalted?.length || debilitated?.length || retrograde?.length) ? (
        <View style={[styles.row, { marginTop: 8, gap: 5 }]}>
          {exalted?.length ? (
            <View style={[styles.card, { flex: 1, borderTopColor: C.emerald }]}>
              <Text style={[styles.label, { color: C.emerald }]}>Exalted Planets</Text>
              <Text style={styles.body}>{exalted.map((p: any) => p.name).join(', ')}</Text>
            </View>
          ) : null}
          {debilitated?.length ? (
            <View style={[styles.card, { flex: 1, borderTopColor: '#dc2626' }]}>
              <Text style={[styles.label, { color: '#dc2626' }]}>Debilitated</Text>
              <Text style={styles.body}>{debilitated.map((p: any) => p.name).join(', ')}</Text>
            </View>
          ) : null}
          {retrograde?.length ? (
            <View style={[styles.card, { flex: 1, borderTopColor: C.saffron }]}>
              <Text style={[styles.label, { color: C.saffron }]}>Retrograde</Text>
              <Text style={styles.body}>{retrograde.map((p: any) => p.name).join(', ')}</Text>
            </View>
          ) : null}
          {combust?.length ? (
            <View style={[styles.card, { flex: 1, borderTopColor: C.amber }]}>
              <Text style={[styles.label, { color: C.amber }]}>Combust</Text>
              <Text style={styles.body}>{combust.map((p: any) => p.name).join(', ')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Yogas */}
      {analysis?.yogas?.length > 0 ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Yogas Formed in Your Chart</SectionLabel>
          {analysis.yogas.slice(0, 8).map((y: any) => (
            <View key={y.name} style={[styles.highlight, { marginBottom: 4 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={[styles.h3, { flex: 1, marginBottom: 0 }]}>{y.name}</Text>
                {y.strength ? <Text style={[styles.label, { color: C.gold, marginBottom: 0 }]}>{y.strength}</Text> : null}
              </View>
              {y.description ? <Text style={styles.bodySmall}>{y.description}</Text> : null}
              {y.effect ? <Text style={[styles.italic, { marginTop: 2 }]}>Effect: {y.effect}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {/* Analysis */}
      {analysis ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Life Domain Outlook</SectionLabel>
          <InfoGrid cols={2} items={[
            { label: 'Career & Profession', value: analysis.career },
            { label: 'Relationships & Marriage', value: analysis.marriage },
            { label: 'Health & Wellbeing', value: analysis.health },
            { label: 'Finance & Wealth', value: analysis.finance },
            { label: 'Spiritual Growth', value: analysis.spirituality },
            { label: 'Education', value: analysis.education },
          ]} />
          {analysis.currentPhase ? <HighlightBox label="Current Dasha Phase — What to Expect" text={analysis.currentPhase} accent={C.navy} /> : null}
          {analysis.nakshatraProfile ? <HighlightBox label="Nakshatra Nature & Profile" text={analysis.nakshatraProfile} /> : null}
          {analysis.ascendantProfile ? <HighlightBox label="Lagna (Ascendant) Profile" text={analysis.ascendantProfile} accent={C.gold} /> : null}
          {analysis.summary ? <HighlightBox label="Overall Chart Summary" text={analysis.summary} accent={C.navy} /> : null}
        </View>
      ) : null}

      {/* Monthly predictions */}
      {analysis?.monthlyPredictions?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Monthly Forecast</SectionLabel>
          {analysis.monthlyPredictions.slice(0, 6).map((m: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', borderBottom: `0.5pt solid ${C.grayLight}`, paddingVertical: 5 }}>
              <View style={{ width: 3, backgroundColor: C.gold, marginRight: 9, borderRadius: 1 }} />
              <Text style={[styles.value, { width: 80, flexShrink: 0, fontSize: 8, color: C.saffron }]}>{m.month || m.period}</Text>
              <Text style={[styles.body, { flex: 1 }]}>{m.prediction || m.forecast}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── NUMEROLOGY SECTION ────────────────────────────────────────────────────────
function NumerologyPages({ data, canvasImg, number }: { data: any; canvasImg?: string; number: string }) {
  const n = data.numerology || data
  if (!n?.lifePathNumber) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Numerology Analysis" sanskrit="Anka Shastra — Science of Numbers" />

      {canvasImg ? (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Image src={canvasImg} style={{ width: 140, height: 140 }} />
        </View>
      ) : null}

      {/* Core numbers */}
      <InfoGrid items={[
        { label: 'Life Path', value: n.lifePathNumber },
        { label: 'Destiny', value: n.destinyNumber },
        { label: 'Soul Urge', value: n.soulUrgeNumber },
        { label: 'Personality', value: n.personalityNumber },
        { label: 'Birthday', value: n.birthdayNumber },
        { label: 'Personal Year', value: n.personalYearNumber },
        { label: 'Maturity', value: n.maturityNumber },
        { label: 'Chaldean Name', value: n.chaldeanNameNumber },
        { label: 'Expression', value: n.expressionNumber },
        { label: 'Personal Month', value: n.personalMonthNumber },
        { label: 'Personal Day', value: n.personalDayNumber },
        { label: 'Hidden Passion', value: n.hiddenPassionNumber },
      ]} />

      {/* Missing & karmic */}
      {(n.missingNumbers?.length || n.karmicDebt?.length) ? (
        <View style={[styles.row, { marginBottom: 8 }]}>
          {n.missingNumbers?.length ? (
            <View style={[styles.card, { flex: 1, borderTopColor: '#dc2626' }]}>
              <Text style={[styles.label, { color: '#dc2626' }]}>Missing Numbers</Text>
              <Text style={styles.value}>{n.missingNumbers.join(', ')}</Text>
              <Text style={styles.bodySmall}>These energies need conscious cultivation.</Text>
            </View>
          ) : null}
          {n.karmicDebt?.length ? (
            <View style={[styles.card, { flex: 1, borderTopColor: C.saffron }]}>
              <Text style={[styles.label, { color: C.saffron }]}>Karmic Debt Numbers</Text>
              <Text style={styles.value}>{Array.isArray(n.karmicDebt) ? n.karmicDebt.join(', ') : n.karmicDebt}</Text>
              <Text style={styles.bodySmall}>Lessons carried from past life karma.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Interpretations */}
      {n.interpretation?.lifePath ? (
        <HighlightBox
          label={`Life Path ${n.lifePathNumber}${n.interpretation.lifePathTitle ? ` — ${n.interpretation.lifePathTitle}` : ''}`}
          text={n.interpretation.lifePath}
          accent={C.purple}
        />
      ) : null}
      {n.interpretation?.destiny ? <HighlightBox label={`Destiny Number ${n.destinyNumber}`} text={n.interpretation.destiny} /> : null}
      {n.interpretation?.soulUrge ? <HighlightBox label={`Soul Urge ${n.soulUrgeNumber} — Inner Motivation`} text={n.interpretation.soulUrge} accent={C.navyMid} /> : null}
      {n.interpretation?.personality ? <HighlightBox label={`Personality Number ${n.personalityNumber}`} text={n.interpretation.personality} accent={C.gold} /> : null}
      {n.interpretation?.personalYear ? (
        <HighlightBox label={`Personal Year ${n.personalYearNumber} — Annual Cycle`} text={n.interpretation.personalYear} accent={C.saffron} />
      ) : null}
      {n.interpretation?.maturity ? <HighlightBox label={`Maturity Number ${n.maturityNumber} — Life Purpose After 35`} text={n.interpretation.maturity} accent={C.emerald} /> : null}
      {n.interpretation?.hiddenPassion ? <HighlightBox label="Hidden Passion — Deepest Talent" text={n.interpretation.hiddenPassion} accent={C.gold} /> : null}

      {/* Life path insights */}
      <TwoColInfo
        left={{ label: 'Strengths', items: n.lifePath?.strengths?.slice(0, 6) || [] }}
        right={{ label: 'Growth Areas', items: n.lifePath?.challenges?.slice(0, 6) || [] }}
      />

      {n.lifePath?.careers?.length ? (
        <View style={{ marginTop: 5 }}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Ideal Career Paths</Text>
          <TagRow items={n.lifePath.careers.slice(0, 10)} />
        </View>
      ) : null}
      {n.lifePath?.famousPeople?.length ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Famous Life Path {n.lifePathNumber} Personalities</Text>
          <TagRow items={n.lifePath.famousPeople.slice(0, 8)} variant="navy" />
        </View>
      ) : null}

      {/* Name correction */}
      {n.nameCorrection ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Name Correction Guidance</SectionLabel>
          <HighlightBox label="Suggested Name Spelling" text={n.nameCorrection} accent={C.gold} />
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── CHAKRA SECTION ────────────────────────────────────────────────────────────
const CHAKRA_COLORS = ['#dc2626','#c2410c','#b45309','#15803d','#0369a1','#4338ca','#6d28d9']

function ChakraPages({ data, number }: { data: any; number: string }) {
  const rawData = data.chakras || data.chakra || (Array.isArray(data) ? data : null)
  const chakras: any[] = Array.isArray(rawData) ? rawData : (rawData?.chakras || [])
  const overallBalance = data.overallBalance
  if (!chakras.length) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Shakti Chakra Analysis" sanskrit="Chakra Vigyan — Energy Body Science" />

      {overallBalance != null ? (
        <View style={[styles.cardBlue, { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: C.goldLight }]}>Overall Chakra Balance</Text>
            <Text style={{ fontSize: 8.5, color: C.white, marginTop: 2, lineHeight: 1.5 }}>
              Your chakra system is {overallBalance >= 70 ? 'well-balanced' : overallBalance >= 50 ? 'moderately balanced' : 'needs attention'}. Focus on the lower-percentage chakras with the prescribed remedies.
            </Text>
          </View>
          <Text style={{ fontSize: 28, fontFamily: 'CGb', color: C.saffronLight, marginLeft: 10 }}>{overallBalance}%</Text>
        </View>
      ) : null}

      {/* Rainbow overview */}
      <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        {chakras.map((c: any, i: number) => (
          <View key={i} style={{ flex: 1, backgroundColor: CHAKRA_COLORS[i] || '#9ca3af' }} />
        ))}
      </View>

      {chakras.map((c: any, i: number) => {
        const color = CHAKRA_COLORS[i] || '#9ca3af'
        const lvl = c.level ?? 50
        return (
          <View key={i} style={{ marginBottom: 10, borderLeft: `4pt solid ${color}`, paddingLeft: 9, paddingTop: 6, paddingBottom: 6, backgroundColor: C.offWhite }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <Text style={[styles.h3, { flex: 1, marginBottom: 0, color }]}>{c.name}{c.sanskrit ? ` — ${c.sanskrit}` : ''}</Text>
              <Text style={[styles.label, { color: color, marginBottom: 0 }]}>{c.status?.toUpperCase() || ''} · {lvl}%</Text>
            </View>
            <View style={[styles.progressBg, { marginBottom: 5 }]}>
              <View style={[styles.progressFill, { width: `${lvl}%`, backgroundColor: color }]} />
            </View>
            {c.description ? <Text style={[styles.bodySmall, { marginBottom: 4 }]}>{c.description}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {c.mantras?.length ? <Text style={styles.bodySmall}>Beej Mantra: {Array.isArray(c.mantras) ? c.mantras[0] : c.mantras}</Text> : null}
              {c.element ? <Text style={styles.bodySmall}>Element: {c.element}</Text> : null}
              {c.crystals?.length ? <Text style={styles.bodySmall}>Crystal: {(Array.isArray(c.crystals) ? c.crystals : [c.crystals]).slice(0, 2).join(', ')}</Text> : null}
              {c.yoga?.length ? <Text style={styles.bodySmall}>Yoga: {Array.isArray(c.yoga) ? c.yoga[0] : c.yoga}</Text> : null}
              {c.color ? <Text style={styles.bodySmall}>Colour: {c.color}</Text> : null}
            </View>
            {c.affirmations?.length ? (
              <Text style={[styles.italic, { marginTop: 3 }]}>"{Array.isArray(c.affirmations) ? c.affirmations[0] : c.affirmations}"</Text>
            ) : null}
            {c.remedy ? <Text style={[styles.bodySmall, { color: C.saffron, marginTop: 3, fontFamily: 'LatoBold' }]}>Remedy: {c.remedy}</Text> : null}
          </View>
        )
      })}

      {data.overallRecommendation ? (
        <HighlightBox label="Overall Recommendation" text={data.overallRecommendation} accent={C.gold} />
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── PRAKRITI SECTION ──────────────────────────────────────────────────────────
function PrakritiPages({ data, number }: { data: any; number: string }) {
  const p = data.prakriti || data
  if (!p?.dominant) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Prakriti — Ayurvedic Constitution" sanskrit="Prakriti Vigyan — Ayurveda" />

      <InfoGrid cols={3} items={[
        { label: 'Dominant Dosha', value: p.dominant },
        { label: 'Secondary Dosha', value: p.secondary },
        { label: 'Tertiary Dosha', value: p.tertiary },
        { label: 'Vata', value: p.vata != null ? `${p.vata}%` : undefined },
        { label: 'Pitta', value: p.pitta != null ? `${p.pitta}%` : undefined },
        { label: 'Kapha', value: p.kapha != null ? `${p.kapha}%` : undefined },
      ]} />

      {[{ label: 'Vata', value: p.vata, color: '#0284c7' }, { label: 'Pitta', value: p.pitta, color: C.saffron }, { label: 'Kapha', value: p.kapha, color: C.emerald }]
        .filter(d => d.value != null).map((dosha) => (
          <View key={dosha.label} style={{ marginBottom: 7 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={[styles.label, { color: dosha.color, marginBottom: 0 }]}>{dosha.label} Dosha</Text>
              <Text style={[styles.label, { marginBottom: 0 }]}>{dosha.value}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${dosha.value}%`, backgroundColor: dosha.color }]} />
            </View>
          </View>
        ))}

      {p.summary ? <HighlightBox label="Prakriti Summary" text={p.summary} accent={C.saffron} /> : null}
      {p.mentalConstitution ? <HighlightBox label="Mental Constitution (Manas Prakriti)" text={p.mentalConstitution} accent={C.navyMid} /> : null}

      <TwoColInfo
        left={{ label: 'Dietary Recommendations', items: p.diet?.slice(0, 7) || [] }}
        right={{ label: 'Lifestyle Practices', items: p.lifestyle?.slice(0, 7) || [] }}
      />

      {p.herbs?.length ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.label, { marginBottom: 4 }]}>Beneficial Herbs & Spices</Text>
          <TagRow items={p.herbs.slice(0, 10)} />
        </View>
      ) : null}
      {p.avoid?.length ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.label, { color: '#dc2626', marginBottom: 4 }]}>Foods & Activities to Avoid</Text>
          <TagRow items={p.avoid.slice(0, 10)} />
        </View>
      ) : null}
      {p.exercise ? <HighlightBox label="Exercise Guidance" text={p.exercise} accent={C.emerald} /> : null}
      {p.seasons ? <HighlightBox label="Seasonal Care" text={p.seasons} accent={C.gold} /> : null}

      <PageFooter />
    </Page>
  )
}

// ── YANTRA SECTION ────────────────────────────────────────────────────────────
function YantraPages({ data, number }: { data: any; number: string }) {
  const y = data.yantra || data.yantraColour || data
  if (!y?.primaryYantra) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Yantra & Colour Therapy" sanskrit="Yantra Shastra — Sacred Geometry" />

      <View style={styles.row}>
        <View style={[styles.highlight, { flex: 1, borderLeftColor: C.saffron }]}>
          <Text style={[styles.label, { color: C.saffron }]}>Personal Yantra</Text>
          <Text style={styles.value}>{y.primaryYantra?.name}</Text>
          {y.primaryYantra?.deity ? <Text style={styles.bodySmall}>Presiding Deity: {y.primaryYantra.deity}</Text> : null}
          {y.primaryYantra?.planet ? <Text style={styles.bodySmall}>Governing Planet: {y.primaryYantra.planet}</Text> : null}
          {y.primaryYantra?.mantra ? <Text style={[styles.italic, { marginTop: 3 }]}>{y.primaryYantra.mantra}</Text> : null}
        </View>
        {y.gemstone?.primary ? (
          <View style={[styles.highlight, { flex: 1, borderLeftColor: '#f43f5e' }]}>
            <Text style={[styles.label, { color: '#f43f5e' }]}>Power Gemstone</Text>
            <Text style={styles.value}>{y.gemstone.primary}</Text>
            {y.gemstone.finger ? <Text style={styles.bodySmall}>Wear on: {y.gemstone.finger} finger</Text> : null}
            {y.gemstone.metal ? <Text style={styles.bodySmall}>Metal: {y.gemstone.metal}</Text> : null}
            {y.gemstone.weight ? <Text style={styles.bodySmall}>Min. Weight: {y.gemstone.weight}</Text> : null}
            {y.gemstone.muhurta ? <Text style={[styles.italic, { marginTop: 2 }]}>Best Day: {y.gemstone.muhurta}</Text> : null}
          </View>
        ) : null}
      </View>

      {y.primaryYantra?.benefits?.length ? (
        <View style={{ marginTop: 5 }}>
          <Text style={styles.label}>Yantra Benefits</Text>
          <TagRow items={y.primaryYantra.benefits} />
        </View>
      ) : null}
      {y.primaryYantra?.installation ? <HighlightBox label="Yantra Installation & Activation" text={y.primaryYantra.installation} /> : null}
      {y.primaryYantra?.worship ? <HighlightBox label="Daily Worship Method" text={y.primaryYantra.worship} accent={C.gold} /> : null}

      {y.numerologicalYantra ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Numerological Lucky Yantra</SectionLabel>
          <HighlightBox text={y.numerologicalYantra} accent={C.purple} />
        </View>
      ) : null}

      {y.colourTherapy ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Colour Therapy Prescription</SectionLabel>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {y.colourTherapy.power?.length ? (
              <View style={{ flex: 1, minWidth: '30%' }}>
                <Text style={styles.label}>Power Colours</Text>
                <TagRow items={Array.isArray(y.colourTherapy.power) ? y.colourTherapy.power : [y.colourTherapy.power]} />
              </View>
            ) : null}
            {y.colourTherapy.forHealth?.length ? (
              <View style={{ flex: 1, minWidth: '30%' }}>
                <Text style={[styles.label, { color: C.emerald }]}>For Health</Text>
                <TagRow items={Array.isArray(y.colourTherapy.forHealth) ? y.colourTherapy.forHealth : [y.colourTherapy.forHealth]} />
              </View>
            ) : null}
            {y.colourTherapy.forWealth?.length ? (
              <View style={{ flex: 1, minWidth: '30%' }}>
                <Text style={[styles.label, { color: C.amber }]}>For Wealth</Text>
                <TagRow items={Array.isArray(y.colourTherapy.forWealth) ? y.colourTherapy.forWealth : [y.colourTherapy.forWealth]} />
              </View>
            ) : null}
          </View>
          {y.colourTherapy.avoid?.length ? (
            <View style={{ marginTop: 5 }}>
              <Text style={[styles.label, { color: '#dc2626' }]}>Colours to Avoid</Text>
              <TagRow items={Array.isArray(y.colourTherapy.avoid) ? y.colourTherapy.avoid : [y.colourTherapy.avoid]} />
            </View>
          ) : null}
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── MANTRA SECTION ────────────────────────────────────────────────────────────
function MantraPages({ data, number }: { data: any; number: string }) {
  const m = data.mantras || data.mantra || data
  const ch = m?.chanting || m?.mantraChanting
  const wr = m?.writing || m?.mantraLekhnan || data.mantraLekhnan
  if (!ch && !wr) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Mantra Guidance" sanskrit="Mantra Sadhana — Sacred Sound Practice" />

      {ch ? (
        <View>
          <SectionLabel>Chanting Practice (Japa Sadhana)</SectionLabel>
          <InfoGrid cols={2} items={[
            { label: 'Beej Mantra', value: ch.beejMantra },
            { label: 'Main Mantra', value: ch.mainMantra },
            { label: 'Daily Repetitions', value: ch.repetitions || ch.japa },
            { label: 'Best Time', value: ch.bestTime || ch.timing },
            { label: 'Duration', value: ch.duration },
            { label: 'Mala Beads', value: ch.mala },
            { label: 'Direction to Face', value: ch.direction },
            { label: 'Deity', value: ch.deity },
          ]} />
          {ch.instructions ? <HighlightBox label="Chanting Instructions" text={ch.instructions} /> : null}
          {ch.preparatoryRites ? <HighlightBox label="Preparatory Rites" text={ch.preparatoryRites} accent={C.gold} /> : null}
          {Array.isArray(ch.benefits) && ch.benefits.length ? (
            <View style={{ marginTop: 5 }}>
              <Text style={[styles.label, { marginBottom: 3 }]}>Benefits of This Mantra Practice</Text>
              <BulletList items={ch.benefits.slice(0, 7)} />
            </View>
          ) : null}
        </View>
      ) : null}

      {wr ? (
        <View style={{ marginTop: ch ? 10 : 0 }}>
          <SectionLabel>Likhit Japa — Sacred Writing Practice</SectionLabel>
          <InfoGrid cols={2} items={[
            { label: 'Mantra to Write', value: wr.mantra || wr.likhitMantra },
            { label: 'Daily Count', value: wr.dailyCount || wr.count },
            { label: 'Best Time', value: wr.bestTime || wr.timing },
            { label: 'Pen / Ink Color', value: wr.penColor },
            { label: 'Paper Color', value: wr.paperColor },
            { label: 'Duration', value: wr.duration },
            { label: 'Direction to Face', value: wr.direction },
            { label: 'Special Notes', value: wr.notes },
          ]} />
          {wr.instructions ? <HighlightBox label="Writing Instructions" text={wr.instructions} /> : null}
          {Array.isArray(wr.benefits) && wr.benefits.length ? (
            <View style={{ marginTop: 5 }}>
              <Text style={[styles.label, { marginBottom: 3 }]}>Benefits</Text>
              <BulletList items={wr.benefits.slice(0, 5)} />
            </View>
          ) : null}
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── PSYCHOLOGY SECTION ────────────────────────────────────────────────────────
function PsychologyPages({ data, number }: { data: any; number: string }) {
  const ps = data.psychology || data
  if (!ps?.moonPersonalityType) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Vedic Psychology" sanskrit="Manas Vigyan — Mind Science" />

      <View style={[styles.cardBlue, { marginBottom: 10 }]}>
        <Text style={[styles.label, { color: C.goldLight, marginBottom: 3 }]}>Moon Archetype — Your Psychological Type</Text>
        <Text style={{ fontSize: 20, fontFamily: 'CGb', color: C.white }}>{ps.moonPersonalityType}</Text>
        {ps.moonArchetypeTagline ? <Text style={{ fontSize: 8.5, fontFamily: 'CGi', color: C.goldLight, marginTop: 3 }}>{ps.moonArchetypeTagline}</Text> : null}
      </View>

      <InfoGrid cols={2} items={[
        { label: 'Cognitive Style', value: ps.cognitiveStyle },
        { label: 'Career Personality', value: ps.careerPersonality },
        { label: 'Relationship Style', value: ps.relationshipStyle },
        { label: 'Stress Response', value: ps.stressTriggers },
        { label: 'Communication Style', value: ps.communicationStyle },
        { label: 'Decision Making', value: ps.decisionMaking },
      ]} />

      {ps.coreTrait ? <HighlightBox label="Core Psychological Trait" text={ps.coreTrait} /> : null}
      {ps.emotionalPatterns ? <HighlightBox label="Emotional Patterns & Tendencies" text={ps.emotionalPatterns} /> : null}
      {ps.motivations ? <HighlightBox label="Core Motivations & Drives" text={ps.motivations} accent={C.gold} /> : null}
      {ps.growthEdge ? <HighlightBox label="Growth Edge — Your Highest Potential" text={ps.growthEdge} accent={C.saffron} /> : null}
      {ps.relationships ? <HighlightBox label="Relationship Psychology" text={ps.relationships} accent={C.navyMid} /> : null}

      <TwoColInfo
        left={{ label: 'Natural Strengths', items: ps.strengths?.slice(0, 6) || [] }}
        right={{ label: 'Shadow Work Themes', items: ps.shadowWork?.slice(0, 6) || [] }}
      />

      {Array.isArray(ps.healingPractices) && ps.healingPractices.length ? (
        <View style={{ marginTop: 6 }}>
          <SectionLabel>Recommended Healing Practices</SectionLabel>
          <BulletList items={ps.healingPractices.slice(0, 6)} />
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── DMIT SECTION ──────────────────────────────────────────────────────────────
function DmitPages({ data, canvasImg, number }: { data: any; canvasImg?: string; number: string }) {
  const dmit = data.dmit || data
  if (!dmit?.learningStyle && !dmit?.allIntelligences?.length) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="DMIT Intelligence Profile" sanskrit="Dermatoglyphics — Fingerprint Analysis" />

      {canvasImg ? (
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Image src={canvasImg} style={{ width: 130, height: 130 }} />
        </View>
      ) : null}

      <InfoGrid cols={2} items={[
        { label: 'Learning Style', value: dmit.learningStyle },
        { label: 'Dominant Brain', value: dmit.dominantBrain },
        { label: 'Brain Quotient', value: dmit.brainQuotient },
        { label: 'ATD Angle', value: dmit.atdAngle },
      ]} />

      {dmit.learningStyleDescription ? <HighlightBox label="Learning Style Explained" text={dmit.learningStyleDescription} /> : null}

      {dmit.allIntelligences?.length ? (
        <View style={{ marginTop: 6 }}>
          <SectionLabel>Multiple Intelligence Profile</SectionLabel>
          {dmit.allIntelligences.map((intel: any, i: number) => (
            <View key={i} style={{ marginBottom: 5 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={[styles.label, { marginBottom: 0 }]}>{intel.type}</Text>
                <Text style={[styles.label, { marginBottom: 0, color: intel.strength === 'Strong' ? C.emerald : intel.strength === 'Moderate' ? C.amber : C.grayMid }]}>
                  {intel.strength} · {intel.score}%
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, {
                  width: `${intel.score || 0}%`,
                  backgroundColor: intel.strength === 'Strong' ? C.emerald : intel.strength === 'Moderate' ? C.amber : C.grayMid,
                }]} />
              </View>
              {intel.description ? <Text style={[styles.bodySmall, { marginTop: 2, color: C.gray }]}>{intel.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      <TwoColInfo
        left={{ label: 'Recommended Academic Streams', items: dmit.recommendedStreams?.slice(0, 5) || [] }}
        right={{ label: 'Career Alignment', items: dmit.careerAlignment?.slice(0, 5) || [] }}
      />

      {Array.isArray(dmit.parentingTips) && dmit.parentingTips.length ? (
        <View style={{ marginTop: 6 }}>
          <SectionLabel>Parenting & Coaching Guidance</SectionLabel>
          <BulletList items={dmit.parentingTips.slice(0, 6)} />
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── COLOUR THERAPY SECTION ────────────────────────────────────────────────────
function ColourTherapyPages({ data, number }: { data: any; number: string }) {
  const ct = data.colourTherapy || data
  if (!ct?.healingColors && !ct?.chromotherapy) return null

  const healingCats = [
    { label: 'Physical Healing', colors: ct.healingColors?.physical, accent: C.emerald },
    { label: 'Emotional Healing', colors: ct.healingColors?.emotional, accent: '#ec4899' },
    { label: 'Mental Clarity', colors: ct.healingColors?.mental, accent: '#3b82f6' },
    { label: 'Spiritual Growth', colors: ct.healingColors?.spiritual, accent: '#8b5cf6' },
  ].filter(c => c.colors?.length)

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Colour Therapy" sanskrit="Ranga Chikitsa — Chromotherapy" />

      {healingCats.length ? (
        <View>
          <SectionLabel>Healing Colour Prescription</SectionLabel>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {healingCats.map((cat) => {
              const cols: string[] = Array.isArray(cat.colors) ? cat.colors : [cat.colors]
              return (
                <View key={cat.label} style={[styles.card, { width: '47%', marginBottom: 6, borderTopColor: cat.accent }]}>
                  <Text style={[styles.label, { color: cat.accent }]}>{cat.label}</Text>
                  <TagRow items={cols.slice(0, 4)} />
                </View>
              )
            })}
          </View>
        </View>
      ) : null}

      {ct.powerColor ? (
        <View style={[styles.cardBlue, { marginBottom: 8 }]}>
          <Text style={[styles.label, { color: C.goldLight }]}>Your Power Colour</Text>
          <Text style={{ fontSize: 18, fontFamily: 'CGb', color: C.white }}>{ct.powerColor}</Text>
          {ct.powerColorMeaning ? <Text style={{ fontSize: 8.5, color: C.goldPale, marginTop: 3 }}>{ct.powerColorMeaning}</Text> : null}
        </View>
      ) : null}

      {ct.chromotherapy ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Chromotherapy Session Plan</SectionLabel>
          <InfoGrid cols={2} items={[
            { label: 'Primary Color', value: ct.chromotherapy.primaryColor },
            { label: 'Session Duration', value: ct.chromotherapy.duration },
            { label: 'Sessions per Week', value: ct.chromotherapy.sessions },
            { label: 'Best Time', value: ct.chromotherapy.bestTime },
          ]} />
          {ct.chromotherapy.waterSolarization ? <HighlightBox label="Water Solarization Method" text={ct.chromotherapy.waterSolarization} /> : null}
        </View>
      ) : null}

      {ct.colorMeditation ? <HighlightBox label="Colour Meditation Practice" text={ct.colorMeditation} accent="#8b5cf6" /> : null}
      {ct.wardrobe ? <HighlightBox label="Wardrobe & Colour Wearing Guidance" text={ct.wardrobe} accent={C.gold} /> : null}

      <PageFooter />
    </Page>
  )
}

// ── ANNUAL PREDICTION SECTION ─────────────────────────────────────────────────
function AnnualPredictionPages({ data, number }: { data: any; number: string }) {
  const ap = data.annualPrediction || data
  if (!ap) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Annual Prediction" sanskrit="Varshik Bhavisyavani — Yearly Forecast" />

      {ap.overallTheme ? (
        <View style={[styles.cardBlue, { marginBottom: 10 }]}>
          <Text style={[styles.label, { color: C.goldLight, marginBottom: 3 }]}>Annual Theme & Focus</Text>
          <Text style={[styles.body, { color: C.white }]}>{ap.overallTheme}</Text>
        </View>
      ) : null}

      {ap.year ? (
        <InfoGrid cols={2} items={[
          { label: 'Personal Year', value: ap.personalYear },
          { label: 'Ruling Planet', value: ap.rulingPlanet },
          { label: 'Lucky Numbers', value: ap.luckyNumbers?.join(', ') },
          { label: 'Lucky Days', value: ap.luckyDays?.join(', ') },
        ]} />
      ) : null}

      {ap.quarters?.length ? (
        <View style={{ marginTop: 6 }}>
          <SectionLabel>Quarterly Guidance</SectionLabel>
          {ap.quarters.map((q: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', borderBottom: `0.5pt solid ${C.grayLight}`, paddingVertical: 6 }}>
              <View style={{ width: 3, backgroundColor: C.saffron, marginRight: 9, borderRadius: 1 }} />
              <Text style={[styles.value, { width: 90, flexShrink: 0, fontSize: 8.5, color: C.saffron }]}>{q.period}</Text>
              <View style={{ flex: 1 }}>
                {q.theme ? <Text style={[styles.label, { marginBottom: 2 }]}>{q.theme}</Text> : null}
                {q.guidance ? <Text style={styles.body}>{q.guidance}</Text> : null}
                {q.focus ? <Text style={[styles.bodySmall, { color: C.saffron, marginTop: 2 }]}>Focus: {q.focus}</Text> : null}
                {q.caution ? <Text style={[styles.bodySmall, { color: '#dc2626', marginTop: 1 }]}>Caution: {q.caution}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {ap.monthlyPredictions?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Monthly Overview</SectionLabel>
          {ap.monthlyPredictions.slice(0, 12).map((m: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', borderBottom: `0.5pt solid ${C.grayLight}`, paddingVertical: 4 }}>
              <Text style={[styles.value, { width: 75, flexShrink: 0, fontSize: 8, color: C.gold }]}>{m.month}</Text>
              <Text style={[styles.body, { flex: 1 }]}>{m.prediction || m.forecast}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {ap.auspiciousDates?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Auspicious Dates & Muhurta</SectionLabel>
          <TagRow items={ap.auspiciousDates.slice(0, 10)} />
        </View>
      ) : null}

      <PageFooter />
    </Page>
  )
}

// ── REMEDIES SECTION ──────────────────────────────────────────────────────────
function RemediesPages({ data, number }: { data: any; number: string }) {
  const r = data.remediesSummary || data.remedies || data
  if (!r) return null

  const renderRemedyGroup = (label: string, items: any, accent = C.saffron) => {
    if (!items) return null
    const arr = Array.isArray(items) ? items : [items]
    if (!arr.length) return null
    return (
      <View style={{ marginBottom: 9 }}>
        <Text style={[styles.h3, { color: C.navy, marginBottom: 4 }]}>{label}</Text>
        {arr.map((item: any, i: number) => {
          if (typeof item === 'string') {
            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 3 }}>
                <Svg width={8} height={9} viewBox="0 0 24 24" style={{ marginTop: 2, marginRight: 6, flexShrink: 0 }}>
                  <Path d="M12 2L22 20H2L12 2Z" fill={accent} />
                </Svg>
                <Text style={[styles.bullet, { flex: 1 }]}>{item}</Text>
              </View>
            )
          }
          return (
            <View key={i} style={[styles.card, { marginBottom: 4 }]}>
              {item.name || item.deity || item.planet ? (
                <Text style={[styles.label, { marginBottom: 2, color: accent }]}>{item.name || item.deity || item.planet}</Text>
              ) : null}
              {item.description || item.remedy || item.action ? (
                <Text style={styles.body}>{item.description || item.remedy || item.action}</Text>
              ) : null}
              {item.mantra ? <Text style={styles.italic}>Mantra: {item.mantra}</Text> : null}
              {item.day ? <Text style={styles.bodySmall}>Day: {item.day}  {item.time ? `· Time: ${item.time}` : ''}</Text> : null}
              {item.duration ? <Text style={styles.bodySmall}>Duration: {item.duration}</Text> : null}
            </View>
          )
        })}
      </View>
    )
  }

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Remedies & Upaya" sanskrit="Upaya Shastra — Vedic Remediation" />

      {renderRemedyGroup('Planetary Remedies (Graha Upaya)', r.planetary || r.planetaryRemedies, C.saffron)}
      {renderRemedyGroup('Mantra Remedies', r.mantra || r.mantraRemedies, C.navyMid)}
      {renderRemedyGroup('Gemstone Recommendations', r.gemstones || r.gemstoneRemedies, C.gold)}
      {renderRemedyGroup('Charity & Donations (Dana)', r.charity || r.donations, C.emerald)}
      {renderRemedyGroup('Fasting & Rituals (Vrata)', r.fasting || r.rituals, C.amber)}
      {renderRemedyGroup('General Remedies', r.general)}
      {Array.isArray(r) ? renderRemedyGroup('Remedies', r) : null}
      {typeof r === 'string' ? <Text style={styles.body}>{r}</Text> : null}

      <PageFooter />
    </Page>
  )
}

// ── VASTU SECTION ─────────────────────────────────────────────────────────────
function VastuPages({ data, number }: { data: any; number: string }) {
  const v = data.vastu || data.vastuAnalysis || data
  if (!v?.homeDirection && !v?.recommendations?.length) return null

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Astro Vastu" sanskrit="Jyotisha Vastu — Vedic Architecture" />

      <InfoGrid cols={2} items={[
        { label: 'Home / Office Direction', value: v.homeDirection },
        { label: 'Favorable Direction', value: v.favorableDirection },
        { label: 'Direction to Avoid', value: v.avoidDirection },
        { label: 'Best Entry Direction', value: v.entryDirection },
        { label: 'Bedroom Direction', value: v.bedroomDirection },
        { label: 'Study / Work Zone', value: v.studyDirection },
      ]} />

      {v.summary ? <HighlightBox label="Vastu Analysis Summary" text={v.summary} /> : null}

      <TwoColInfo
        left={{ label: 'Vastu Recommendations', items: v.recommendations?.slice(0, 8) || [] }}
        right={{ label: 'Vastu Remedies', items: v.remedies?.slice(0, 8) || [] }}
      />

      {v.plants?.length ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.label, { marginBottom: 3 }]}>Beneficial Plants for Your Space</Text>
          <TagRow items={v.plants.slice(0, 8)} />
        </View>
      ) : null}
      {v.colors?.length ? (
        <View style={{ marginTop: 6 }}>
          <Text style={[styles.label, { marginBottom: 3 }]}>Vastu Colours for Your Home</Text>
          <TagRow items={v.colors.slice(0, 8)} />
        </View>
      ) : null }

      <PageFooter />
    </Page>
  )
}

// ── DISCLAIMER PAGE ───────────────────────────────────────────────────────────
function DisclaimerPage() {
  const items = [
    { title: 'Nature of This Report', body: 'This Tathastu report is prepared for informational, educational, and self-discovery purposes only. It is based on traditional Indian astrological, numerological, and Ayurvedic systems and should be treated as guidance for self-awareness rather than as definitive prediction or professional advice.' },
    { title: 'Medical Disclaimer', body: 'The Ayurvedic and health-related content is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.' },
    { title: 'Financial Disclaimer', body: 'Muhurta timing guidance and financial period analysis are traditional Vedic tools for awareness and should not be used as the sole basis for financial or investment decisions.' },
    { title: 'Astronomical Accuracy', body: 'Planetary positions are calculated using the NASA-grade astronomy-engine library with Lahiri ayanamsa (the official standard of the Government of India). Accuracy is within ±0.001 degrees.' },
    { title: 'Free Will & Destiny', body: 'Vedic astrology recognizes that the birth chart shows tendencies and potential — not fixed destiny. Human free will, conscious effort, and spiritual practice can always transform outcomes.' },
  ]

  return (
    <Page size="A4" style={styles.page}>
      <PageBorder />
      <PageWatermark />
      <TitleHeader title="Disclaimer & Guidance Notes" subtitle="Appendix" />

      {items.map((item) => (
        <View key={item.title} style={[styles.card, { marginBottom: 6 }]}>
          <Text style={[styles.h3, { color: C.navy, marginBottom: 2 }]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}

      <OrnamentDivider mt={12} mb={12} />

      <View style={[styles.highlightGold, { alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, fontFamily: 'CGbi', color: C.crimson, textAlign: 'center', marginBottom: 5 }}>Om Tat Sat</Text>
        <Text style={[styles.body, { textAlign: 'center' }]}>
          May this report guide you on your path to self-knowledge and dharmic living.{'\n'}
          Follow the remedies with faith, patience and devotion for 90 days minimum.
        </Text>
        <Text style={[styles.bodySmall, { textAlign: 'center', color: C.navy, marginTop: 5, fontFamily: 'LatoBold' }]}>
          — MahaTathastu · Anushthaan India
        </Text>
        <Text style={[styles.bodyMuted, { textAlign: 'center', marginTop: 3 }]}>
          Contents are copyright protected and owned by MahaTathastu
        </Text>
      </View>

      <PageFooter />
    </Page>
  )
}

// ── Metadata ──────────────────────────────────────────────────────────────────
const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV']

export interface ReportPDFProps {
  report: {
    id: string
    report_type: string
    status: string
    report_content: any
    created_at: string
    family_members: { full_name: string; date_of_birth: string; place_of_birth: string | null } | null
  }
  canvases?: Record<string, string>
}

const REPORT_TITLES: Record<string, string> = {
  full_tathastu:    'Full Tathastu Report',
  astrology:        'Kundli & Birth Chart',
  numerology:       'Numerology Analysis',
  shakti_chakra:    'Shakti Chakra Report',
  prakriti:         'Prakriti (Ayurveda)',
  yantra_colour:    'Yantra & Colour Therapy',
  mantra_chanting:  'Mantra Chanting Guide',
  mantra_writing:   'Likhit Japa Guide',
  astro_vastu:      'Astro Vastu Report',
  psychology:       'Vedic Psychology',
  dmit:             'DMIT Intelligence Profile',
  colour_therapy:   'Colour Therapy',
  child_development:'Child Development',
  mobile_number:    'Mobile Number Analysis',
}

export default function ReportPDF({ report, canvases = {} }: ReportPDFProps) {
  const d = report.report_content || {}
  const member = report.family_members
  const rt = report.report_type
  const isFull = rt === 'full_tathastu'
  const title = REPORT_TITLES[rt] || 'Tathastu Report'

  type Section = { id: string; show: boolean; node: React.ReactElement | null }

  const sections: Section[] = [
    { id: 'astrology',       show: (rt === 'astrology' || isFull) && !!(d.kundli?.ascendant), node: <KundliPages data={d} canvasImg={canvases.astrology} number="I" /> },
    { id: 'numerology',      show: (rt === 'numerology' || isFull) && !!(d.numerology?.lifePathNumber), node: <NumerologyPages data={d} canvasImg={canvases.numerology} number="I" /> },
    { id: 'shakti_chakra',   show: (rt === 'shakti_chakra' || isFull) && !!(d.chakras?.length || d.chakra?.length), node: <ChakraPages data={d} number="I" /> },
    { id: 'prakriti',        show: (rt === 'prakriti' || isFull) && !!(d.prakriti?.dominant), node: <PrakritiPages data={d} number="I" /> },
    { id: 'yantra_colour',   show: (rt === 'yantra_colour' || isFull) && !!(d.yantra?.primaryYantra || d.yantraColour?.primaryYantra), node: <YantraPages data={d} number="I" /> },
    { id: 'mantra_chanting', show: (['mantra_chanting','mantra_writing'].includes(rt) || isFull) && !!(d.mantras?.chanting || d.mantra?.chanting || d.mantraLekhnan), node: <MantraPages data={d} number="I" /> },
    { id: 'psychology',      show: (rt === 'psychology' || isFull) && !!(d.psychology?.moonPersonalityType), node: <PsychologyPages data={d} number="I" /> },
    { id: 'astro_vastu',     show: (rt === 'astro_vastu' || isFull) && !!(d.vastu?.homeDirection || d.vastuAnalysis?.homeDirection), node: <VastuPages data={d} number="I" /> },
    { id: 'dmit',            show: (rt === 'dmit' || isFull) && !!(d.dmit?.learningStyle), node: <DmitPages data={d} canvasImg={canvases.dmit} number="I" /> },
    { id: 'colour_therapy',  show: (rt === 'colour_therapy' || isFull) && !!(d.colourTherapy?.healingColors || d.colourTherapy?.chromotherapy), node: <ColourTherapyPages data={d} number="I" /> },
    { id: 'annual_prediction', show: isFull && !!d.annualPrediction, node: <AnnualPredictionPages data={d} number="I" /> },
    { id: 'remedies',        show: isFull && !!(d.remediesSummary || d.remedies), node: <RemediesPages data={d} number="I" /> },
  ]

  let idx = 0
  const visibleSections = sections.filter(s => s.show)
  visibleSections.forEach(s => {
    s.node = React.cloneElement(s.node as React.ReactElement<any>, { number: ROMAN[idx++] ?? String(idx) })
  })

  return (
    <Document title={title} author="MahaTathastu" subject={title} creator="MahaTathastu Report System">
      <CoverPage report={report} member={member} title={title} />
      <GuidancePage />
      {visibleSections.map(s => s.node ? React.cloneElement(s.node, { key: s.id }) : null)}
      <DisclaimerPage />
    </Document>
  )
}
