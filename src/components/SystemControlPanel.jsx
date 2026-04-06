import { useState, useCallback, useEffect, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ─── Design tokens from Figma ────────────────────────────────────────────────
const CYAN = '#3cdde6'
const CYAN_BRIGHT = '#2af5ff'
const RED = '#ff5b5b'
const ORANGE = '#fca139'
const BG_DARK = '#0b0f14'
const MONO = "'Geist Mono Variable', 'Geist Mono', monospace"

// ─── Easing curves ───────────────────────────────────────────────────────────
const EASE_OUT = [0.22, 1, 0.36, 1]
const EASE_IN_OUT = [0.42, 0, 0.58, 1]

// ─── Navigation tabs ─────────────────────────────────────────────────────────
const TABS = ['General', 'Security', 'Performance', 'Advanced']

// ─── Control panel data ──────────────────────────────────────────────────────
const PANEL_SECTIONS = [
  {
    title: 'System Control Panel',
    controls: [
      { label: 'Health Status', defaultValue: 60 },
      { label: 'Threat Control', defaultValue: 60 },
      { label: 'Stability Level', defaultValue: 60 },
    ],
  },
  {
    title: 'System Control Panel',
    controls: [
      { label: 'Threat Sensitivity', defaultValue: 60 },
      { label: 'Alert Threshold', defaultValue: 60 },
      { label: 'Response Intensity', defaultValue: 60 },
    ],
  },
]

// ─── Utility: random jitter for glitch realism ───────────────────────────────
function jitter(base, range) {
  return base + (Math.random() - 0.5) * range * 2
}

// ─── YouTube Glitch SFX Controller ───────────────────────────────────────────
// Uses a hidden YouTube iframe to play the glitch sound effect.
// Video ID: 7a5UMZ4kihM (from https://www.youtube.com/watch?v=7a5UMZ4kihM)
//
// How it works:
//   - A persistent hidden iframe is mounted (0×0, no visibility)
//   - To play: we set/reset the iframe src with autoplay=1
//   - To prevent overlap: we destroy and recreate the src each trigger
//   - YouTube's embed API handles playback; we just toggle the src
//
// Limitation: autoplay with sound requires prior user interaction.
// The boot glitch may be silent (browser policy), but save-button
// glitch always works since it follows a click event.
const YT_VIDEO_ID = '7a5UMZ4kihM'

function useGlitchAudio() {
  const iframeRef = useRef(null)
  const counterRef = useRef(0)

  const play = useCallback(() => {
    if (!iframeRef.current) return
    // Increment counter to force src change → restarts playback cleanly
    // This prevents overlapping: each new src kills the previous playback
    counterRef.current += 1
    iframeRef.current.src =
      `https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&start=0&end=3&controls=0&showinfo=0&rel=0&v=${counterRef.current}`
  }, [])

  const stop = useCallback(() => {
    if (!iframeRef.current) return
    iframeRef.current.src = 'about:blank'
  }, [])

  return { iframeRef, play, stop }
}

// ─── Grid dot pattern (background decoration) ───────────────────────────────
function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle, ${RED} 0.5px, transparent 0.5px)`,
          backgroundSize: '12.5px 12.5px',
        }}
      />
    </div>
  )
}

// ─── Scanline overlay for glitch effect ──────────────────────────────────────
// UPGRADED: 5-layer composited glitch with stronger visual impact.
//
// Layering strategy (bottom to top):
//   1. Dense scanlines — visible horizontal banding
//   2. RGB channel split — red/cyan offset, 3–4px
//   3. Horizontal tearing — random slice displacement
//   4. Noise grain — high-frequency visual noise
//   5. Brightness bloom — flash on resolve
//
// All layers use transform + opacity only (GPU composited, no layout thrash).
function GlitchOverlay({ isActive }) {
  return (
    <AnimatePresence>
      {isActive && (
        <Motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: EASE_OUT } }}
        >
          {/* Layer 1: Dense scanlines — stronger visibility than before */}
          <Motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(42,245,255,0.06) 1px, rgba(42,245,255,0.06) 2px)',
              mixBlendMode: 'screen',
            }}
            animate={{
              opacity: [0.4, 0.9, 0.3, 1, 0.5, 0.8, 0.6, 1, 0.3],
              y: [0, -3, 1, -2, 0, 2, -1, 0],
            }}
            transition={{ duration: 1.1, ease: 'linear' }}
          />

          {/* Layer 2: RGB channel split — red shifts right, cyan shifts left */}
          <Motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(255,91,91,0.15) 0%, transparent 25%, transparent 75%, rgba(42,245,255,0.15) 100%)',
              mixBlendMode: 'screen',
            }}
            animate={{
              x: [0, 4, -3, 2, -4, 1, 0],
              opacity: [0, 0.7, 0.9, 0.5, 0.8, 0.6, 0],
            }}
            transition={{ duration: 1.2, ease: EASE_IN_OUT }}
          />

          {/* Layer 3: Horizontal tearing — skew jitter simulating scan desync */}
          <Motion.div
            className="absolute inset-0"
            animate={{
              skewX: [0, 2.5, -1, 1.5, -2, 0.8, -0.5, 0],
              x: [0, -3, 2, -1, 3, -2, 1, 0],
            }}
            transition={{ duration: 1.0, ease: 'linear' }}
          >
            {/* Tearing slice — a band that offsets independently */}
            <Motion.div
              className="absolute left-0 right-0"
              style={{
                top: '30%',
                height: '8%',
                background: 'rgba(42,245,255,0.04)',
                mixBlendMode: 'screen',
              }}
              animate={{
                x: [0, 6, -4, 8, -6, 3, 0],
                opacity: [0, 0.8, 0.3, 0.9, 0.4, 0.7, 0],
              }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
            <Motion.div
              className="absolute left-0 right-0"
              style={{
                top: '65%',
                height: '5%',
                background: 'rgba(255,91,91,0.05)',
                mixBlendMode: 'screen',
              }}
              animate={{
                x: [0, -5, 7, -3, 5, -2, 0],
                opacity: [0, 0.6, 0.9, 0.4, 0.8, 0.5, 0],
              }}
              transition={{ duration: 0.85, ease: 'linear' }}
            />
          </Motion.div>

          {/* Layer 4: Noise grain — rapid flicker overlay */}
          <Motion.div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
              backgroundSize: '128px 128px',
              mixBlendMode: 'overlay',
            }}
            animate={{
              opacity: [0, 0.12, 0.05, 0.15, 0.08, 0.1, 0.04, 0],
              x: [0, 1, -1, 0],
              y: [0, -1, 1, 0],
            }}
            transition={{ duration: 1.2, ease: 'linear' }}
          />

          {/* Layer 5: Brightness bloom at resolve — radial flash */}
          <Motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(42,245,255,0.12) 0%, transparent 60%)',
              mixBlendMode: 'screen',
            }}
            animate={{
              opacity: [0, 0, 0, 0, 0.3, 0.8, 0.4, 0],
              scale: [1, 1, 1, 1, 1.02, 1.06, 1.02, 1],
            }}
            transition={{ duration: 1.3, ease: EASE_OUT }}
          />

          {/* Full-screen opacity flicker — the "frame skip" feel */}
          <Motion.div
            className="absolute inset-0 bg-black"
            animate={{
              opacity: [0, 0.06, 0, 0.1, 0, 0.04, 0.12, 0, 0.03, 0],
            }}
            transition={{ duration: 1.1, ease: 'linear' }}
          />
        </Motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── CRT close bars for popup ────────────────────────────────────────────────
function CrtCloseEffect({ isClosing, onComplete }) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isClosing && (
        <>
          <Motion.div
            className="absolute top-0 left-0 right-0 z-10"
            style={{ background: `linear-gradient(180deg, ${BG_DARK} 80%, rgba(42,245,255,0.3))` }}
            initial={{ height: '0%' }}
            animate={{ height: '50%' }}
            exit={{ height: '50%' }}
            transition={{ duration: 0.45, delay: 0.15, ease: EASE_IN_OUT }}
          />
          <Motion.div
            className="absolute bottom-0 left-0 right-0 z-10"
            style={{ background: `linear-gradient(0deg, ${BG_DARK} 80%, rgba(255,91,91,0.3))` }}
            initial={{ height: '0%' }}
            animate={{ height: '50%' }}
            exit={{ height: '50%' }}
            transition={{ duration: 0.45, delay: 0.15, ease: EASE_IN_OUT }}
          />
          <Motion.div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 z-20"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent, ${CYAN_BRIGHT}, ${RED}, ${CYAN_BRIGHT}, transparent)`,
              boxShadow: `0 0 20px ${CYAN_BRIGHT}, 0 0 40px ${CYAN}`,
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{
              opacity: [0, 0, 1, 1, 0],
              scaleX: [0.3, 0.5, 1, 0.8, 0],
            }}
            transition={{
              duration: 0.75,
              times: [0, 0.5, 0.65, 0.85, 1],
              ease: EASE_IN_OUT,
            }}
          />
          <Motion.div
            className="absolute inset-0 z-[5]"
            animate={{ opacity: [0, 0.15, 0, 0.1, 0, 0.08, 0] }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(42,245,255,0.1) 1px, rgba(42,245,255,0.1) 2px)',
            }}
          />
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Clip-path for bar shapes ────────────────────────────────────────────────
// Extracted DIRECTLY from Figma SVG vector path data via MCP asset fetch:
//
// Red fill (node 1658:13200, 384×20):
//   Path: M0 0 H384 V11.6667 L376.163 20 H0 Z
//   → Right edge: straight down to 58.33% height, then 7.84px diagonal cut
//     to bottom. This is a TWO-SEGMENT right edge, not a single diagonal.
//
// Track bg (node 1658:13158, 654×20):
//   Right edge: (654,0) → (643.5,20) = 10.5px inward cut at bottom-right
//
// Converted to percentage-based clip-path for responsive scaling:
//   Red fill: 11.6667/20 = 58.33% is the "break point" on the right edge
//             7.84/384 ≈ 2.04% inward cut → use calc(100% - 8px) for precision
//   Track:    10.5/654 ≈ 1.6% inward cut → use calc(100% - 10px)
//
// The TWO-SEGMENT right edge is the key visual distinction from a simple diagonal.
// Red fill (node 1658:13200, path: M0 0H384V11.6667L376.163 20H0V0Z):
//   Right edge: vertical to 58.33%, then diagonal cut 8px inward to bottom.
const BAR_CLIP_RED =
  'polygon(0 0, 100% 0, 100% 58.33%, calc(100% - 8px) 100%, 0 100%)'
