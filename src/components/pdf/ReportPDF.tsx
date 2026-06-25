import React from 'react'
import {
  Document, Page, View, Text, Image, StyleSheet,
  Svg, Circle, Ellipse, Polygon, Path,
} from '@react-pdf/renderer'

// ── Brand colours ─────────────────────────────────────────────────────────────
const C = {
  navyDark:     '#081438',
  navy:         '#0b1d52',
  navyMid:      '#1a3a8c',
  saffron:      '#E36414',
  saffronDark:  '#A33D00',
  saffronLight: '#F5A623',
  gold:         '#D4A043',
  goldMid:      '#C49B37',
  goldLight:    '#DAB95F',
  goldPale:     '#EDD9A3',
  warmSand:     '#F5EDD8',
  parchment:    '#FBF5E8',
  parchmentDeep:'#E9DFCE',
  offWhite:     '#FAF6EF',
  charcoal:     '#3D3530',
  crimson:      '#B5220A',
  white:        '#FFFFFF',
  gray:         '#6b7280',
  grayLight:    '#e5e7eb',
  grayMid:      '#9ca3af',
  text:         '#374151',
  textDark:     '#1d1c14',
  emerald:      '#059669',
  amber:        '#d97706',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.parchment,
    paddingTop: 34,
    paddingBottom: 34,
    paddingLeft: 32,
    paddingRight: 32,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  // Typography
  h1: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 6 },
  h2: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 4 },
  h3: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 3 },
  label: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.grayMid, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.navy },
  body: { fontSize: 9.5, color: C.charcoal, lineHeight: 1.6 },
  bodySmall: { fontSize: 8.5, color: C.text, lineHeight: 1.55 },
  bodyMuted: { fontSize: 8.5, color: C.gray, lineHeight: 1.5 },
  italic: { fontSize: 9, color: C.gray, fontStyle: 'italic', lineHeight: 1.5 },
  bullet: { fontSize: 9.5, color: C.textDark, lineHeight: 1.65, marginBottom: 3 },
  // Layout
  row: { flexDirection: 'row', gap: 6 },
  dividerGold: { height: 1, backgroundColor: C.goldMid, marginVertical: 8 },
  dividerLight: { height: 0.5, backgroundColor: C.grayLight, marginVertical: 6 },
  // Cards
  card: {
    backgroundColor: C.offWhite,
    borderTop: `3pt solid ${C.gold}`,
    borderBottom: `0.5pt solid ${C.grayLight}`,
    borderLeft: `0.5pt solid ${C.grayLight}`,
    borderRight: `0.5pt solid ${C.grayLight}`,
    padding: '6pt 8pt',
    marginBottom: 5,
  },
  cardBlue: {
    backgroundColor: C.navyDark,
    padding: '8pt 11pt',
    marginBottom: 5,
  },
  highlight: {
    backgroundColor: C.offWhite,
    padding: '7pt 10pt',
    borderLeft: `4pt solid ${C.saffron}`,
    borderBottom: `0.5pt solid ${C.grayLight}`,
    marginBottom: 6,
  },
  highlightGold: {
    backgroundColor: '#fef9e7',
    padding: '8pt 11pt',
    borderLeft: `4pt solid ${C.gold}`,
    borderBottom: `0.5pt solid ${C.goldPale}`,
    marginBottom: 6,
  },
  // Table
  table: { width: '100%', marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.navy,
    padding: '5pt 6pt',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '4pt 6pt',
    borderBottom: `0.5pt solid ${C.grayLight}`,
    backgroundColor: C.offWhite,
  },
  tableRowAlt: {
    flexDirection: 'row',
    padding: '4pt 6pt',
    borderBottom: `0.5pt solid ${C.grayLight}`,
    backgroundColor: '#fdf8f0',
  },
  th: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.3 },
  td: { fontSize: 8.5, color: C.text },
  tdBold: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.navy },
  // Progress
  progressBg: { height: 6, backgroundColor: C.grayLight, borderRadius: 3, overflow: 'hidden', marginTop: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  // Tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  tag: { backgroundColor: C.warmSand, border: `0.5pt solid ${C.goldLight}`, padding: '2pt 7pt', borderRadius: 10 },
  tagNavy: { backgroundColor: C.navy, padding: '2pt 8pt', borderRadius: 10 },
})

// ── Sudarshan Chakra (our logo) ───────────────────────────────────────────────
function SudarshanChakra({ size = 100 }: { size?: number }) {
  const outerPetals = Array.from({ length: 16 }, (_, i) => i * 22.5)
  const innerPetals = Array.from({ length: 8 }, (_, i) => i * 45)
  const spokes     = Array.from({ length: 8 }, (_, i) => i * 45)
  const spokeDots  = Array.from({ length: 8 }, (_, i) => i * 45 + 22.5)

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Polygon
        points="100,4 121.5,19.8 148,16.9 158.7,41.3 183.1,52 180.2,78.5 196,100 180.2,121.5 183.1,148 158.7,158.7 148,183.1 121.5,180.2 100,196 78.5,180.2 52,183.1 41.3,158.7 16.9,148 19.8,121.5 4,100 19.8,78.5 16.9,52 41.3,41.3 52,16.9 78.5,19.8"
        fill="#E36414"
      />
      <Circle cx={100} cy={100} r={82} fill="#FEF5EC" />
      <Circle cx={100} cy={100} r={80} fill="none" stroke="#E36414" strokeWidth={2.5} />
      {outerPetals.map((angle) => (
        <Ellipse key={angle} cx={100} cy={28} rx={5} ry={11}
          fill="#E36414" stroke="#D4A017" strokeWidth={0.7}
          transform={`rotate(${angle} 100 100)`} />
      ))}
      <Circle cx={100} cy={100} r={62} fill="none" stroke="#D4A017" strokeWidth={2} />
      {spokes.map((angle) => (
        <Path key={angle} d="M 100,41 L 96.5,51 L 100,59 L 103.5,51 Z"
          fill="#2F2A44" transform={`rotate(${angle} 100 100)`} />
      ))}
      {spokeDots.map((angle) => (
        <Circle key={angle} cx={100} cy={50} r={2.5}
          fill="#E36414" transform={`rotate(${angle} 100 100)`} />
      ))}
      <Circle cx={100} cy={100} r={40} fill="none" stroke="#D4A017" strokeWidth={2.5} />
      {innerPetals.map((angle) => (
        <Ellipse key={angle} cx={100} cy={65} rx={3.5} ry={8}
          fill="#C67D53" stroke="#D4A017" strokeWidth={0.6}
          transform={`rotate(${angle} 100 100)`} />
      ))}
      <Circle cx={100} cy={100} r={27} fill="#2F2A44" />
      <Circle cx={100} cy={100} r={25} fill="none" stroke="#D4A017" strokeWidth={1.5} />
      <Circle cx={100} cy={100} r={16} fill="#E36414" />
      <Circle cx={100} cy={100} r={9}  fill="#2F2A44" />
      <Circle cx={100} cy={100} r={5}  fill="#D4A017" />
    </Svg>
  )
}

