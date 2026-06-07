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
}

// ── Session timer (inside LiveKitRoom context) ─────────────────────
function useTimer() {
  const [s, setS] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setS(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ── Branded inner room (must render inside <LiveKitRoom>) ──────────
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
      display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden',
      height: 580, background: '#080611',
      border: '1px solid rgba(212,160,23,0.35)',
      boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,160,23,0.15)',
      fontFamily: "'Sora', system-ui, sans-serif",
    }}>
      <RoomAudioRenderer />

      {/* ══ TOP BAR ══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 18px', flexShrink: 0,
        background: 'linear-gradient(90deg, #160920 0%, #0e0b1c 100%)',
        borderBottom: '1px solid rgba(212,160,23,0.2)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #D4A017 0%, #b8860b 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#1a0e2e',
            boxShadow: '0 0 14px rgba(212,160,23,0.55)',
            fontFamily: 'Georgia, serif',
          }}>ॐ</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#D4A017', letterSpacing: '0.1em' }}>
              MahaTathastu
            </div>
            <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.35em', textTransform: 'uppercase', marginTop: 1 }}>
              Vedic Consultation · Private
            </div>
          </div>
        </div>

        {/* Live status + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 13px', borderRadius: 20,
            background: isWaiting ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
            border: `1px solid ${isWaiting ? 'rgba(245,158,11,0.35)' : 'rgba(16,185,129,0.35)'}`,
          }}>
            <div className={isWaiting ? 'animate-pulse' : ''} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isWaiting ? '#f59e0b' : '#10b981',
              boxShadow: `0 0 8px ${isWaiting ? '#f59e0b' : '#10b981'}`,
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: isWaiting ? '#f59e0b' : '#10b981' }}>
              {isWaiting ? 'Awaiting Expert' : `${participants.length} in session`}
            </span>
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, color: '#D4A017', fontWeight: 700,
            padding: '5px 13px', borderRadius: 20,
            background: 'rgba(212,160,23,0.07)',
            border: '1px solid rgba(212,160,23,0.25)',
            letterSpacing: '0.1em',
          }}>{timer}</div>
        </div>

        {/* End button */}
        <button
          onClick={onLeave}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer',
            background: 'rgba(220,38,38,0.12)',
            border: '1px solid rgba(220,38,38,0.45)',
            color: '#fca5a5', fontSize: 12, fontWeight: 700,
            transition: 'all 0.2s', fontFamily: "'Sora', system-ui, sans-serif",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}>call_end</span>
          End Session
        </button>
      </div>

      {/* ══ VIDEO AREA ══ */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 14, overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 40%, #1e0e38 0%, #0a0714 65%)',
      }}>
        {/* Subtle mandala watermark */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', opacity: 0.04,
          fontSize: 340, color: '#D4A017',
          fontFamily: 'Georgia, serif', lineHeight: 1,
          userSelect: 'none',
        }}>ॐ</div>

        {/* Waiting overlay */}
        {isWaiting && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 6,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(8,6,17,0.88)',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(212,160,23,0.05))',
              border: '2px solid rgba(212,160,23,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, marginBottom: 18,
              boxShadow: '0 0 30px rgba(212,160,23,0.15)',
            }}>🙏</div>
            <p style={{
              color: '#D4A017', fontSize: 18, fontWeight: 700, marginBottom: 8,
              fontFamily: 'Georgia, serif',
            }}>Sacred Space is Ready</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', maxWidth: 260, lineHeight: 1.7 }}>
              Waiting for your Vedic expert to join.<br />Please remain connected — they will arrive shortly.
            </p>
            <div style={{ display: 'flex', gap: 7, marginTop: 22 }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="animate-bounce" style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#D4A017', opacity: 0.7,
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
              width: isSolo ? '100%' : 'calc(50% - 6px)',
              maxWidth: isSolo ? 580 : 340,
              aspectRatio: '16/9',
              borderRadius: 14, overflow: 'hidden',
              background: '#160920',
              border: `2px solid ${isLocal ? 'rgba(212,160,23,0.25)' : 'rgba(212,160,23,0.65)'}`,
              boxShadow: isLocal ? 'none' : '0 0 28px rgba(212,160,23,0.18), inset 0 1px 0 rgba(212,160,23,0.1)',
              flexShrink: 0,
            }}>
              {isVideoOff ? (
                /* Camera-off avatar */
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(160deg, #1e0e38 0%, #0e0920 100%)',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4A017, #b8860b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 900, color: '#1a0e2e',
                    boxShadow: '0 0 20px rgba(212,160,23,0.4)',
                    marginBottom: 10, fontFamily: 'Georgia, serif',
                  }}>{name.charAt(0).toUpperCase()}</div>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Camera off</p>
                </div>
              ) : (
                <VideoTrack trackRef={track as any} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}

              {/* Name badge */}
              <div style={{
                position: 'absolute', bottom: 10, left: 10,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                padding: '4px 11px 4px 9px',
                borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5,
                border: '1px solid rgba(212,160,23,0.3)',
              }}>
                <span style={{ fontSize: 9, color: '#D4A017' }}>✦</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.92)', fontWeight: 600 }}>
                  {isLocal ? `${name} (You)` : name}
                </span>
              </div>

              {/* Expert / You role badge */}
              <div style={{
                position: 'absolute', top: 10, right: 10,
                padding: '3px 10px', borderRadius: 20,
                background: isLocal ? 'rgba(99,102,241,0.15)' : 'rgba(212,160,23,0.15)',
                border: `1px solid ${isLocal ? 'rgba(99,102,241,0.4)' : 'rgba(212,160,23,0.45)'}`,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: isLocal ? 'rgba(165,180,252,0.9)' : '#D4A017',
              }}>{isLocal ? 'You' : 'Expert'}</div>
            </div>
          )
        })}
      </div>

      {/* ══ CONTROLS BAR ══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '13px 24px', gap: 12, flexShrink: 0,
        background: 'linear-gradient(0deg, #160920 0%, #0e0b1c 100%)',
        borderTop: '1px solid rgba(212,160,23,0.15)',
      }}>
        {/* Mic */}
        <ControlBtn
          active={isMicrophoneEnabled}
          icon={isMicrophoneEnabled ? 'mic' : 'mic_off'}
          label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
          onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          danger={!isMicrophoneEnabled}
        />

        {/* Camera */}
        <ControlBtn
          active={isCameraEnabled}
          icon={isCameraEnabled ? 'videocam' : 'videocam_off'}
          label={isCameraEnabled ? 'Stop Video' : 'Start Video'}
          onClick={() => localParticipant.setCameraEnabled(!isCameraEnabled)}
          danger={!isCameraEnabled}
        />

        {/* Divider */}
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />

        {/* Participants count */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '0 8px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', fontVariationSettings: "'FILL' 1" }}>group</span>
          </div>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' }}>
            {participants.length} / 2
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 30, background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />

        {/* End Session */}
        <button
          onClick={onLeave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 26px', height: 50, borderRadius: 25, cursor: 'pointer',
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
            border: '1px solid rgba(239,68,68,0.5)', color: 'white',
            fontWeight: 800, fontSize: 13, transition: 'all 0.2s',
            boxShadow: '0 4px 18px rgba(220,38,38,0.4)',
            fontFamily: "'Sora', system-ui, sans-serif",
            letterSpacing: '0.02em',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>call_end</span>
          End Session
        </button>
      </div>

      {/* Branding footer strip */}
      <div style={{
        padding: '6px 18px', flexShrink: 0,
        background: '#0a0613',
        borderTop: '1px solid rgba(212,160,23,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          Powered by
        </span>
        <span style={{ fontSize: 9, color: 'rgba(212,160,23,0.5)', fontWeight: 700, letterSpacing: '0.2em' }}>
          ॐ MahaTathastu · Anushthaan India
        </span>
      </div>
    </div>
  )
}

// ── Reusable control button ───────────────────────────────────────
function ControlBtn({
  active, icon, label, onClick, danger,
}: {
  active: boolean; icon: string; label: string; onClick: () => void; danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 4px',
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: danger ? 'rgba(220,38,38,0.18)' : 'rgba(212,160,23,0.08)',
        border: `1.5px solid ${danger ? 'rgba(220,38,38,0.5)' : 'rgba(212,160,23,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        color: danger ? '#fca5a5' : '#D4A017',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 21, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  )
}

// ── Pre-join / main exported component ───────────────────────────
export default function ConsultationRoom({ bookingId, userName, onLeave }: ConsultationRoomProps) {
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
      setToken(t)
      setWsUrl(url)
      setTokenMode(mode)
    } catch (e: any) {
      setError(e.message || 'Connection failed. Please try again.')
    } finally {
      setConnecting(false)
    }
  }, [roomName, userName])

  const handleLeave = useCallback(() => {
    setToken(null)
    setWsUrl(null)
    setTokenMode(null)
    onLeave?.()
  }, [onLeave])

  // ── Active room ──
  if (token && wsUrl) {
    return (
      <>
        {tokenMode === 'sandbox' && (
          <div style={{
            marginBottom: 8, padding: '6px 14px', borderRadius: 10,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
            fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            Running in <strong>Sandbox mode</strong> — for development only. Switch to Production in Admin → Consultations → LiveKit Plan.
          </div>
        )}
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          connect
          video
          audio
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
    <div style={{
      borderRadius: 20, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(160deg, #0f0920 0%, #1a0e2e 45%, #080611 100%)',
      border: '1px solid rgba(212,160,23,0.3)',
      boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
      padding: '44px 36px 36px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      textAlign: 'center', fontFamily: "'Sora', system-ui, sans-serif",
    }}>
      {/* Corner ornaments */}
      {[
        { top: 0, left: 0, borderTop: '2px solid rgba(212,160,23,0.4)', borderLeft: '2px solid rgba(212,160,23,0.4)', borderTopLeftRadius: 20 },
        { top: 0, right: 0, borderTop: '2px solid rgba(212,160,23,0.4)', borderRight: '2px solid rgba(212,160,23,0.4)', borderTopRightRadius: 20 },
        { bottom: 0, left: 0, borderBottom: '2px solid rgba(212,160,23,0.4)', borderLeft: '2px solid rgba(212,160,23,0.4)', borderBottomLeftRadius: 20 },
        { bottom: 0, right: 0, borderBottom: '2px solid rgba(212,160,23,0.4)', borderRight: '2px solid rgba(212,160,23,0.4)', borderBottomRightRadius: 20 },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 28, height: 28, ...s }} />
      ))}

      {/* Glow */}
      <div style={{
        position: 'absolute', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,160,23,0.07) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />

      {/* OM symbol */}
      <div style={{
        width: 76, height: 76, borderRadius: '50%',
        background: 'linear-gradient(135deg, #D4A017 0%, #b8860b 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, fontWeight: 900, color: '#1a0e2e',
        boxShadow: '0 0 36px rgba(212,160,23,0.6), 0 0 70px rgba(212,160,23,0.2)',
        marginBottom: 22, fontFamily: 'Georgia, serif',
        position: 'relative', zIndex: 1,
      }}>ॐ</div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <p style={{ fontSize: 10, color: '#D4A017', letterSpacing: '0.45em', textTransform: 'uppercase', marginBottom: 10, fontWeight: 700 }}>
          MahaTathastu · Anushthaan India
        </p>
        <h3 style={{
          fontSize: 24, fontWeight: 700, color: 'white', marginBottom: 8,
          fontFamily: 'Georgia, serif', letterSpacing: '0.04em',
        }}>
          1-on-1 Vedic Consultation
        </h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.7, maxWidth: 320, margin: '0 auto 28px' }}>
          A private sacred space for your consultation with our Vedic expert. Your session is confidential and secure.
        </p>

        {/* Room ID pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(212,160,23,0.22)',
          borderRadius: 20, padding: '7px 16px',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {roomName}
          </span>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { icon: 'lock', label: 'End-to-End Secure' },
            { icon: 'hd', label: 'HD Video' },
            { icon: 'mic', label: 'Crystal Audio' },
            { icon: 'shield', label: 'Private Room' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 13,
                background: 'rgba(212,160,23,0.07)',
                border: '1px solid rgba(212,160,23,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D4A017', fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
              </div>
              <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 72, lineHeight: 1.4 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            marginBottom: 18, padding: '10px 16px',
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.35)',
            borderRadius: 12, color: '#fca5a5', fontSize: 12,
          }}>{error}</div>
        )}

        {/* Join button */}
        <button
          onClick={joinRoom}
          disabled={connecting}
          style={{
            background: connecting
              ? 'rgba(212,160,23,0.4)'
              : 'linear-gradient(135deg, #D4A017 0%, #b8860b 100%)',
            color: '#1a0e2e', border: 'none', borderRadius: 30,
            padding: '15px 44px', cursor: connecting ? 'wait' : 'pointer',
            fontSize: 15, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            boxShadow: connecting ? 'none' : '0 6px 24px rgba(212,160,23,0.45)',
            transition: 'all 0.25s', letterSpacing: '0.02em',
            fontFamily: "'Sora', system-ui, sans-serif",
          }}
        >
          {connecting ? (
            <>
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: 'rgba(26,14,46,0.3)', borderTopColor: '#1a0e2e' }} />
              Connecting…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>videocam</span>
              Enter Sacred Space
            </>
          )}
        </button>

        <p style={{ marginTop: 14, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
          Your camera & microphone will be requested upon joining
        </p>

        {/* Brand footer */}
        <div style={{ marginTop: 28, paddingTop: 18, borderTop: '1px solid rgba(212,160,23,0.12)' }}>
          <p style={{ fontSize: 9, color: 'rgba(212,160,23,0.35)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 600 }}>
            Powered by MahaTathastu · Anushthaan India
          </p>
        </div>
      </div>
    </div>
  )
}
