'use client'

import '@livekit/components-styles'
import {
  LiveKitRoom,
  useTracks,
  useLocalParticipant,
  RoomAudioRenderer,
  VideoTrack,
  useParticipants,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { useState, useCallback, useEffect } from 'react'

interface ConsultationRoomProps {
  bookingId: string
  userName: string
  onLeave?: () => void
  slotDate?: string
  slotTime?: string
}

// ── Session timer ──────────────────────────────────────────────────
function useTimer() {
  const [s, setS] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setS(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ── In-call room (inside LiveKitRoom context) ─────────────────────
function TathastuConsultRoom({ userName, onLeave }: { userName: string; onLeave: () => void }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant()
  const participants = useParticipants()
  const timer = useTimer()

  const cameraTracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false }
  )

  const isWaiting = participants.filter(p => !p.isLocal).length === 0

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden',
      height: 'min(600px, calc(100svh - 100px))',
      background: '#0c0a18',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
      fontFamily: "'Sora', system-ui, sans-serif",
    }}>
      <RoomAudioRenderer />

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', flexShrink: 0,
        background: '#13101f',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'var(--indigo-deep, #2d1b69)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900, color: '#fff',
            fontFamily: 'Georgia, serif',
          }}>ॐ</div>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
            MahaTathastu
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: isWaiting ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${isWaiting ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`,
          }}>
            <div className={isWaiting ? 'animate-pulse' : ''} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isWaiting ? '#f59e0b' : '#10b981',
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: isWaiting ? '#f59e0b' : '#10b981', whiteSpace: 'nowrap' }}>
              {isWaiting ? 'Awaiting Expert' : `${participants.length} in session`}
            </span>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>{timer}</span>
          <button
            onClick={onLeave}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#fca5a5', fontSize: 11, fontWeight: 700,
              fontFamily: "'Sora', system-ui, sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>call_end</span>
            <span className="hidden sm:inline">End</span>
          </button>
        </div>
      </div>

      {/* Video area */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexWrap: 'wrap', gap: 10, padding: 12, overflow: 'hidden',
        background: '#0c0a18',
      }}>
        {/* Waiting overlay */}
        {isWaiting && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(12,10,24,0.92)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)', fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Your room is ready
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', maxWidth: 240, lineHeight: 1.6 }}>
              Waiting for your Vedic expert to join. Please stay connected.
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="animate-bounce" style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.3)',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Video tiles */}
        {cameraTracks.map((track, idx) => {
          const p = track.participant
          const isLocal = p?.isLocal
          const name = p?.name || p?.identity || (isLocal ? userName : 'Expert')
          const isVideoOff = !track.publication || track.publication.isMuted
          const isSolo = cameraTracks.length <= 1

          return (
            <div key={p?.identity ?? idx} style={{
              position: 'relative',
              width: isSolo ? '100%' : 'calc(50% - 5px)',
              maxWidth: isSolo ? 560 : 320,
              aspectRatio: '16/9',
              borderRadius: 12, overflow: 'hidden',
              background: '#1a1628',
              border: `1.5px solid ${isLocal ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
              flexShrink: 0,
            }}>
              {isVideoOff ? (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(160deg, #1a1628 0%, #0c0a18 100%)',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: isLocal ? 'rgba(255,255,255,0.06)' : 'var(--indigo-deep, #2d1b69)',
                    border: '1.5px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                    marginBottom: 8,
                  }}>{name.charAt(0).toUpperCase()}</div>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>Camera off</p>
                </div>
              ) : (
                <VideoTrack trackRef={track as any} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}

              {/* Name badge */}
              <div style={{
                position: 'absolute', bottom: 8, left: 8,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                padding: '3px 9px', borderRadius: 20,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                  {isLocal ? `${name} (You)` : name}
                </span>
              </div>

              {!isLocal && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '2px 8px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                }}>Expert</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px', gap: 10, flexShrink: 0,
        background: '#13101f',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <ControlBtn
          active={isMicrophoneEnabled}
          icon={isMicrophoneEnabled ? 'mic' : 'mic_off'}
          label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          danger={!isMicrophoneEnabled}
        />
        <ControlBtn
          active={isCameraEnabled}
          icon={isCameraEnabled ? 'videocam' : 'videocam_off'}
          label={isCameraEnabled ? 'Stop Video' : 'Start Video'}
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          danger={!isCameraEnabled}
        />

        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', margin: '0 4px' }} />

        <button
          onClick={onLeave}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 20px', height: 44, borderRadius: 22, cursor: 'pointer',
            background: '#dc2626', border: 'none', color: 'white',
            fontWeight: 700, fontSize: 12, fontFamily: "'Sora', system-ui, sans-serif",
            boxShadow: '0 3px 12px rgba(220,38,38,0.4)',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>call_end</span>
          End Session
        </button>
      </div>
    </div>
  )
}

// ── Control button ────────────────────────────────────────────────
function ControlBtn({ active, icon, label, onClick, danger }: {
  active: boolean; icon: string; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 6px',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: danger ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${danger ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? '#fca5a5' : 'rgba(255,255,255,0.6)',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 19, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}

// ── Pre-join screen + main exported component ─────────────────────
export default function ConsultationRoom({ bookingId, userName, onLeave, slotDate, slotTime }: ConsultationRoomProps) {
  const [token, setToken] = useState<string | null>(null)
  const [wsUrl, setWsUrl] = useState<string | null>(null)
  const [tokenMode, setTokenMode] = useState<'production' | 'sandbox' | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roomName = `consult-${bookingId}`

  const joinRoom = useCallback(async () => {
    setConnecting(true)
    setError(null)
    try {
      const res = await fetch('/api/get-livekit-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, userName }),
      })
      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}))
        throw new Error(msg || 'Failed to obtain access token')
      }
      const { token: t, wsUrl: url, mode } = await res.json()
      setToken(t); setWsUrl(url); setTokenMode(mode)
    } catch (e: any) {
      setError(e.message || 'Connection failed. Please try again.')
    } finally {
      setConnecting(false)
    }
  }, [roomName, userName])

  const handleLeave = useCallback(() => {
    setToken(null); setWsUrl(null); setTokenMode(null)
    onLeave?.()
  }, [onLeave])

  // ── Active room ──
  if (token && wsUrl) {
    return (
      <>
        {tokenMode === 'sandbox' && (
          <div className="mb-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px]">warning</span>
            Sandbox mode — for testing only. Switch to Production in Admin panel.
          </div>
        )}
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect video audio
          onDisconnected={handleLeave}
          style={{ height: '100%' }}
        >
          <TathastuConsultRoom userName={userName} onLeave={handleLeave} />
        </LiveKitRoom>
      </>
    )
  }

  // ── Pre-join screen ──
  return (
    <div className="bg-white border border-[var(--outline-variant)]/40 rounded-2xl overflow-hidden shadow-sm w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--outline-variant)]/30 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Georgia, serif' }}>ॐ</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[var(--indigo-deep)] tracking-[0.12em] uppercase" style={{ fontFamily: "'Sora', sans-serif" }}>MahaTathastu</p>
          <p className="text-[10px] text-[var(--warm-charcoal)]/40 tracking-widest uppercase">Vedic Consultation</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
          Room Ready
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Info row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {/* Participant card */}
          <div className="bg-[var(--warm-sand)] rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-[var(--warm-charcoal)]/40 mb-3 font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>Joining as</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--indigo-deep)] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <p className="font-semibold text-[var(--indigo-deep)] text-sm truncate">{userName}</p>
            </div>
          </div>

          {/* Session card */}
          <div className="bg-[var(--warm-sand)] rounded-xl p-4">
            <p className="text-[9px] uppercase tracking-widest text-[var(--warm-charcoal)]/40 mb-3 font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
              {slotDate ? 'Your session' : 'This session'}
            </p>
            {slotDate && (
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[14px] text-[var(--terracotta)]">calendar_today</span>
                <span className="text-xs font-semibold text-[var(--indigo-deep)]">
                  {new Date(slotDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {slotTime && ` · ${slotTime}`}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              {[
                { icon: 'lock', label: 'End-to-end encrypted' },
                { icon: 'hd', label: 'HD video & audio' },
                { icon: 'group', label: 'Private 1-on-1 room' },
              ].map(f => (
                <div key={f.icon} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[13px] text-[var(--terracotta)]" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                  <span className="text-[11px] text-[var(--warm-charcoal)]/60">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={joinRoom}
          disabled={connecting}
          className="btn-divine w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connecting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
              Connecting…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>videocam</span>
              Join Consultation
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-[var(--warm-charcoal)]/35 mt-3 leading-relaxed">
          Camera &amp; microphone access required · Session is private and confidential
        </p>
      </div>
    </div>
  )
}