// ── Ornament divider (three-diamond SVG) ──────────────────────────────────────
function OrnamentDivider({ color = C.gold, mt = 8, mb = 8, width = 220 }: { color?: string; mt?: number; mb?: number; width?: number }) {
  const cx = width / 2
  return (
    <View style={{ alignItems: 'center', marginTop: mt, marginBottom: mb }}>
      <Svg width={width} height={16} viewBox={`0 0 ${width} 16`}>
        <Path d={`M 0,8 L ${cx - 22},8`} stroke={color} strokeWidth={0.8} />
        <Path d={`M ${cx - 19},8 L ${cx - 13},3 L ${cx - 7},8 L ${cx - 13},13 Z`} fill={color} />
        <Path d={`M ${cx - 4},8 L ${cx},2 L ${cx + 4},8 L ${cx},14 Z`} fill={color} />
        <Path d={`M ${cx + 7},8 L ${cx + 13},3 L ${cx + 19},8 L ${cx + 13},13 Z`} fill={color} />
        <Path d={`M ${cx + 22},8 L ${width},8`} stroke={color} strokeWidth={0.8} />
      </Svg>
    </View>
  )
}

// ── Diamond corner marks ──────────────────────────────────────────────────────
function DiamondCorners({ inset = 3, size = 9, color = C.gold }: { inset?: number; size?: number; color?: string }) {
  const d = `M ${size / 2},0 L ${size},${size / 2} L ${size / 2},${size} L 0,${size / 2} Z`
  return (
    <>
      <View style={{ position: 'absolute', top: inset, left: inset }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Path d={d} fill={color} /></Svg>
      </View>
      <View style={{ position: 'absolute', top: inset, right: inset }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Path d={d} fill={color} /></Svg>
      </View>
      <View style={{ position: 'absolute', bottom: inset, left: inset }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Path d={d} fill={color} /></Svg>
      </View>
      <View style={{ position: 'absolute', bottom: inset, right: inset }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><Path d={d} fill={color} /></Svg>
      </View>
    </>
  )
}

// ── Corner lotus ornament ─────────────────────────────────────────────────────
function CornerLotus({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={4} cy={4} r={2.5} fill={C.gold} />
      <Path d="M 6,4 Q 17,1 27,4 Q 17,7 6,4 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 4,6 Q 1,17 4,27 Q 7,17 4,6 Z" fill={C.gold} opacity={0.8} />
      <Path d="M 13,4 Q 9,9 4,13" stroke={C.gold} strokeWidth={0.6} fill="none" opacity={0.55} />
      <Circle cx={9}  cy={9}  r={1.8} fill={C.gold} opacity={0.55} />
      <Circle cx={15} cy={15} r={1.2} fill={C.gold} opacity={0.4}  />
      <Circle cx={21} cy={21} r={0.8} fill={C.gold} opacity={0.25} />
    </Svg>
  )
}

// ── Interior page border with diamond corners ─────────────────────────────────
function PageBorder() {
  return (
    <>
      <View style={{ position: 'absolute', top: 6,  left: 6,  right: 6,  bottom: 6,  border: `2pt solid ${C.gold}` }} />
      <View style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: `0.5pt solid ${C.goldLight}` }} />
      <DiamondCorners inset={3} size={9} />
    </>
  )
}

// ── Subtle watermark chakra (interior pages) ──────────────────────────────────
function PageWatermark() {
  return (
    <View style={{ position: 'absolute', top: 28, right: 28, opacity: 0.04 }}>
      <SudarshanChakra size={160} />
    </View>
  )
}

// ── Gold watermark circles on navy sections ───────────────────────────────────
function NavyWatermarkCircles({ w = 595, h = 290 }: { w?: number; h?: number }) {
  const cx = w / 2, cy = h / 2
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <Circle cx={cx} cy={cy} r={130} fill="none" stroke={C.goldMid} strokeWidth={0.5} opacity={0.10} />
        <Circle cx={cx} cy={cy} r={100} fill="none" stroke={C.goldMid} strokeWidth={0.5} opacity={0.10} strokeDasharray="5 5" />
        <Circle cx={cx} cy={cy} r={70}  fill="none" stroke={C.goldMid} strokeWidth={0.4} opacity={0.10} />
        <Circle cx={cx} cy={cy} r={40}  fill="none" stroke={C.goldMid} strokeWidth={0.3} opacity={0.10} />
      </Svg>
    </View>
  )
}

// ── Page footer ───────────────────────────────────────────────────────────────
function PageFooter() {
  return (
    <View style={{ position: 'absolute', bottom: 14, left: 32, right: 32 }}>
      <View style={{ height: 0.75, backgroundColor: C.goldMid, opacity: 0.6, marginBottom: 5 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 7, color: C.grayMid, letterSpacing: 0.3 }}>www.mahatathastu.com</Text>
        <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 1 }}>MAHATATHASTU</Text>
        <Text style={{ fontSize: 7, color: C.grayMid, letterSpacing: 0.3 }}>9858784784</Text>
      </View>
    </View>
  )
}

// ── Chapter header — wax seal style ──────────────────────────────────────────
function ChapterHeader({ number, title, sanskrit }: { number: string; title: string; sanskrit?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ height: 3, backgroundColor: C.saffron }} />
      <View style={{ backgroundColor: C.navy, padding: '12pt 16pt', flexDirection: 'row', alignItems: 'center' }}>
        {/* Wax seal circle */}
        <View style={{ marginRight: 14, alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer glow ring */}
          <View style={{ position: 'absolute', width: 46, height: 46, borderRadius: 23, border: `1pt solid ${C.saffron}`, opacity: 0.3 }} />
          {/* Main seal */}
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: C.saffron,
            border: `1.5pt solid ${C.goldLight}`,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Inner dark ring for depth */}
            <View style={{ position: 'absolute', width: 33, height: 33, borderRadius: 17, backgroundColor: C.saffronDark, opacity: 0.35 }} />
            <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white }}>{number}</Text>
          </View>
        </View>
        {/* Title block */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 0.8 }}>{title}</Text>
          {sanskrit ? <Text style={{ fontSize: 8.5, color: C.goldLight, marginTop: 3, letterSpacing: 1, fontStyle: 'italic' }}>{sanskrit}</Text> : null}
        </View>
        {/* Gold OM */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, color: C.gold, fontFamily: 'Helvetica-Bold', opacity: 0.85 }}>OM</Text>
        </View>
      </View>
      <View style={{ height: 2, backgroundColor: C.gold }} />
    </View>
  )
}