// Track bg (node 1658:13158, path: M0 0H654V11.6667L643.5 20H0V0Z):
//   Same two-segment shape — vertical to 58.33%, then 10.5px diagonal cut.
//   Previous code incorrectly had "100% 0%" (making a single diagonal).
const BAR_CLIP_TRACK =
  'polygon(0 0, 100% 0, 100% 58.33%, calc(100% - 10px) 100%, 0 100%)'
// Cyan bar (6px tall, proportional 3px cut at the same 58.33% break):
const BAR_CLIP_CYAN =
  'polygon(0 0, 100% 0, 100% 58.33%, calc(100% - 3px) 100%, 0 100%)'

// ─── Progress bar with dual tracks ───────────────────────────────────────────
// Red bar (top): interactive, draggable, solid #FF5B5B, right edge slopes inward
// Cyan bar (bottom): static 25% width, solid #3CDDE6, NOT interactive
function ProgressBar({ value, onValueChange, isGlitching }) {
  const trackRef = useRef(null)

  const pointerToValue = useCallback((clientX) => {
    if (!trackRef.current) return value
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    return Math.round(Math.max(0, Math.min(100, ratio * 100)))
  }, [value])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    onValueChange(pointerToValue(e.clientX))
  }, [onValueChange, pointerToValue])

  const handlePointerMove = useCallback((e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onValueChange(pointerToValue(e.clientX))
  }, [onValueChange, pointerToValue])

  const handlePointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  // Value → width: direct percentage (value 60 = width 60%)
  const redWidth = `${value}%`

  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      {/* Red bar — interactive, draggable track */}
      <div
        ref={trackRef}
        className="relative h-5 w-full cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Track background — two-segment right edge from Figma node 1658:13158
            Straight down to 58.33%, then diagonal cut inward 10px to bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(255,91,91,0.15)',
            border: '1px solid rgba(255,91,91,0.25)',
            clipPath: BAR_CLIP_TRACK,
          }}
        />

        {/* Tick marks overlay */}
        <div className="absolute inset-0 flex items-center px-0.5 pointer-events-none">
          <div
            className="w-full h-2.5 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px)',
              clipPath: BAR_CLIP_TRACK,
            }}
          />
        </div>

        {/* Active fill — solid #FF5B5B, same clip-path for angled edge */}
        <Motion.div
          className="absolute top-0 left-0 h-full pointer-events-none"
          style={{
            backgroundColor: '#FF5B5B',
            boxShadow: '0 0 8px rgba(255,91,91,0.3)',
            clipPath: BAR_CLIP_RED,
          }}
          animate={{
            width: redWidth,
            x: isGlitching ? [0, jitter(0, 2), jitter(0, 1.5), jitter(0, 2), 0] : 0,
          }}
          transition={{
            width: { duration: 0.25, ease: EASE_OUT },
            x: { duration: 0.4, repeat: isGlitching ? 2 : 0 },
          }}
        />
      </div>

      {/* Cyan bar — static 25% width, NOT interactive, solid #3CDDE6 */}
      <div className="relative h-3.5 w-full pointer-events-none">
        {/* Track background */}
        <div
          className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[6px]"
          style={{
            background: 'rgba(60,221,230,0.1)',
            clipPath: BAR_CLIP_CYAN,
          }}
        />
        {/* Fill — exactly 25% of container width, solid color, no gradient */}
        <Motion.div
          className="absolute top-1/2 -translate-y-1/2 left-0 h-[6px]"
          style={{
            width: '25%',
            backgroundColor: '#3CDDE6',
            clipPath: BAR_CLIP_CYAN,
          }}
          animate={{
            opacity: isGlitching ? [1, 0.4, 1, 0.6, 1] : 1,
          }}
          transition={{
            opacity: { duration: 0.5, repeat: isGlitching ? 1 : 0 },
          }}
        />
      </div>
    </div>
  )
}

