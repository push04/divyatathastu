'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Calendar, Clock, Plane, Train, Compass, Landmark, ShieldAlert, Footprints } from 'lucide-react'

export interface Temple {
  id: string;
  name: string;
  local_name: string;
  deity: string;
  deity_type: string;
  categories: string[];
  city: string;
  district?: string;
  state: string;
  coordinates: { latitude: number; longitude: number };
  darshan_timings: string;
  best_time_to_visit: string;
  significance: string;
  special_events: string[];
  nearest_airport?: string;
  nearest_railway?: string;
  pilgrimage_circuits: string[];
  architecture_style?: string;
  open_year_round?: boolean;
  image_ref?: string;
  deity_description?: string;
  history_and_legend?: string;
  travel_tips?: string[];
}

interface TempleDetailModalProps {
  temple: Temple | null;
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Jyotirlinga': 'bg-orange-50 text-orange-700 border-orange-200',
  'Shakti Peetha': 'bg-pink-50 text-pink-700 border-pink-200',
  'Char Dham': 'bg-blue-50 text-blue-700 border-blue-200',
  'Char Dham (Himalayan)': 'bg-sky-50 text-sky-700 border-sky-200',
  'Char Dham (Pan-India)': 'bg-blue-50 text-blue-700 border-blue-200',
  'Divya Desam': 'bg-violet-50 text-violet-700 border-violet-200',
  'Major Pilgrimage': 'bg-amber-50 text-amber-700 border-amber-200',
  'Heritage Temple': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Panch Kedar': 'bg-teal-50 text-teal-700 border-teal-200',
  'Panch Badri': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Ashtavinayak': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Sapta Puri': 'bg-purple-50 text-purple-700 border-purple-200',
}