// ── Title header (non-chapter pages) ─────────────────────────────────────────
function TitleHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ height: 3, backgroundColor: C.gold }} />
      <View style={{ backgroundColor: C.navy, padding: '11pt 16pt', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.5 }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 8.5, color: C.goldLight, marginTop: 3, letterSpacing: 1, fontStyle: 'italic' }}>{subtitle}</Text> : null}
      </View>
      <View style={{ height: 2, backgroundColor: C.gold }} />
    </View>
  )
}

// ── InfoGrid ──────────────────────────────────────────────────────────────────
function InfoGrid({ items, cols = 4 }: { items: { label: string; value?: any }[]; cols?: number }) {
  const pct = cols === 4 ? '23%' : cols === 3 ? '31%' : '48%'
  const filled = items.filter(i => i.value != null && i.value !== '')
  if (!filled.length) return null
  return (
    <View style={[styles.row, { flexWrap: 'wrap', marginBottom: 8 }]}>
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
function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return null
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {/* Saffron triangle bullet (from HTML) */}
          <Svg width={8} height={9} viewBox="0 0 24 24" style={{ marginTop: 2, marginRight: 7, flexShrink: 0 }}>
            <Path d="M12 2L22 20H2L12 2Z" fill={C.saffron} />
          </Svg>
          <Text style={[styles.bullet, { flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

// ── TagRow ────────────────────────────────────────────────────────────────────
function TagRow({ items }: { items: string[] }) {
  if (!items?.length) return null
  const arr = Array.isArray(items) ? items : [items]
  return (
    <View style={styles.tagRow}>
      {arr.map((t, i) => (
        <View key={i} style={styles.tag}>
          <Text style={{ fontSize: 7.5, color: C.navy }}>{t}</Text>
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

// ── SectionLabel ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <View style={{ marginBottom: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        <View style={{ width: 4, height: 16, backgroundColor: C.saffron, borderRadius: 1, marginRight: 9 }} />
        <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 0.3 }}>{children}</Text>
      </View>
      <View style={{ height: 0.75, backgroundColor: C.goldPale }} />
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
    <Page size="A4" style={{ backgroundColor: C.navyDark, fontFamily: 'Helvetica', flexDirection: 'column' }}>

      {/* ── NAVY HEADER (top ~38%) ── */}
      <View style={{ backgroundColor: C.navyDark, paddingTop: 18, paddingBottom: 22, paddingHorizontal: 44, alignItems: 'center', position: 'relative' }}>
        {/* Watermark circles behind everything */}
        <NavyWatermarkCircles w={507} h={290} />

        {/* Sanskrit invocation */}
        <Text style={{ fontSize: 7.5, color: C.crimson, letterSpacing: 2, marginBottom: 16, zIndex: 1 }}>
          SHREE MATRA NAMAH  ·  OM MAHAGANPATAYE NAMAH
        </Text>

        {/* Our Sudarshan Chakra in circular frame with glow */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 14, zIndex: 1 }}>
          {/* Outer glow ring */}
          <View style={{ position: 'absolute', width: 136, height: 136, borderRadius: 68, border: `1pt solid ${C.gold}`, opacity: 0.25 }} />
          {/* Main circular frame */}
          <View style={{
            width: 124, height: 124, borderRadius: 62,
            border: `2pt solid ${C.gold}`,
            backgroundColor: C.navyDark,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <SudarshanChakra size={110} />
          </View>
        </View>

        {/* Brand name — MAHATATHASTU as one word */}
        <View style={{ alignItems: 'center', zIndex: 1 }}>
          <View style={{ height: 1, backgroundColor: C.gold, width: 220, marginBottom: 10, opacity: 0.8 }} />
          <Text style={{ fontSize: 38, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 6 }}>
            MAHATATHASTU
          </Text>
          <Text style={{ fontSize: 8, color: C.saffronLight, letterSpacing: 2.5, marginTop: 8 }}>
            DECODE YOUR LIFE.  ·  DESIGN YOUR FUTURE.
          </Text>
          <View style={{ height: 1, backgroundColor: C.gold, width: 220, marginTop: 10, opacity: 0.8 }} />
        </View>
      </View>

      {/* ── GOLD BAND ── */}
      <View style={{ height: 4, backgroundColor: C.gold, shadowColor: '#000', shadowOpacity: 0.3 }} />

      {/* ── PARCHMENT BODY (middle ~43%) ── */}
      <View style={{ flex: 1, backgroundColor: C.parchment, padding: 28, alignItems: 'center', position: 'relative' }}>

        {/* Subtle gold diamond watermark pattern */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.04 }}>
          <Svg width={535} height={360} viewBox="0 0 535 360">
            {Array.from({ length: 6 }, (_, row) =>
              Array.from({ length: 7 }, (_, col) => (
                <Path key={`${row}-${col}`}
                  d={`M ${col * 80 + 40},${row * 60 + 12} L ${col * 80 + 52},${row * 60 + 30} L ${col * 80 + 40},${row * 60 + 48} L ${col * 80 + 28},${row * 60 + 30} Z`}
                  fill={C.goldMid}
                />
              ))
            )}
          </Svg>
        </View>

        {/* Outer dashed gold frame */}
        <View style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, border: `1.5pt solid ${C.gold}` }} />
        <View style={{ position: 'absolute', top: 13, left: 13, right: 13, bottom: 13, border: `0.5pt dashed ${C.goldMid}`, opacity: 0.6 }} />

        {/* Corner lotus ornaments */}
        <View style={{ position: 'absolute', top: 14, left: 14 }}><CornerLotus size={28} /></View>
        <View style={{ position: 'absolute', top: 14, right: 14, transform: 'rotate(90deg)' }}>
          {/* top-right: flip horizontally */}
          <Svg width={28} height={28} viewBox="0 0 40 40">
            <Circle cx={36} cy={4} r={2.5} fill={C.gold} />
            <Path d="M 34,4 Q 23,1 13,4 Q 23,7 34,4 Z" fill={C.gold} opacity={0.8} />
            <Path d="M 36,6 Q 39,17 36,27 Q 33,17 36,6 Z" fill={C.gold} opacity={0.8} />
            <Circle cx={31} cy={9}  r={1.8} fill={C.gold} opacity={0.55} />
            <Circle cx={25} cy={15} r={1.2} fill={C.gold} opacity={0.4}  />
          </Svg>
        </View>
        <View style={{ position: 'absolute', bottom: 14, left: 14 }}>
          <Svg width={28} height={28} viewBox="0 0 40 40">
            <Circle cx={4} cy={36} r={2.5} fill={C.gold} />
            <Path d="M 6,36 Q 17,39 27,36 Q 17,33 6,36 Z" fill={C.gold} opacity={0.8} />
            <Path d="M 4,34 Q 1,23 4,13 Q 7,23 4,34 Z" fill={C.gold} opacity={0.8} />
            <Circle cx={9}  cy={31} r={1.8} fill={C.gold} opacity={0.55} />
            <Circle cx={15} cy={25} r={1.2} fill={C.gold} opacity={0.4}  />
          </Svg>
        </View>
        <View style={{ position: 'absolute', bottom: 14, right: 14 }}>
          <Svg width={28} height={28} viewBox="0 0 40 40">
            <Circle cx={36} cy={36} r={2.5} fill={C.gold} />
            <Path d="M 34,36 Q 23,39 13,36 Q 23,33 34,36 Z" fill={C.gold} opacity={0.8} />
            <Path d="M 36,34 Q 39,23 36,13 Q 33,23 36,34 Z" fill={C.gold} opacity={0.8} />
            <Circle cx={31} cy={31} r={1.8} fill={C.gold} opacity={0.55} />
            <Circle cx={25} cy={25} r={1.2} fill={C.gold} opacity={0.4}  />
          </Svg>
        </View>

        {/* Content — centered vertically */}
        <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 20 }}>
          {/* Report type badge */}
          <View style={{
            border: `1.5pt solid ${C.gold}`,
            backgroundColor: 'transparent',
            paddingVertical: 7, paddingHorizontal: 28,
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.gold, letterSpacing: 3, textAlign: 'center' }}>
              {title.toUpperCase()}
            </Text>
          </View>

          {/* Person name */}
          {member?.full_name ? (
            <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: C.navy, textAlign: 'center', marginBottom: 8, letterSpacing: 2 }}>
              {member.full_name.toUpperCase()}
            </Text>
          ) : null}

          {/* Birth details */}
          <View style={{ alignItems: 'center', marginBottom: 4 }}>
            {dob ? <Text style={{ fontSize: 9.5, color: C.charcoal, textAlign: 'center', letterSpacing: 1, lineHeight: 1.7 }}>{dob}</Text> : null}
            {member?.place_of_birth ? (
              <Text style={{ fontSize: 9.5, color: C.charcoal, textAlign: 'center', letterSpacing: 1, lineHeight: 1.7 }}>{member.place_of_birth}</Text>
            ) : null}
          </View>
          <Text style={{ fontSize: 8, color: C.gray, textAlign: 'center', letterSpacing: 0.5, marginTop: 2 }}>Generated: {gen}</Text>

          <OrnamentDivider mt={16} mb={16} width={200} />

          {/* Rishi lineage (in crimson italic like the HTML) */}
          <Text style={{ fontSize: 8, color: C.crimson, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.8 }}>
            Lineage of Maharishi Bhrigu · Tradition of Vashistha
          </Text>
          <Text style={{ fontSize: 7.5, color: C.crimson, textAlign: 'center', lineHeight: 1.8 }}>
            Surya · Pitamaha · Vyasa · Vashishtha · Atri · Parashara · Kashyapa
          </Text>

          <OrnamentDivider mt={14} mb={14} width={160} color={C.goldPale} />

          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 2, textAlign: 'center' }}>
            AN INITIATIVE OF ANUSHTHAAN INDIA
          </Text>
          <Text style={{ fontSize: 7.5, color: C.gray, marginTop: 3, textAlign: 'center' }}>
            GYANAMPEETHAM · "Educating Society with Wisdom for a Better Life"
          </Text>
        </View>
      </View>

      {/* ── GOLD BAND ── */}
      <View style={{ height: 3, backgroundColor: C.gold }} />

      {/* ── NAVY FOOTER (bottom ~19%) ── */}
      <View style={{ backgroundColor: C.navyDark, paddingVertical: 14, paddingHorizontal: 44, alignItems: 'center', position: 'relative' }}>
        <NavyWatermarkCircles w={507} h={80} />
        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 3, marginBottom: 6, zIndex: 1 }}>
          MAHATATHASTU
        </Text>
        <Text style={{ fontSize: 8, color: C.gold, letterSpacing: 1.5, zIndex: 1 }}>
          www.mahatathastu.com  ·  9858784784
        </Text>
      </View>

    </Page>
  )
}