// ─── Value badge ─────────────────────────────────────────────────────────────
function ValueBadge({ value, isGlitching }) {
  return (
    <Motion.div
      className="relative shrink-0 flex items-center justify-center"
      style={{ width: 40, height: 40, fontFamily: MONO }}
      animate={{ x: isGlitching ? [0, jitter(0, 2), jitter(0, 1), 0] : 0 }}
      transition={{ duration: 0.3 }}
    >
      <svg className="absolute inset-0" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M6 0.5 L39.5 0.5 L39.5 33.5 L34 39.5 L0.5 39.5 L0.5 6 Z"
          stroke={CYAN} strokeWidth="1" fill="rgba(42,245,255,0.08)"
        />
      </svg>
      <svg className="absolute -bottom-0.5 -right-0.5" width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
        <path d="M8 8L0 8L8 0Z" fill={CYAN} fillOpacity="0.6" />
      </svg>
      <span
        className="relative text-xl font-medium tracking-wider uppercase"
        style={{ fontFamily: MONO, color: CYAN_BRIGHT, textShadow: '0 0 4px rgba(42,245,255,0.4)' }}
      >
        {value}
      </span>
    </Motion.div>
  )
}

// ─── Default state for all controls — used by reset ─────────────────────────
// Keys match the control identifiers. Reset restores all values to these defaults.
const DEFAULT_VALUES = {
  'health-0': 60,
  'unlabeled-1': 60,
  'stability-2': 60,
  'unlabeled-3': 60,
  'alert-4': 60,
  'response-5': 60,
}

