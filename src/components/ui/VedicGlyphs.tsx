/* ═══════════════════════════════════════════════════════════════════════════
   VEDIC GLYPHS
   ───────────────────────────────────────────────────────────────────────────
   Custom line-work for the concepts no general-purpose icon library has a
   truthful mark for: a yantra, a shikhara, a chakra, a dosha, a diya.

   Every glyph is drawn to the SAME spec as the Lucide set it sits beside, so
   the two read as one family:
     · 24 × 24 viewBox
     · stroke only - never fill
     · stroke-width inherited from the parent <svg> (1.75 by default)
     · round caps, round joins
     · geometry derived from the Sri Yantra: interlocking triangles, the
       lotus ring, the bindu.
   ═══════════════════════════════════════════════════════════════════════════ */

export type VedicGlyphName =
  | 'yantra'
  | 'chakra'
  | 'lotus'
  | 'diya'
  | 'kalash'
  | 'shikhara'
  | 'palm'
  | 'dosha'
  | 'mantra'
  | 'nakshatra'
  | 'bindu'
  | 'navagraha'

/* Paths are plain children; the wrapping <svg> in Icon.tsx supplies
   stroke, stroke-width, linecap and linejoin. */
export const VEDIC_GLYPHS: Record<VedicGlyphName, React.ReactNode> = {
  /* Sri Yantra core - the two interlocking triangles inside the lotus ring. */
  yantra: (
    <>
      <path d="M12 3.2 20 18H4Z" />
      <path d="M12 20.8 4 6h16Z" />
      <circle cx="12" cy="12" r="9.2" />
    </>
  ),

  /* Chakra - hub, rim and six spokes. */
  chakra: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3.8M12 17.2V21M20.8 12H17M7 12H3.2" />
      <path d="m18.2 7-2.6 1.9M8.4 15.1 5.8 17M18.2 17l-2.6-1.9M8.4 8.9 5.8 7" />
    </>
  ),

  /* Padma - eight-petal lotus seen from above. */
  lotus: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <ellipse cx="12" cy="6.2" rx="2.4" ry="3.6" />
      <ellipse cx="12" cy="17.8" rx="2.4" ry="3.6" />
      <ellipse cx="6.2" cy="12" rx="3.6" ry="2.4" />
      <ellipse cx="17.8" cy="12" rx="3.6" ry="2.4" />
    </>
  ),

  /* Diya - the oil lamp: flame over a shallow bowl. */
  diya: (
    <>
      <path d="M12 3c2.4 2.3 3.2 4.2 3.2 5.8a3.2 3.2 0 0 1-6.4 0C8.8 7.2 9.6 5.3 12 3Z" />
      <path d="M4 14.5h16c0 3.3-3.6 5.5-8 5.5s-8-2.2-8-5.5Z" />
    </>
  ),

  /* Kalash - the consecrated pot with a coconut and mango leaves. */
  kalash: (
    <>
      <path d="M12 2.6c1.4 1 1.4 2.6 0 3.6-1.4-1-1.4-2.6 0-3.6Z" />
      <path d="M7.6 7.4h8.8" />
      <path d="M8.6 7.4c-1.6 1.5-2.6 3.5-2.6 5.7 0 4 2.7 7.3 6 7.3s6-3.3 6-7.3c0-2.2-1-4.2-2.6-5.7" />
    </>
  ),

  /* Shikhara - the temple spire, stepped, with a finial. */
  shikhara: (
    <>
      <path d="M12 2.4v2.4" />
      <path d="M12 4.8 6.6 13.4h10.8L12 4.8Z" />
      <path d="M5 13.4h14v7.2H5Z" />
      <path d="M10.4 20.6v-4.2h3.2v4.2" />
    </>
  ),

  /* Dermatoglyphics - the ridge arcs of a fingerprint, for DMIT. */
  palm: (
    <>
      <path d="M4.6 15.4a7.4 7.4 0 0 1 14.8 0" />
      <path d="M7.4 15.6a4.6 4.6 0 0 1 9.2 0" />
      <path d="M10.2 15.8a1.8 1.8 0 0 1 3.6 0" />
      <path d="M6 19.6h12" />
    </>
  ),

  /* Dosha - leaf with a central spine, for Prakriti / Ayurveda. */
  dosha: (
    <>
      <path d="M12 3c4.4 2.6 5.6 8.4 0 18C6.4 11.4 7.6 5.6 12 3Z" />
      <path d="M12 6.6V19" />
    </>
  ),

  /* Mantra - sound as a travelling wave. */
  mantra: (
    <>
      <path d="M2.5 12c1.9-4.6 3.2 4.6 5.1 0s3.2 4.6 5.1 0 3.2 4.6 5.1 0" />
      <path d="M20.6 8.6v6.8" />
    </>
  ),

  /* Nakshatra - a fixed star with four rays. */
  nakshatra: (
    <>
      <path d="M12 2.6 14 9.4l6.8 2-6.8 2-2 6.8-2-6.8-6.8-2 6.8-2Z" />
    </>
  ),

  /* Bindu - the point at the centre of the yantra. */
  bindu: (
    <>
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="12" r="6.2" />
      <circle cx="12" cy="12" r="10" />
    </>
  ),

  /* Navagraha - the nine planetary bodies in orbit. */
  navagraha: (
    <>
      <circle cx="12" cy="12" r="2.6" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="10" ry="4.4" transform="rotate(120 12 12)" />
    </>
  ),
}