// ── GUIDANCE PAGE ─────────────────────────────────────────────────────────────
function GuidancePage() {
  const guidance = [
    { title: 'Faith is the Foundation', body: 'Follow all remedies with full dedication, discipline, and unwavering faith. Faith and devotion are the strongest mediums through which divine blessings flow into one\'s life.', accent: C.saffron },
    { title: '90-Day Minimum Practice', body: 'For purification and correction of karmic energies, practice the remedies continuously for a minimum of 90 days without interruption.', accent: C.gold },
    { title: 'Daily Consistency', body: 'Performing remedies at the same time each day (especially during sunrise or the prescribed muhurta) amplifies their effectiveness significantly.', accent: C.navyMid },
    { title: 'Sattvic Lifestyle', body: 'During the remedy period, maintain a sattvic diet, avoid intoxicants, and practice charitable acts. This supports the energetic work of the remedies.', accent: C.emerald },
  ]
  return (
    <Page size="A4" style={styles.page}>
      <PageBorder />
      <PageWatermark />
      <TitleHeader title="Divine Guidance" subtitle="Shree Matra Namah" />

      <Text style={[styles.body, { marginBottom: 12, lineHeight: 1.7 }]}>
        This Tathastu report has been prepared by the MahaTathastu Team based on your details. It integrates
        Vedic Astrology, Numerology, Ayurveda, Chakra Science, Yantra, Mantra, and Vedic Psychology
        into a comprehensive guidance system crafted exclusively for your journey.
      </Text>

      {guidance.map((item) => (
        <View key={item.title} style={[styles.highlight, { borderLeftColor: item.accent, marginBottom: 9 }]}>
          <Text style={[styles.h3, { color: C.navy, marginBottom: 3 }]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}

      <OrnamentDivider mt={14} mb={14} />

      <View style={[styles.highlightGold, { alignItems: 'center' }]}>
        <Text style={{ fontSize: 14, color: C.crimson, textAlign: 'center', marginBottom: 5, fontFamily: 'Helvetica-Bold', letterSpacing: 1 }}>
          Om Tat Sat
        </Text>
        <Text style={[styles.body, { textAlign: 'center' }]}>
          May this report guide you on your path to self-knowledge and dharmic living.
        </Text>
        <Text style={[styles.bodySmall, { textAlign: 'center', color: C.navy, marginTop: 5, fontFamily: 'Helvetica-Bold' }]}>
          — MahaTathastu · Tathastu Report System
        </Text>
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

  return (
    <Page size="A4" style={styles.page} wrap>
      <PageBorder />
      <PageWatermark />
      <ChapterHeader number={number} title="Kundli & Birth Chart" sanskrit="ग्रह ज्योतिष — Graha Jyotisha" />

      {canvasImg ? (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Image src={canvasImg} style={{ width: 185, height: 185 }} />
        </View>
      ) : null}

      <InfoGrid items={[
        { label: 'Ascendant (Lagna)', value: k.ascendant },
        { label: 'Moon Sign (Rashi)', value: k.moonSign },
        { label: 'Sun Sign', value: k.sunSign },
        { label: 'Nakshatra', value: k.nakshatra },
        { label: 'Nakshatra Pada', value: k.nakshatraPada ? `Pada ${k.nakshatraPada}` : undefined },
        { label: 'Current Dasha', value: k.currentDasha },
        { label: 'Antardasha', value: k.currentAntardasha },
        { label: 'Dasha Lord', value: k.dashaLord },
      ]} />

      {k.planets?.length > 0 ? (
        <View>
          <SectionLabel>Planetary Positions</SectionLabel>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {['Planet', 'Sign', 'Degree', 'House', 'Nakshatra'].map((h) => (
                <Text key={h} style={[styles.th, { flex: 1 }]}>{h}</Text>
              ))}
            </View>
            {k.planets.map((p: any, i: number) => (
              <View key={p.name} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tdBold, { flex: 1 }]}>{p.name}{p.retrograde ? ' ®' : ''}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.rashi}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.degree != null ? `${Number(p.degree).toFixed(1)}°` : '-'}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.house}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{p.nakshatra || '-'}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {analysis?.yogas?.length > 0 ? (
        <View style={{ marginTop: 10 }}>
          <SectionLabel>Yogas in Your Chart</SectionLabel>
          {analysis.yogas.slice(0, 6).map((y: any) => (
            <View key={y.name} style={[styles.highlight, { marginBottom: 4 }]}>
              <Text style={[styles.h3, { marginBottom: 2 }]}>{y.name}</Text>
              {y.description ? <Text style={styles.bodySmall}>{y.description}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}

      {analysis ? (
        <View style={{ marginTop: 8 }}>
          <InfoGrid cols={2} items={[
            { label: 'Career Outlook', value: analysis.career },
            { label: 'Relationships', value: analysis.marriage },
            { label: 'Health Focus', value: analysis.health },
            { label: 'Finance', value: analysis.finance },
          ]} />
          {analysis.currentPhase ? <HighlightBox label="Current Dasha Phase" text={analysis.currentPhase} accent={C.navyMid} /> : null}
          {analysis.nakshatraProfile ? <HighlightBox label="Nakshatra Profile" text={analysis.nakshatraProfile} /> : null}
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
      <ChapterHeader number={number} title="Numerology Analysis" sanskrit="अंक शास्त्र — Anka Shastra" />

      {canvasImg ? (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Image src={canvasImg} style={{ width: 145, height: 145 }} />
        </View>
      ) : null}

      <InfoGrid items={[
        { label: 'Life Path', value: n.lifePathNumber },
        { label: 'Destiny', value: n.destinyNumber },
        { label: 'Soul Urge', value: n.soulUrgeNumber },
        { label: 'Personality', value: n.personalityNumber },
        { label: 'Birthday', value: n.birthdayNumber },
        { label: 'Personal Year', value: n.personalYearNumber },
        { label: 'Maturity', value: n.maturityNumber },
        { label: 'Chaldean Name', value: n.chaldeanNameNumber },
      ]} />

      {n.interpretation?.lifePath ? (
        <HighlightBox
          label={`Life Path ${n.lifePathNumber}${n.interpretation.lifePathTitle ? ` — ${n.interpretation.lifePathTitle}` : ''}`}
          text={n.interpretation.lifePath}
          accent="#7c3aed"
        />
      ) : null}
      {n.interpretation?.destiny ? <HighlightBox label={`Destiny Number ${n.destinyNumber}`} text={n.interpretation.destiny} /> : null}
      {n.interpretation?.soulUrge ? <HighlightBox label={`Soul Urge ${n.soulUrgeNumber}`} text={n.interpretation.soulUrge} /> : null}
      {n.interpretation?.personalYear ? (
        <HighlightBox label={`Personal Year ${n.personalYearNumber}`} text={n.interpretation.personalYear} accent={C.saffron} />
      ) : null}

      {(n.lifePath?.strengths?.length || n.lifePath?.challenges?.length || n.lifePath?.careers?.length) ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Life Path Insights</SectionLabel>
          <View style={styles.row}>
            {n.lifePath?.strengths?.length ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.emerald, marginBottom: 4 }]}>Strengths</Text>
                <BulletList items={n.lifePath.strengths.slice(0, 5)} />
              </View>
            ) : null}
            {n.lifePath?.challenges?.length ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.saffron, marginBottom: 4 }]}>Challenges</Text>
                <BulletList items={n.lifePath.challenges.slice(0, 5)} />
              </View>
            ) : null}
          </View>
          {n.lifePath?.careers?.length ? (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.label, { marginBottom: 4 }]}>Ideal Careers</Text>
              <TagRow items={n.lifePath.careers.slice(0, 8)} />
            </View>
          ) : null}
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
      <ChapterHeader number={number} title="Shakti Chakra Analysis" sanskrit="चक्र विज्ञान — Chakra Vigyan" />

      {overallBalance != null ? (
        <View style={[styles.cardBlue, { flexDirection: 'row', alignItems: 'center', marginBottom: 10 }]}>
          <Text style={[styles.h3, { flex: 1, color: C.white, marginBottom: 0 }]}>Overall Balance</Text>
          <Text style={{ fontSize: 26, fontFamily: 'Helvetica-Bold', color: C.saffronLight }}>{overallBalance}%</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        {chakras.map((c: any, i: number) => (
          <View key={i} style={{ flex: 1, backgroundColor: CHAKRA_COLORS[i] || '#9ca3af' }} />
        ))}
      </View>

      {chakras.map((c: any, i: number) => {
        const color = CHAKRA_COLORS[i] || '#9ca3af'
        const lvl = c.level ?? 50
        return (
          <View key={i} style={{ marginBottom: 9, borderLeft: `4pt solid ${color}`, paddingLeft: 9, paddingTop: 5, paddingBottom: 5, backgroundColor: C.offWhite }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={[styles.h3, { flex: 1, marginBottom: 0 }]}>{c.name}{c.sanskrit ? ` — ${c.sanskrit}` : ''}</Text>
              <Text style={[styles.label, { color: color, marginBottom: 0 }]}>{c.status?.toUpperCase() || ''} · {lvl}%</Text>
            </View>
            <View style={[styles.progressBg, { marginBottom: 5 }]}>
              <View style={[styles.progressFill, { width: `${lvl}%`, backgroundColor: color }]} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {c.mantras?.length ? <Text style={styles.bodySmall}>Beej: {c.mantras[0]}</Text> : null}
              {c.crystals?.length ? <Text style={styles.bodySmall}>Crystal: {c.crystals.slice(0,2).join(', ')}</Text> : null}
              {c.yoga?.length ? <Text style={styles.bodySmall}>Yoga: {c.yoga[0]}</Text> : null}
            </View>
            {c.affirmations?.length ? (
              <Text style={[styles.italic, { marginTop: 3 }]}>"{c.affirmations[0]}"</Text>
            ) : null}
          </View>
        )
      })}

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
      <ChapterHeader number={number} title="Prakriti — Ayurvedic Constitution" sanskrit="प्रकृति विज्ञान — Prakriti Vigyan" />

      <InfoGrid cols={3} items={[
        { label: 'Dominant Dosha', value: p.dominant },
        { label: 'Secondary Dosha', value: p.secondary },
        { label: 'Vata', value: p.vata != null ? `${p.vata}%` : undefined },
        { label: 'Pitta', value: p.pitta != null ? `${p.pitta}%` : undefined },
        { label: 'Kapha', value: p.kapha != null ? `${p.kapha}%` : undefined },
      ]} />

      {[
        { label: 'Vata', value: p.vata, color: '#0284c7' },
        { label: 'Pitta', value: p.pitta, color: C.saffron },
        { label: 'Kapha', value: p.kapha, color: C.emerald },
      ].filter(d => d.value != null).map((dosha) => (
        <View key={dosha.label} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
            <Text style={[styles.label, { color: dosha.color, marginBottom: 0 }]}>{dosha.label}</Text>
            <Text style={[styles.label, { marginBottom: 0 }]}>{dosha.value}%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${dosha.value}%`, backgroundColor: dosha.color }]} />
          </View>
        </View>
      ))}

      {p.summary ? <HighlightBox text={p.summary} accent={C.saffron} /> : null}

      {p.diet?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Dietary Recommendations</SectionLabel>
          <BulletList items={p.diet.slice(0, 8)} />
        </View>
      ) : null}
      {p.lifestyle?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Lifestyle Practices</SectionLabel>
          <BulletList items={p.lifestyle.slice(0, 6)} />
        </View>
      ) : null}
      {p.avoid?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Items to Avoid</SectionLabel>
          <TagRow items={p.avoid.slice(0, 10)} />
        </View>
      ) : null}

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
      <ChapterHeader number={number} title="Yantra & Colour Therapy" sanskrit="यन्त्र शास्त्र — Yantra Shastra" />

      <View style={styles.row}>
        <View style={[styles.highlight, { flex: 1, borderLeftColor: C.saffron }]}>
          <Text style={[styles.label, { color: C.saffron }]}>Personal Yantra</Text>
          <Text style={styles.value}>{y.primaryYantra?.name}</Text>
          {y.primaryYantra?.deity ? <Text style={styles.bodySmall}>Deity: {y.primaryYantra.deity}</Text> : null}
          {y.primaryYantra?.mantra ? <Text style={[styles.italic, { marginTop: 3 }]}>{y.primaryYantra.mantra}</Text> : null}
        </View>
        {y.gemstone?.primary ? (
          <View style={[styles.highlight, { flex: 1, borderLeftColor: '#f43f5e' }]}>
            <Text style={[styles.label, { color: '#f43f5e' }]}>Power Gemstone</Text>
            <Text style={styles.value}>{y.gemstone.primary}</Text>
            {y.gemstone.finger ? <Text style={styles.bodySmall}>Wear on {y.gemstone.finger} finger</Text> : null}
            {y.gemstone.metal ? <Text style={styles.bodySmall}>Metal: {y.gemstone.metal}</Text> : null}
          </View>
        ) : null}
      </View>

      {y.primaryYantra?.benefits?.length ? (
        <View style={{ marginTop: 6 }}>
          <Text style={styles.label}>Yantra Benefits</Text>
          <TagRow items={y.primaryYantra.benefits} />
        </View>
      ) : null}
      {y.primaryYantra?.installation ? (
        <View style={{ marginTop: 8 }}>
          <HighlightBox label="How to Install" text={y.primaryYantra.installation} />
        </View>
      ) : null}

      {y.colourTherapy ? (
        <View style={{ marginTop: 10 }}>
          <SectionLabel>Colour Therapy</SectionLabel>
          <View style={styles.row}>
            {y.colourTherapy.power?.length ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Power Colours</Text>
                <TagRow items={Array.isArray(y.colourTherapy.power) ? y.colourTherapy.power : [y.colourTherapy.power]} />
              </View>
            ) : null}
            {y.colourTherapy.forHealth?.length ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.emerald }]}>For Health</Text>
                <TagRow items={Array.isArray(y.colourTherapy.forHealth) ? y.colourTherapy.forHealth : [y.colourTherapy.forHealth]} />
              </View>
            ) : null}
            {y.colourTherapy.forWealth?.length ? (
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: C.amber }]}>For Wealth</Text>
                <TagRow items={Array.isArray(y.colourTherapy.forWealth) ? y.colourTherapy.forWealth : [y.colourTherapy.forWealth]} />
              </View>
            ) : null}
          </View>
          {y.colourTherapy.avoid?.length ? (
            <View style={{ marginTop: 4 }}>
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
      <ChapterHeader number={number} title="Mantra Guidance" sanskrit="मन्त्र साधना — Mantra Sadhana" />

      {ch ? (
        <View>
          <SectionLabel>Chanting Practice</SectionLabel>
          <InfoGrid cols={2} items={[
            { label: 'Beej Mantra', value: ch.beejMantra },
            { label: 'Main Mantra', value: ch.mainMantra },
            { label: 'Daily Repetitions', value: ch.repetitions || ch.japa },
            { label: 'Best Time', value: ch.bestTime || ch.timing },
            { label: 'Duration', value: ch.duration },
            { label: 'Mala', value: ch.mala },
          ]} />
          {ch.instructions ? <HighlightBox label="Instructions" text={ch.instructions} /> : null}
          {ch.benefits?.length ? (
            <View style={{ marginTop: 6 }}>
              <Text style={[styles.label, { marginBottom: 4 }]}>Benefits</Text>
              <BulletList items={ch.benefits.slice(0, 6)} />
            </View>
          ) : null}
        </View>
      ) : null}

      {wr ? (
        <View style={{ marginTop: ch ? 12 : 0 }}>
          <SectionLabel>Likhit Japa (Writing Practice)</SectionLabel>
          <InfoGrid cols={2} items={[
            { label: 'Mantra to Write', value: wr.mantra || wr.likhitMantra },
            { label: 'Daily Count', value: wr.dailyCount || wr.count },
            { label: 'Best Time', value: wr.bestTime || wr.timing },
            { label: 'Pen Color', value: wr.penColor },
            { label: 'Paper Color', value: wr.paperColor },
            { label: 'Duration', value: wr.duration },
          ]} />
          {wr.instructions ? <HighlightBox label="Writing Instructions" text={wr.instructions} /> : null}
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
      <ChapterHeader number={number} title="Vedic Psychology" sanskrit="मानस विज्ञान — Manas Vigyan" />

      <View style={[styles.cardBlue, { marginBottom: 10 }]}>
        <Text style={[styles.label, { color: C.goldLight, marginBottom: 3 }]}>Moon Archetype</Text>
        <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.white }}>{ps.moonPersonalityType}</Text>
      </View>

      <InfoGrid cols={2} items={[
        { label: 'Cognitive Style', value: ps.cognitiveStyle },
        { label: 'Career Personality', value: ps.careerPersonality },
        { label: 'Relationship Style', value: ps.relationshipStyle },
        { label: 'Stress Triggers', value: ps.stressTriggers },
      ]} />

      {ps.coreTrait ? <HighlightBox label="Core Trait" text={ps.coreTrait} /> : null}
      {ps.emotionalPatterns ? <HighlightBox label="Emotional Patterns" text={ps.emotionalPatterns} /> : null}
      {ps.growthEdge ? <HighlightBox label="Growth Edge" text={ps.growthEdge} accent={C.saffron} /> : null}

      {ps.strengths?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Strengths</SectionLabel>
          <BulletList items={ps.strengths.slice(0, 6)} />
        </View>
      ) : null}
      {ps.shadowWork?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Shadow Work Themes</SectionLabel>
          <BulletList items={ps.shadowWork.slice(0, 5)} />
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
      <ChapterHeader number={number} title="DMIT Intelligence Profile" sanskrit="बुद्धिमत्ता प्रोफाइल — Buddhimatta" />

      {canvasImg ? (
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Image src={canvasImg} style={{ width: 135, height: 135 }} />
        </View>
      ) : null}

      {dmit.learningStyle ? <HighlightBox label="Learning Style" text={dmit.learningStyle} /> : null}

      {dmit.allIntelligences?.length ? (
        <View style={{ marginTop: 8 }}>
          <SectionLabel>Intelligence Profile</SectionLabel>
          {dmit.allIntelligences.map((intel: any, i: number) => (
            <View key={i} style={{ marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={[styles.label, { marginBottom: 0 }]}>{intel.type}</Text>
                <Text style={[styles.label, { marginBottom: 0, color: intel.strength === 'Strong' ? C.emerald : C.amber }]}>
                  {intel.strength} · {intel.score}%
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, {
                  width: `${intel.score || 0}%`,
                  backgroundColor: intel.strength === 'Strong' ? C.emerald : intel.strength === 'Moderate' ? C.amber : C.grayMid,
                }]} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {dmit.recommendedStreams?.length ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.label, { marginBottom: 5 }]}>Recommended Academic Streams</Text>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {dmit.recommendedStreams.slice(0, 6).map((s: string, i: number) => (
              <View key={i} style={styles.tagNavy}>
                <Text style={{ fontSize: 7.5, color: C.white }}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
      {dmit.careerAlignment?.length ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Career Alignment</Text>
          <TagRow items={dmit.careerAlignment.slice(0, 10)} />
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
      <ChapterHeader number={number} title="Colour Therapy" sanskrit="रंग चिकित्सा — Ranga Chikitsa" />

      {healingCats.length ? (
        <View>
          <SectionLabel>Healing Colours</SectionLabel>
          <View style={[styles.row, { flexWrap: 'wrap' }]}>
            {healingCats.map((cat) => {
              const cols: string[] = Array.isArray(cat.colors) ? cat.colors : [cat.colors]
              return (
                <View key={cat.label} style={[styles.card, { width: '47%', marginBottom: 6 }]}>
                  <Text style={[styles.label, { color: cat.accent }]}>{cat.label}</Text>
                  <TagRow items={cols.slice(0, 4)} />
                </View>
              )
            })}
          </View>
        </View>
      ) : null}

      {ct.chromotherapy ? (
        <View style={{ marginTop: 10 }}>
          <SectionLabel>Chromotherapy</SectionLabel>
          <HighlightBox label={`Primary: ${ct.chromotherapy.primaryColor || ''}`} text={[
            ct.chromotherapy.sessions,
            ct.chromotherapy.duration ? `Duration: ${ct.chromotherapy.duration}` : '',
            ct.chromotherapy.waterSolarization,
          ].filter(Boolean).join('\n')} />
        </View>
      ) : null}

      {ct.colorMeditation ? (
        <HighlightBox label="Colour Meditation" text={ct.colorMeditation} accent="#8b5cf6" />
      ) : null}

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
      <ChapterHeader number={number} title="Annual Prediction" sanskrit="वार्षिक भविष्यवाणी — Varshik Bhavisyavani" />

      {ap.overallTheme ? (
        <View style={[styles.cardBlue, { marginBottom: 12 }]}>
          <Text style={[styles.label, { color: C.goldLight, marginBottom: 4 }]}>Annual Theme</Text>
          <Text style={[styles.body, { color: C.white }]}>{ap.overallTheme}</Text>
        </View>
      ) : null}

      {ap.quarters?.length ? (
        <View>
          <SectionLabel>Quarterly Guidance</SectionLabel>
          {ap.quarters.map((q: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', borderBottom: `0.5pt solid ${C.grayLight}`, paddingVertical: 7 }}>
              <View style={{ width: 4, backgroundColor: C.saffron, marginRight: 10, borderRadius: 2 }} />
              <Text style={[styles.value, { width: 90, flexShrink: 0, color: C.saffron, fontSize: 9 }]}>{q.period}</Text>
              <View style={{ flex: 1 }}>
                {q.theme ? <Text style={[styles.label, { marginBottom: 2 }]}>{q.theme}</Text> : null}
                {q.guidance ? <Text style={styles.body}>{q.guidance}</Text> : null}
                {q.focus ? <Text style={[styles.bodySmall, { color: C.saffron, marginTop: 2 }]}>Focus: {q.focus}</Text> : null}
              </View>
            </View>
          ))}
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

  const renderRemedyGroup = (label: string, items: any) => {
    if (!items) return null
    const arr = Array.isArray(items) ? items : [items]
    if (!arr.length) return null
    return (
      <View style={{ marginBottom: 10 }}>
        <Text style={[styles.h3, { color: C.navy, marginBottom: 5 }]}>{label}</Text>
        {arr.map((item: any, i: number) => {
          if (typeof item === 'string') {
            return (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4 }}>
                <Svg width={8} height={9} viewBox="0 0 24 24" style={{ marginTop: 2, marginRight: 7, flexShrink: 0 }}>
                  <Path d="M12 2L22 20H2L12 2Z" fill={C.saffron} />
                </Svg>
                <Text style={[styles.bullet, { flex: 1 }]}>{item}</Text>
              </View>
            )
          }
          return (
            <View key={i} style={[styles.card, { marginBottom: 4 }]}>
              {item.name || item.deity || item.planet ? (
                <Text style={[styles.label, { marginBottom: 2, color: C.saffron }]}>{item.name || item.deity || item.planet}</Text>
              ) : null}
              {item.description || item.remedy || item.action ? (
                <Text style={styles.body}>{item.description || item.remedy || item.action}</Text>
              ) : null}
              {item.mantra ? <Text style={styles.italic}>Mantra: {item.mantra}</Text> : null}
              {item.day ? <Text style={styles.bodySmall}>Day: {item.day}</Text> : null}
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
      <ChapterHeader number={number} title="Remedies & Upaya" sanskrit="उपाय शास्त्र — Upaya Shastra" />

      {renderRemedyGroup('Planetary Remedies', r.planetary || r.planetaryRemedies)}
      {renderRemedyGroup('Mantra Remedies', r.mantra || r.mantraRemedies)}
      {renderRemedyGroup('Gemstone Recommendations', r.gemstones || r.gemstoneRemedies)}
      {renderRemedyGroup('Charity & Donations', r.charity || r.donations)}
      {renderRemedyGroup('Fasting & Rituals', r.fasting || r.rituals)}
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
      <ChapterHeader number={number} title="Astro Vastu" sanskrit="ज्योतिष वास्तु — Jyotisha Vastu" />

      <InfoGrid cols={2} items={[
        { label: 'Home Direction', value: v.homeDirection },
        { label: 'Favorable Direction', value: v.favorableDirection },
        { label: 'Avoid Direction', value: v.avoidDirection },
        { label: 'Entry Direction', value: v.entryDirection },
      ]} />

      {v.summary ? <HighlightBox label="Vastu Summary" text={v.summary} /> : null}

      {v.recommendations?.length ? (
        <View style={{ marginTop: 10 }}>
          <SectionLabel>Vastu Recommendations</SectionLabel>
          <BulletList items={v.recommendations.slice(0, 10)} />
        </View>
      ) : null}
      {v.remedies?.length ? (
        <View style={{ marginTop: 10 }}>
          <SectionLabel>Vastu Remedies</SectionLabel>
          <BulletList items={v.remedies.slice(0, 8)} />
        </View>
      ) : null}

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
    { title: 'Astronomical Accuracy', body: 'Planetary positions are calculated using the NASA-grade astronomy-engine library with Lahiri ayanamsa (the official standard of the Government of India).' },
    { title: 'Free Will & Destiny', body: 'Vedic astrology recognizes that the birth chart shows tendencies and potential — not fixed destiny. Human free will, conscious effort, and spiritual practice can always influence outcomes.' },
  ]

  return (
    <Page size="A4" style={styles.page}>
      <PageBorder />
      <PageWatermark />
      <TitleHeader title="Disclaimer & Guidance Notes" subtitle="Appendix" />

      {items.map((item) => (
        <View key={item.title} style={[styles.card, { marginBottom: 7 }]}>
          <Text style={[styles.h3, { color: C.navy, marginBottom: 3 }]}>{item.title}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}

      <OrnamentDivider mt={14} mb={12} />

      <View style={[styles.highlightGold, { alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: C.crimson, textAlign: 'center', marginBottom: 6, fontFamily: 'Helvetica-Bold' }}>
          Om Tat Sat
        </Text>
        <Text style={[styles.body, { textAlign: 'center' }]}>
          May this report guide you on your path to self-knowledge and dharmic living.{'\n'}
          Follow the remedies with faith, patience and devotion for 90 days minimum.
        </Text>
        <Text style={[styles.bodySmall, { textAlign: 'center', color: C.navy, marginTop: 6, fontFamily: 'Helvetica-Bold' }]}>
          — MahaTathastu · Tathastu Report System
        </Text>
        <Text style={[styles.bodyMuted, { textAlign: 'center', marginTop: 3 }]}>
          Contents are copyright protected and owned by MahaTathastu
        </Text>
      </View>

      <PageFooter />
    </Page>
  )
}

// ── METADATA ──────────────────────────────────────────────────────────────────
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

// ── ROOT DOCUMENT ─────────────────────────────────────────────────────────────
export default function ReportPDF({ report, canvases = {} }: ReportPDFProps) {
  const d = report.report_content || {}
  const member = report.family_members
  const rt = report.report_type
  const isFull = rt === 'full_tathastu'
  const title = REPORT_TITLES[rt] || 'Tathastu Report'

  type Section = { id: string; show: boolean; node: React.ReactElement | null }

  const sections: Section[] = [
    {
      id: 'astrology',
      show: (rt === 'astrology' || isFull) && !!(d.kundli?.ascendant),
      node: <KundliPages data={d} canvasImg={canvases.astrology} number="I" />,
    },
    {
      id: 'numerology',
      show: (rt === 'numerology' || isFull) && !!(d.numerology?.lifePathNumber),
      node: <NumerologyPages data={d} canvasImg={canvases.numerology} number="I" />,
    },
    {
      id: 'shakti_chakra',
      show: (rt === 'shakti_chakra' || isFull) && !!(d.chakras?.length || d.chakra?.length),
      node: <ChakraPages data={d} number="I" />,
    },
    {
      id: 'prakriti',
      show: (rt === 'prakriti' || isFull) && !!(d.prakriti?.dominant),
      node: <PrakritiPages data={d} number="I" />,
    },
    {
      id: 'yantra_colour',
      show: (rt === 'yantra_colour' || isFull) && !!(d.yantra?.primaryYantra || d.yantraColour?.primaryYantra),
      node: <YantraPages data={d} number="I" />,
    },
    {
      id: 'mantra_chanting',
      show: (['mantra_chanting','mantra_writing'].includes(rt) || isFull) && !!(d.mantras?.chanting || d.mantra?.chanting || d.mantraLekhnan),
      node: <MantraPages data={d} number="I" />,
    },
    {
      id: 'psychology',
      show: (rt === 'psychology' || isFull) && !!(d.psychology?.moonPersonalityType),
      node: <PsychologyPages data={d} number="I" />,
    },
    {
      id: 'astro_vastu',
      show: (rt === 'astro_vastu' || isFull) && !!(d.vastu?.homeDirection || d.vastuAnalysis?.homeDirection),
      node: <VastuPages data={d} number="I" />,
    },
    {
      id: 'dmit',
      show: (rt === 'dmit' || isFull) && !!(d.dmit?.learningStyle),
      node: <DmitPages data={d} canvasImg={canvases.dmit} number="I" />,
    },
    {
      id: 'colour_therapy',
      show: (rt === 'colour_therapy' || isFull) && !!(d.colourTherapy?.healingColors || d.colourTherapy?.chromotherapy),
      node: <ColourTherapyPages data={d} number="I" />,
    },
    {
      id: 'annual_prediction',
      show: isFull && !!d.annualPrediction,
      node: <AnnualPredictionPages data={d} number="I" />,
    },
    {
      id: 'remedies',
      show: isFull && !!(d.remediesSummary || d.remedies),
      node: <RemediesPages data={d} number="I" />,
    },
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