// ─── Single control row ──────────────────────────────────────────────────────
// State is lifted to the parent (SystemControlPanel) so Reset can restore all
// values at once from a single source of truth.
function ControlRow({ label, value, onValueChange, isGlitching }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {label && (
        <p
          className="text-lg font-medium uppercase tracking-wider"
          style={{
            fontFamily: MONO, color: RED,
            textShadow: '0 0 4px rgba(255,91,91,0.4)',
            letterSpacing: '0.72px',
          }}
        >
          {label}
        </p>
      )}
      <div className="flex gap-4 items-center w-full">
        <ProgressBar value={value} onValueChange={onValueChange} isGlitching={isGlitching} />
        <ValueBadge value={value} isGlitching={isGlitching} />
      </div>
    </div>
  )
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <div className="flex items-center w-full pb-3" style={{ borderBottom: '1px solid rgba(255,91,91,0.2)' }}>
      <p
        className="text-lg font-medium uppercase tracking-wider whitespace-nowrap"
        style={{
          fontFamily: MONO, color: 'white',
          textShadow: '0 0 4px rgba(75,196,203,0.4)',
          letterSpacing: '0.72px',
        }}
      >
        {title}
      </p>
    </div>
  )
}

// ─── Important popup ─────────────────────────────────────────────────────────
function ImportantPopup({ isVisible, onClose, isClosing }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <Motion.div
          className="flex flex-col gap-2 items-end flex-1 min-w-0 relative"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <div
            className="relative w-full overflow-hidden"
            style={{
              background: 'rgba(60,221,230,0.15)',
              border: `2px solid ${CYAN}`,
              boxShadow: `0 0 20px rgba(60,221,230,0.1), inset 0 0 30px rgba(60,221,230,0.05)`,
            }}
          >
            <CrtCloseEffect isClosing={isClosing} onComplete={() => {}} />
            <div className="relative z-0 flex flex-col gap-2.5 p-3">
              <div
                className="flex items-center justify-center pb-1.5 w-full"
                style={{ borderBottom: '1px solid rgba(60,221,230,0.2)' }}
              >
                <p
                  className="text-base font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{
                    fontFamily: MONO, color: CYAN,
                    textShadow: '0 0 4px rgba(60,221,230,0.4)',
                    letterSpacing: '0.64px',
                  }}
                >
                  important
                </p>
              </div>
              <p
                className="text-sm leading-normal"
                style={{
                  fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif",
                  color: 'white',
                  textShadow: '0 0 4px rgba(75,196,203,0.4)',
                }}
              >
                Configure core settings and defaults to define system operations.
                Adjust key parameters for stability and optimal performance.
              </p>
            </div>
          </div>

          {/* Close button — cut corners matching Figma node 1662:4275 */}
          <Motion.button
            onClick={onClose}
            className="relative flex gap-2 items-center justify-center border-0 bg-transparent cursor-pointer"
            style={{ width: 106, height: 32 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 106 32" fill="none" preserveAspectRatio="none" aria-hidden="true">
              <path d="M6 0.5 L105.5 0.5 L105.5 25.5 L100 31.5 L0.5 31.5 L0.5 6 Z" stroke="rgba(252,161,57,0.4)" strokeWidth="1" fill="rgba(252,161,57,0.05)" />
            </svg>
            <div
              className="relative rounded-full flex items-center justify-center"
              style={{ width: 14, height: 14, background: ORANGE, boxShadow: `0 0 6px ${ORANGE}` }}
            >
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden="true">
              <path
                d="M1 1L5 5M5 1L1 5"
                stroke="#1A0E00"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            </div>
            <span
              className="relative text-xs font-medium uppercase tracking-widest"
              style={{ fontFamily: MONO, color: ORANGE, letterSpacing: '1.04px' }}
            >
              close
            </span>
          </Motion.button>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Back button ─────────────────────────────────────────────────────────────
function PanelBackButton() {
  const navigate = useNavigate()

  return (
    <Motion.button
      onClick={() => navigate('/')}
      className="relative shrink-0 flex items-center justify-center border-0 bg-transparent cursor-pointer"
      style={{ width: 40, height: 40 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      aria-label="Go back"
    >
      <svg width="40" height="40" viewBox="0 0 41 41" fill="none">
        <path d="M8.5 0.5 L40.5 0.5 L40.5 32.5 L32.5 40.5 L0.5 40.5 L0.5 8.5 Z" stroke={RED} strokeWidth="1" fill="rgba(255,91,91,0.08)" />
        <path d="M24 13L16 20.5L24 28" stroke={RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Motion.button>
  )
}

// ─── Save / Reset buttons ────────────────────────────────────────────────────
// Save button has two modes:
//   isSaving=false → "SAVE CHANGES" (interactive)
//   isSaving=true  → "SAVING..." (disabled, reduced opacity)
function ActionButton({ label, variant = 'primary', onClick, disabled = false }) {
  const isPrimary = variant === 'primary'
  const color = isPrimary ? CYAN_BRIGHT : 'white'
  const borderColor = isPrimary ? CYAN : 'rgba(255,255,255,0.2)'

  return (
    <Motion.button
      onClick={disabled ? undefined : onClick}
      className="relative flex items-center justify-center border-0 bg-transparent"
      style={{
        width: 250, height: 44, fontFamily: MONO,
        cursor: disabled ? 'not-allowed' : 'pointer',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97, y: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      animate={{ opacity: disabled ? 0.6 : 1 }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 250 44" fill="none" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M10 0.5 L249.5 0.5 L249.5 33.5 L240 43.5 L0.5 43.5 L0.5 10 Z"
          stroke={borderColor} strokeWidth="1"
          fill={isPrimary ? 'rgba(42,245,255,0.05)' : 'rgba(255,255,255,0.02)'}
        />
      </svg>
      <span
        className="relative text-base font-medium uppercase tracking-widest whitespace-nowrap"
        style={{
          color,
          letterSpacing: '1.28px',
          textShadow: isPrimary ? '0 0 4px rgba(42,245,255,0.3)' : 'none',
        }}
      >
        {label}
      </span>
    </Motion.button>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function SystemControlPanel() {
  const [activeTab, setActiveTab] = useState(0)
  const [showPopup, setShowPopup] = useState(true)
  const [isClosingPopup, setIsClosingPopup] = useState(false)
  const [isGlitching, setIsGlitching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isBooting, setIsBooting] = useState(true)
  const [popupDismissed, setPopupDismissed] = useState(false)
  // Centralized control values — single source of truth for all bars.
  // Reset restores this entire object to DEFAULT_VALUES.
  const [values, setValues] = useState(DEFAULT_VALUES)
  const glitchTimeoutRef = useRef(null)

  // YouTube audio controller — shared between boot and save glitches
  const { iframeRef, play: playGlitchSound, stop: stopGlitchSound } = useGlitchAudio()

  // ── Page load boot glitch ──────────────────────────────────────────────────
  // STEP 1 (0–100ms): UI dimmed at opacity 0.8
  // STEP 2 (100–600ms): Boot glitch — scanlines, RGB shift, tearing, noise
  // STEP 3 (600–1000ms): Glitch fades, bloom flash, UI sharpens
  // STEP 4: Play sound at step 2 start (may be silent per browser autoplay policy)
  useEffect(() => {
    // Start boot glitch after a brief dim
    const bootTimer = setTimeout(() => {
      setIsGlitching(true)
      playGlitchSound()
    }, 100)

    // Resolve boot glitch
    const resolveTimer = setTimeout(() => {
      setIsGlitching(false)
      setIsBooting(false)
      stopGlitchSound()
    }, 1000)

    return () => {
      clearTimeout(bootTimer)
      clearTimeout(resolveTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current)
    }
  }, [])

  // ── Save Changes → enhanced glitch sequence ────────────────────────────────
  // State transitions:
  //   STEP 1 (0–100ms): isSaving=true, text → "SAVING...", button disabled
  //   STEP 2 (100ms): isGlitching=true, play YouTube SFX
  //   STEP 3 (100–900ms): intense distortion (GlitchOverlay handles animation)
  //   STEP 4 (900–1300ms): glitch resolves, bloom flash
  //   STEP 5 (1300ms): isGlitching=false, isSaving=false, button restored
  const handleSave = useCallback(() => {
    if (isSaving) return

    // STEP 1: immediate feedback — disable button, change text
    setIsSaving(true)

    // STEP 2: glitch starts after brief depress (100ms) + play sound
    setTimeout(() => {
      setIsGlitching(true)
      playGlitchSound()
    }, 100)

    // STEP 5: resolve — restore everything, stop audio
    glitchTimeoutRef.current = setTimeout(() => {
      setIsGlitching(false)
      setIsSaving(false)
      stopGlitchSound()
    }, 1300)
  }, [isSaving, playGlitchSound, stopGlitchSound])

  // ── Reset → restore all control values to defaults ─────────────────────────
  // All bars animate back smoothly via Framer Motion's width transition (300ms easeOut).
  const handleReset = useCallback(() => {
    setValues(DEFAULT_VALUES)
  }, [])

  // ── Close popup → CRT shutdown ─────────────────────────────────────────────
  const handleClosePopup = useCallback(() => {
    if (isClosingPopup) return
    setIsClosingPopup(true)

    setTimeout(() => {
      setShowPopup(false)
      setIsClosingPopup(false)
      setPopupDismissed(true)
    }, 750)
  }, [isClosingPopup])

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        fontFamily: MONO,
        backgroundImage: `linear-gradient(180deg, rgba(223,46,62,0.2) 0%, rgba(223,46,62,0.05) 70%, transparent 100%), linear-gradient(90deg, ${BG_DARK} 0%, ${BG_DARK} 100%)`,
      }}
    >
      <GridOverlay />
      <GlitchOverlay isActive={isGlitching} />

      {/* Hidden YouTube iframe for glitch SFX playback.
          Mounted once, src is swapped to trigger/restart audio.
          allow="autoplay" is required for programmatic playback. */}
      <iframe
        ref={iframeRef}
        src="about:blank"
        allow="autoplay"
        title="Glitch SFX"
        className="absolute"
        style={{ width: 0, height: 0, border: 'none', opacity: 0, pointerEvents: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Container — boot dim + glitch jitter.
          isBooting: starts at opacity 0.8, fades to 1 as boot resolves.
          isGlitching: jitters ±2px for data-sync displacement feel. */}
      <Motion.div
        className="relative z-10 max-w-[1200px] mx-auto"
        initial={{ opacity: 0.8 }}
        animate={{
          opacity: isBooting ? 0.8 : 1,
          x: isGlitching ? [0, jitter(0, 2), jitter(0, 2), jitter(0, 1.5), 0] : 0,
          y: isGlitching ? [0, jitter(0, 1), jitter(0, 0.5), 0] : 0,
        }}
        transition={{
          opacity: { duration: 0.4, ease: EASE_OUT },
          x: { duration: 0.6, delay: 0.1 },
          y: { duration: 0.6, delay: 0.1 },
        }}
      >
        {/* ── Top navigation bar ────────────────────────────────────────── */}
        <div
          className="flex items-end justify-between px-13 py-6"
          style={{ borderBottom: '1px solid rgba(255,91,91,0.2)' }}
        >
          <PanelBackButton />

          <div className="flex gap-6 items-center">
            {TABS.map((tab, i) => (
              <Motion.button
                key={tab}
                onClick={() => setActiveTab(i)}
                className="bg-transparent border-0 cursor-pointer p-0"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span
                  className="text-lg font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{
                    fontFamily: MONO,
                    color: i === activeTab ? CYAN : RED,
                    textShadow: i === activeTab
                      ? '0 0 4px rgba(60,221,230,0.4)'
                      : '0 0 4px rgba(255,91,91,0.4)',
                    letterSpacing: '0.72px',
                  }}
                >
                  {tab}
                </span>
              </Motion.button>
            ))}
          </div>

          <div className="w-10 h-10 shrink-0" />
        </div>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8 px-13 py-6">
          <div className="flex gap-13 items-start">
            <div className="flex flex-col gap-10 w-[710px] shrink-0">
              {PANEL_SECTIONS.map((section, si) => (
                <div key={si} className="flex flex-col gap-5 w-full">
                  <SectionHeader title={section.title} />
                  {section.controls.map((control, ci) => {
                    // Build a stable key matching DEFAULT_VALUES keys
                    const controlKey = control.label
                      ? `${control.label.toLowerCase().split(' ')[0]}-${si * 3 + ci}`
                      : `unlabeled-${si * 3 + ci}`
                    return (
                      <ControlRow
                        key={controlKey}
                        label={control.label}
                        value={values[controlKey] ?? control.defaultValue}
                        onValueChange={(v) => setValues((prev) => ({ ...prev, [controlKey]: v }))}
                        isGlitching={isGlitching}
                      />
                    )
                  })}
                </div>
              ))}
            </div>

            {!popupDismissed && (
              <ImportantPopup
                isVisible={showPopup}
                onClose={handleClosePopup}
                isClosing={isClosingPopup}
              />
            )}
          </div>

          {/* ── Action buttons ────────────────────────────────────────── */}
          <div className="flex gap-4 items-center">
            <ActionButton
              label={isSaving ? 'Saving...' : 'Save changes'}
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
            />
            <ActionButton
              label="reset"
              variant="secondary"
              onClick={handleReset}
            />
          </div>
        </div>
      </Motion.div>

      <div
        className="absolute right-14 top-24 bottom-0 w-px pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${RED} 0%, rgba(255,91,91,0.1) 50%, transparent 100%)`,
          opacity: 0.3,
        }}
        aria-hidden="true"
      />
    </div>
  )
}