export default function TempleDetailModal({ temple, isOpen, onClose }: TempleDetailModalProps) {
  // Keep a ref to the last valid temple so the exit animation always has content to render.
  // Without this, when onClose sets temple=null, the content disappears instantly
  // before AnimatePresence can animate the exit — causing the "flash then vanish" bug.
  const lastTempleRef = useRef<Temple | null>(null)
  useEffect(() => {
    if (temple) {
      lastTempleRef.current = temple
    }
  }, [temple])

  // Use the current temple or the cached one so exit animation always has real content
  const displayTemple = temple ?? lastTempleRef.current

  return (
    <AnimatePresence>
      {isOpen && displayTemple && (
        <div
          key={displayTemple.id}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 48, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full sm:max-w-2xl bg-white sm:rounded-2xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] overflow-hidden z-10 border border-[var(--warm-sand)]"
          >
            {/* Header top colored bar */}
            <div className="h-2 w-full bg-gradient-to-r from-[var(--terracotta)] via-[var(--saffron)] to-[var(--terracotta)]" />

            {/* Header Section */}
            <div className="px-5 py-4 border-b border-[var(--warm-sand)]/60 flex items-start justify-between gap-4 bg-amber-50/10">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--indigo-deep)] leading-tight">
                  {displayTemple.name}
                </h2>
                {displayTemple.local_name && (
                  <p className="text-xs sm:text-sm text-[var(--saffron)] font-medium font-sans mt-0.5">
                    {displayTemple.local_name}
                  </p>
                )}
                {/* Categories */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(displayTemple.categories || []).map(cat => (
                    <span
                      key={cat}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                        CATEGORY_COLORS[cat] || 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {cat}
                    </span>
                  ))}
                  {displayTemple.architecture_style && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border border-orange-100 bg-orange-50/40 text-[var(--terracotta)]">
                      {displayTemple.architecture_style}
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-[var(--warm-sand)]/40 text-[var(--warm-charcoal)]/50 hover:text-[var(--warm-charcoal)] transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              {/* Deity Details & Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-100/50 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Landmark className="w-4 h-4 text-[var(--terracotta)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--warm-charcoal)]/50 uppercase tracking-wider font-semibold">Presiding Deity</p>
                      <p className="text-sm font-medium text-[var(--indigo-deep)]">{displayTemple.deity}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[var(--terracotta)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--warm-charcoal)]/50 uppercase tracking-wider font-semibold">Darshan Timings</p>
                      <p className="text-sm font-medium text-[var(--indigo-deep)]">{displayTemple.darshan_timings}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50/30 rounded-xl p-4 border border-amber-100/50 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[var(--terracotta)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--warm-charcoal)]/50 uppercase tracking-wider font-semibold">Location</p>
                      <p className="text-sm font-medium text-[var(--indigo-deep)]">
                        {displayTemple.city}{displayTemple.district ? `, ${displayTemple.district}` : ''}, {displayTemple.state}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Calendar className="w-4 h-4 text-[var(--terracotta)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-[var(--warm-charcoal)]/50 uppercase tracking-wider font-semibold">Best Time to Visit</p>
                      <p className="text-sm font-medium text-[var(--indigo-deep)]">{displayTemple.best_time_to_visit}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deity Description */}
              {displayTemple.deity_description && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--indigo-deep)] border-b border-[var(--warm-sand)]/60 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-[var(--terracotta)] rounded-sm" />
                    Deity &amp; Iconography
                  </h3>
                  <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed font-sans font-[350]">
                    {displayTemple.deity_description}
                  </p>
                </div>
              )}

              {/* Significance & Legend */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--indigo-deep)] border-b border-[var(--warm-sand)]/60 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-[var(--terracotta)] rounded-sm" />
                  Significance &amp; History
                </h3>
                <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed font-sans font-[350]">
                  {displayTemple.significance}
                </p>
                {displayTemple.history_and_legend && (
                  <p className="text-sm text-[var(--warm-charcoal)]/80 leading-relaxed mt-2 font-sans font-[350]">
                    {displayTemple.history_and_legend}
                  </p>
                )}
              </div>

              {/* Special Events */}
              {displayTemple.special_events && displayTemple.special_events.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--indigo-deep)] border-b border-[var(--warm-sand)]/60 pb-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-[var(--terracotta)] rounded-sm" />
                    Festivals &amp; Special Events
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(displayTemple.special_events || []).map(event => (
                      <span
                        key={event}
                        className="text-xs px-3 py-1 rounded-lg bg-[var(--warm-sand)]/30 text-[var(--indigo-deep)] border border-[var(--warm-sand)] font-medium"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Travel and Transit Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--indigo-deep)] border-b border-[var(--warm-sand)]/60 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-[var(--terracotta)] rounded-sm" />
                  Travel &amp; Connectivity
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {displayTemple.nearest_airport && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--warm-sand)]/50 bg-gray-50/30">
                      <Plane className="w-4 h-4 text-sky-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[var(--warm-charcoal)]/50 font-bold uppercase">Nearest Airport</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/80 mt-0.5 leading-snug">{displayTemple.nearest_airport}</p>
                      </div>
                    </div>
                  )}
                  {displayTemple.nearest_railway && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-[var(--warm-sand)]/50 bg-gray-50/30">
                      <Train className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[var(--warm-charcoal)]/50 font-bold uppercase">Nearest Railway</p>
                        <p className="text-xs text-[var(--warm-charcoal)]/80 mt-0.5 leading-snug">{displayTemple.nearest_railway}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Travel Tips Section */}
              {displayTemple.travel_tips && displayTemple.travel_tips.length > 0 && (
                <div className="space-y-2 bg-orange-50/20 border border-orange-100/50 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--terracotta)] flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    Important Visitor Guidelines
                  </h4>
                  <ul className="space-y-2 text-xs text-[var(--warm-charcoal)]/80 leading-relaxed font-sans">
                    {(displayTemple.travel_tips || []).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Footprints className="w-3.5 h-3.5 text-[var(--saffron)] flex-shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-5 py-4 border-t border-[var(--warm-sand)] bg-amber-50/5 flex justify-end gap-3 sm:rounded-b-2xl">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--warm-sand)] text-[var(--warm-charcoal)]/70 hover:bg-[var(--warm-sand)]/20 transition-all active:scale-[0.98]"
              >
                Close Details
              </button>
              <a
                href={`https://www.openstreetmap.org/directions?to=${displayTemple.coordinates?.latitude || 0},${displayTemple.coordinates?.longitude || 0}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[var(--indigo-deep)] text-white hover:bg-[var(--indigo-deep)]/90 transition-all flex items-center gap-1.5 shadow-md active:scale-[0.98]"
              >
                <Compass className="w-3.5 h-3.5" />
                Get Directions
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
