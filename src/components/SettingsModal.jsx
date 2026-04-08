import { useState, useCallback, useRef, useEffect } from 'react'
import { motion as Motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — extracted from Figma MCP node 1702:100393
// ═══════════════════════════════════════════════════════════════════════════════

const CYAN = '#27C3CC'
// Figma SVG: fill #20B2BA used for toggle ON + slider fill bar
const CYAN_FILL = '#20B2BA'
const CYAN_BORDER = 'rgba(42,245,255,0.19)'
const CYAN_GLOW = 'rgba(39,195,204,0.35)'
// Figma SVG (Vector 7820): fill var(--fill-0, #CA7E28)
const AMBER = '#CA7E28'
const BG_OVERLAY = 'rgba(4,4,5,0.88)'
// Figma SVG (Rectangle 161126549): fill var(--fill-0, #030B0B)
const BG_MODAL = '#030B0B'
// Figma SVG (Vector 7821 Reset): stroke white at 0.2 opacity
const RESET_BORDER = 'rgba(255,255,255,0.2)'
const WHITE = '#FFFFFF'
const BLACK = '#000000'
const FONT_BDO = "'BDO Grotesk', sans-serif"
const EASE_OUT = [0.22, 1, 0.36, 1]

const DEFAULTS = {
  flowLimit: 60,
  inputSensitivity: 68,
  injectionMode: 'manual',
  pressureControl: true,
  gyroAssist: true,
}

const INJECTION_MODES = ['manual', 'auto']


// ═══════════════════════════════════════════════════════════════════════════════
// CLIP-PATH SHAPES — derived from Figma MCP screenshots
//
// Every shape uses a clip-path polygon with pixel-based corner cuts.
// calc() ensures cuts remain constant regardless of element size.
// All diagonal cuts are 45° (equal X and Y distance).
//
// NO border-radius anywhere. All shapes are angular/chamfered.
// ═══════════════════════════════════════════════════════════════════════════════

// Modal container — Figma node 1702:100395 (800×764)
// All 4 corners chamfered at 45°. Cut size: 20px per axis.
const CLIP_MODAL = `polygon(
  20px 0, calc(100% - 20px) 0,
  100% 20px, 100% calc(100% - 20px),
  calc(100% - 20px) 100%, 20px 100%,
  0 calc(100% - 20px), 0 20px
)`

// Close button — Figma node 1702:100397 (40×40)
// All 4 corners chamfered. Cut size: 6px.
const CLIP_CLOSE = `polygon(
  6px 0, calc(100% - 6px) 0,
  100% 6px, 100% calc(100% - 6px),
  calc(100% - 6px) 100%, 6px 100%,
  0 calc(100% - 6px), 0 6px
)`

// Footer buttons (Reset / Save) — Figma SVG path: M0.5 9.13L10.5 0.5H250.5V35.87L240.5 44.5L0.5 44.5V9.13Z
// Top-left and bottom-right corners chamfered. Cut: 10px horizontal, 9px vertical.
const CLIP_BUTTON = `polygon(
  10px 0, 100% 0,
  100% calc(100% - 9px), calc(100% - 10px) 100%,
  0 100%, 0 9px
)`

// Toggle ON button — Figma SVG path (374×40, horizontally flipped via rotate-180 + scaleY-1):
// Original: M0 0H374V25.71L357 40H0V0Z → flipped = bottom-LEFT chamfer.
// Cut: 17px horizontal, 14px vertical (25.71→40 = 14.29px ≈ 14px).
const CLIP_TOGGLE_ON = `polygon(
  0 0, 100% 0,
  100% 100%, 17px 100%,
  0 calc(100% - 14px)
)`

// Toggle OFF button — Figma SVG path (374×40, no transform):
// M0 0H374V25.71L357 40H0V0Z → bottom-RIGHT chamfer.
// Cut: 17px horizontal, 14px vertical.
const CLIP_TOGGLE_OFF = `polygon(
  0 0, 100% 0,
  100% calc(100% - 14px), calc(100% - 17px) 100%,
  0 100%
)`

// Injection mode bar — Figma SVG path (760×40):
// M0 0H760V25.71L743.82 40H0V0Z → bottom-RIGHT chamfer.
// Cut: 16px horizontal, 14px vertical.
const CLIP_MODE_BAR = `polygon(
  0 0, 100% 0,
  100% calc(100% - 14px), calc(100% - 16px) 100%,
  0 100%
)`

// Slider track background — Figma SVG path (680×20):
// M0 0H680V11.67L669.08 20H0V0Z → bottom-right chamfer.
// Cut: 11px horizontal, 8px vertical.
const CLIP_SLIDER = `polygon(
  0 0, 100% 0,
  100% calc(100% - 8px), calc(100% - 11px) 100%,
  0 100%
)`

// Slider active fill — Figma SVG path (384×20):
// M0 0H384V11.67L376.16 20H0V0Z → bottom-right chamfer (same angle as track).
// Cut: 8px horizontal, 8px vertical.
const CLIP_FILL = `polygon(
  0 0, 100% 0,
  100% calc(100% - 8px), calc(100% - 8px) 100%,
  0 100%
)`

// Value badge — Figma SVG path (52×52):
// M0 13.42V0H51.65L52 39L39 52H0V13.42Z → rectangle with bottom-right 13px chamfer.
// From (100%, 75%) to (75%, 100%) = 13×13 diagonal cut.
const CLIP_BADGE = 'polygon(0 0, 100% 0, 100% 75%, 75% 100%, 0 100%)'


// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: ChamferShape — renders a clipped shape with optional border
//
// Border technique: two-layer clip-path stack.
// Outer layer (border div) extends 1px beyond inner layer via `inset: -1px`.
// Both layers use the same clip-path, so the border color "peeks through"
// on all edges (straight ~1px, diagonal ~1.4px ≈ √2).
// ═══════════════════════════════════════════════════════════════════════════════
function ChamferShape({ clipPath, fill, borderColor, children, className = '', style = {} }) {
  return (
    <div className={`relative ${className}`} style={style}>
      {borderColor && (
        <div
          className="absolute pointer-events-none"
          style={{ inset: -1, clipPath, backgroundColor: borderColor }}
        />
      )}
      <div
        className="relative w-full h-full"
        style={{ clipPath, backgroundColor: fill }}
      >
        {children}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Slider
//
// Track uses CLIP_SLIDER (bottom-right chamfer, 12px cut).
// Figma metadata (node 1702:100416): 60 tick marks at 12px spacing, 10px tall.
// Fill ends with arrow-shaped clip-path (CLIP_FILL).
// Thumb is invisible but provides 28px hit area.
// Fill follows drag with slight spring delay for premium feel.
// ═══════════════════════════════════════════════════════════════════════════════
function Slider({ label, value, onChange }) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  // Spring-driven fill value — follows actual value with slight delay
  // giving a premium "catch-up" feel during drag
  const fillMotion = useMotionValue(value)
  const fillSpring = useSpring(fillMotion, {
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  })

  useEffect(() => {
    fillMotion.set(value)
  }, [value, fillMotion])

  const getValueFromEvent = useCallback((e) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return value
    const x = e.clientX - rect.left
    return Math.round(Math.max(0, Math.min(100, (x / rect.width) * 100)))
  }, [value])

  const handlePointerDown = useCallback((e) => {
    setIsDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    onChange(getValueFromEvent(e))
  }, [getValueFromEvent, onChange])

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return
    onChange(getValueFromEvent(e))
  }, [isDragging, getValueFromEvent, onChange])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Figma: 60 ticks at 12px spacing, 10px tall, vertically centered in 20px track.
  // Tick frame (node 1702:100416) positioned at x=-21 within 666px track (708px total).
  // Each tick is a vertical stroke line (width=0, height=10) — rendered as 2px-wide divs.
  const TICK_COUNT = 60

  return (
    <div className="flex gap-[20px] items-end w-full">
      <div className="flex-1 flex flex-col gap-[10px] min-w-0">
        <p
          className="text-[18px] font-medium leading-[1.2]"
          style={{ fontFamily: FONT_BDO, color: WHITE }}
        >
          {label}
        </p>

        {/* Track container — p-[4px], total h-[28px] hit area */}
        <div
          ref={trackRef}
          className="relative w-full cursor-pointer select-none touch-none"
          style={{ padding: 4, height: 28 }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Track with chamfered bottom-right (CLIP_SLIDER: 12px cut)
               Contains tick marks in the background and cyan fill on top.
               Figma: track bg is rgba(39,195,204,0.06), ticks are rgba(39,195,204,0.18) */}
          <div className="relative w-full overflow-hidden" style={{ height: 20, clipPath: CLIP_SLIDER }}>
            {/* Inactive track background with tick marks
                 Figma node 1702:100416: 60 ticks, 12px spacing, 10px tall, centered.
                 Ticks hidden behind the active fill — only visible in unfilled zone. */}
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(42,245,255,0.1)' }}>
              {Array.from({ length: TICK_COUNT }, (_, i) => {
                // 12px spacing from Figma, offset by 3px to center within track
                const tickLeft = 3 + i * 12
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{
                      width: 2,
                      height: 10,
                      left: tickLeft,
                      backgroundColor: 'rgba(39,195,204,0.2)',
                    }}
                  />
                )
              })}
            </div>

            {/* Active fill — spring-driven width with bottom-right chamfer (CLIP_FILL).
                 Figma SVG: fill #20B2BA, bottom-right 8px chamfer matching track angle.
                 FillBar subscribes to spring motion value for 60fps updates. */}
            <FillBar fillSpring={fillSpring} isDragging={isDragging} />
          </div>

          {/* Thumb — invisible but h-[28px] full container height for hit area.
               Glow effect on drag via box-shadow. Spring bounce on release. */}
          <Motion.div
            className="absolute top-0"
            style={{
              left: `calc(${value}% - 6px)`,
              width: 12,
              height: 28,
              clipPath: CLIP_SLIDER,
              transition: isDragging ? 'none' : 'left 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
              // Thumb is transparent — fill arrow serves as visual indicator
              backgroundColor: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Value badge — 52×52 hexagonal amber shape (CLIP_BADGE)
           Figma node 1702:100480: pointy top/bottom hexagon */}
      <Motion.div
        className="relative flex items-center justify-center shrink-0"
        style={{ width: 52, height: 52 }}
        animate={{ scale: isDragging ? 1.06 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: AMBER, clipPath: CLIP_BADGE }} />
        {/* Glow ring on drag */}
        <Motion.div
          className="absolute inset-[-2px]"
          style={{ clipPath: CLIP_BADGE }}
          animate={{
            backgroundColor: isDragging ? 'rgba(235,158,69,0.3)' : 'rgba(235,158,69,0)',
          }}
          transition={{ duration: 0.2 }}
        />
        <span
          className="relative text-[18px] font-medium uppercase"
          style={{ fontFamily: FONT_BDO, color: BLACK }}
        >
          {value}%
        </span>
      </Motion.div>
    </div>
  )
}

// Separated fill bar component to properly subscribe to spring motion value
function FillBar({ fillSpring, isDragging }) {
  const ref = useRef(null)

  useEffect(() => {
    // Subscribe to spring value changes and update DOM directly for performance
    const unsubscribe = fillSpring.on('change', (v) => {
      if (ref.current) {
        ref.current.style.width = v + '%'
      }
    })
    return unsubscribe
  }, [fillSpring])

  return (
    <div
      ref={ref}
      className="absolute left-0 top-0 h-full"
      style={{
        width: fillSpring.get() + '%',
        backgroundColor: CYAN_FILL,
        // Figma SVG: fill bar has bottom-right chamfer matching track angle
        clipPath: CLIP_FILL,
        // Subtle glow when dragging
        boxShadow: isDragging
          ? `4px 0 12px ${CYAN_GLOW}`
          : 'none',
      }}
    />
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ModeSwitch — injection mode selector
//
// Bar uses CLIP_MODE_BAR (bottom-left chamfer, 14px cut).
// Border follows the chamfered shape via ChamferShape.
//
// Animation sequence on switch:
// 1. Text fades out + slides in exit direction
// 2. New value slides in from entry direction
// 3. Indicator underline animates scaleX: 0 → 1
// 4. Container border gives subtle glow pulse
// ═══════════════════════════════════════════════════════════════════════════════
function ModeSwitch({ label, value, onChange }) {
  const currentIndex = INJECTION_MODES.indexOf(value)
  const [direction, setDirection] = useState(0) // -1 = prev, 1 = next
  const [glowPulse, setGlowPulse] = useState(false)

  const handlePrev = useCallback(() => {
    setDirection(-1)
    setGlowPulse(true)
    const prev = (currentIndex - 1 + INJECTION_MODES.length) % INJECTION_MODES.length
    onChange(INJECTION_MODES[prev])
    setTimeout(() => setGlowPulse(false), 400)
  }, [currentIndex, onChange])

  const handleNext = useCallback(() => {
    setDirection(1)
    setGlowPulse(true)
    const next = (currentIndex + 1) % INJECTION_MODES.length
    onChange(INJECTION_MODES[next])
    setTimeout(() => setGlowPulse(false), 400)
  }, [currentIndex, onChange])

  return (
    <div className="flex flex-col gap-[10px] w-full">
      <p
        className="text-[18px] font-medium leading-[1.2]"
        style={{ fontFamily: FONT_BDO, color: WHITE }}
      >
        {label}
      </p>

      {/* Mode bar — chamfered bottom-left (CLIP_MODE_BAR: 14px cut).
           Glow pulse on mode change: border brightens briefly. */}
      <ChamferShape
        clipPath={CLIP_MODE_BAR}
        fill="rgba(39,195,204,0.03)"
        borderColor={glowPulse ? CYAN : CYAN_BORDER}
        style={{ height: 40, transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="flex items-center justify-between w-full h-full" style={{ padding: '10px 24px' }}>
          {/* Left arrow — hover: scale + glow, click: scale 0.9 */}
          <Motion.button
            type="button"
            className="relative z-10 flex items-center justify-center cursor-pointer"
            style={{ width: 24, height: 24 }}
            onClick={handlePrev}
            whileHover={{ scale: 1.15, filter: `drop-shadow(0 0 6px ${CYAN_GLOW})` }}
            whileTap={{ scale: 0.85 }}
            aria-label="Previous mode"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M8 2L2 8L8 14" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Motion.button>

          <div className="flex-1 flex flex-col items-center justify-center gap-[4px] overflow-hidden">
            {/* Text — directional slide animation.
                 Exit: fades out + slides in direction of change.
                 Enter: slides in from opposite side. */}
            <AnimatePresence mode="wait" initial={false}>
              <Motion.span
                key={value}
                className="text-[18px] font-medium capitalize"
                style={{ fontFamily: FONT_BDO, color: WHITE, lineHeight: '1.2' }}
                initial={{ opacity: 0, x: direction * 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -20 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
              >
                {value}
              </Motion.span>
            </AnimatePresence>

            {/* Indicator dots — w-[40px] h-[2px] each.
                 Active dot: full opacity with scaleX animation (0 → 1).
                 Inactive dot: 10% opacity. */}
            <div className="flex gap-[4px]">
              {INJECTION_MODES.map((m) => (
                <Motion.div
                  key={m}
                  style={{
                    width: 40,
                    height: 2,
                    backgroundColor: CYAN,
                    // scaleX animation: active underline grows from center
                    transformOrigin: 'center',
                  }}
                  animate={{
                    opacity: m === value ? 1 : 0.1,
                    scaleX: m === value ? 1 : 0.6,
                  }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                />
              ))}
            </div>
          </div>

          {/* Right arrow */}
          <Motion.button
            type="button"
            className="relative z-10 flex items-center justify-center cursor-pointer"
            style={{ width: 24, height: 24 }}
            onClick={handleNext}
            whileHover={{ scale: 1.15, filter: `drop-shadow(0 0 6px ${CYAN_GLOW})` }}
            whileTap={{ scale: 0.85 }}
            aria-label="Next mode"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M2 2L8 8L2 14" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Motion.button>
        </div>
      </ChamferShape>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ToggleSwitch — On/Off dual-button toggle
//
// ON button uses CLIP_TOGGLE_ON (bottom-left chamfer, 14px cut).
// OFF button uses CLIP_TOGGLE_OFF (bottom-right chamfer, 14px cut).
// Together they create a mirrored pair: [ON ◢] [◣ OFF]
//
// Animation on toggle:
// - Active side: scaleX 1 → 1.02 expansion + glow spread
// - Inactive side: fades slightly
// - Both use cubic-bezier(0.22, 1, 0.36, 1) for smooth transitions
// ═══════════════════════════════════════════════════════════════════════════════
function ToggleSwitch({ label, value, onChange }) {
  return (
    <div className="flex flex-col gap-[10px] w-full">
      <p
        className="text-[18px] font-medium leading-[1.2]"
        style={{ fontFamily: FONT_BDO, color: WHITE }}
      >
        {label}
      </p>

      <div className="flex gap-[12px] w-full">
        {/* ON button — CLIP_TOGGLE_ON: bottom-left chamfer, 14px cut.
             Active: cyan fill + scaleX expansion + glow.
             Inactive: dark bg + border outline + slight fade. */}
        <Motion.button
          type="button"
          className="flex-1 relative cursor-pointer"
          style={{ height: 40, fontFamily: FONT_BDO }}
          onClick={() => onChange(true)}
          // Active side expands slightly for premium feel
          animate={{
            scaleX: value ? 1.02 : 1,
            opacity: value ? 1 : 0.85,
          }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          whileHover={{ filter: `brightness(1.1)` }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Border layer — only visible when inactive */}
          {!value && (
            <div
              className="absolute pointer-events-none"
              style={{ inset: -1, clipPath: CLIP_TOGGLE_ON, backgroundColor: CYAN_BORDER }}
            />
          )}
          {/* Fill layer — cyan when active, dark when inactive */}
          <Motion.div
            className="relative w-full h-full flex items-center"
            style={{ clipPath: CLIP_TOGGLE_ON, padding: '10px 24px', justifyContent: 'center' }}
            animate={{
              // Figma SVG: ON fill=#20B2BA, OFF fill=rgba(39,195,204,0.03)
              backgroundColor: value ? CYAN_FILL : 'rgba(39,195,204,0.03)',
              boxShadow: value
                ? '0 0 20px rgba(39,195,204,0.3), inset 0 0 12px rgba(39,195,204,0.1)'
                : '0 0 0px transparent',
            }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <Motion.span
              className="relative text-[18px] font-medium leading-[1.2]"
              animate={{ color: value ? BLACK : WHITE }}
              transition={{ duration: 0.2 }}
            >
              On
            </Motion.span>
          </Motion.div>
        </Motion.button>

        {/* OFF button — CLIP_TOGGLE_OFF: bottom-right chamfer, 14px cut (mirror). */}
        <Motion.button
          type="button"
          className="flex-1 relative cursor-pointer"
          style={{ height: 40, fontFamily: FONT_BDO }}
          onClick={() => onChange(false)}
          animate={{
            scaleX: !value ? 1.02 : 1,
            opacity: !value ? 1 : 0.85,
          }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          whileHover={{ filter: `brightness(1.1)` }}
          whileTap={{ scale: 0.97 }}
        >
          {value && (
            <div
              className="absolute pointer-events-none"
              style={{ inset: -1, clipPath: CLIP_TOGGLE_OFF, backgroundColor: CYAN_BORDER }}
            />
          )}
          <Motion.div
            className="relative w-full h-full flex items-center"
            style={{ clipPath: CLIP_TOGGLE_OFF, padding: '10px 24px', justifyContent: 'center' }}
            animate={{
              // Figma SVG: ON fill=#20B2BA, OFF fill=rgba(39,195,204,0.03)
              backgroundColor: !value ? CYAN_FILL : 'rgba(39,195,204,0.03)',
              boxShadow: !value
                ? '0 0 20px rgba(39,195,204,0.3), inset 0 0 12px rgba(39,195,204,0.1)'
                : '0 0 0px transparent',
            }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
          >
            <Motion.span
              className="relative text-[18px] font-medium leading-[1.2]"
              animate={{ color: !value ? BLACK : WHITE }}
              transition={{ duration: 0.2 }}
            >
              Off
            </Motion.span>
          </Motion.div>
        </Motion.button>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ScanLines — horizontal scan line effect for save animation
//
// Renders subtle horizontal lines that sweep through the modal during save.
// Creates a "system processing" visual effect.
// ═══════════════════════════════════════════════════════════════════════════════
function ScanLines({ isActive }) {
  return (
    <AnimatePresence>
      {isActive && (
        <Motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 50 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Sweep line — moves top to bottom */}
          <Motion.div
            className="absolute left-0 w-full"
            style={{
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${CYAN} 30%, ${CYAN} 70%, transparent 100%)`,
              opacity: 0.4,
            }}
            initial={{ top: '-2px' }}
            animate={{ top: '100%' }}
            transition={{ duration: 0.8, ease: 'linear' }}
          />
          {/* Subtle horizontal scan pattern */}
          <Motion.div
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 3px,
                rgba(39,195,204,0.03) 3px,
                rgba(39,195,204,0.03) 4px
              )`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ duration: 0.8 }}
          />
        </Motion.div>
      )}
    </AnimatePresence>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: AmbientGlitch — subtle system interference overlay
//
// Creates a looping glitch effect that fires randomly every ~5s.
// Each glitch burst lasts 2–3 seconds, simulating:
// - horizontal distortion lines (repeating-linear-gradient)
// - slight RGB color shift via layered offsets
// - opacity flicker + translateX jitter
//
// The effect is deliberately subtle — it should feel like system
// interference on a spacecraft display, not a visual bug.
// ═══════════════════════════════════════════════════════════════════════════════
function AmbientGlitch() {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    // Glitch loop: fire every ~4–6 seconds (randomized), last 2–3 seconds
    let timeout
    function scheduleGlitch() {
      const delay = 4000 + Math.random() * 2000 // 4–6s between glitches
      timeout = setTimeout(() => {
        setIsGlitching(true)
        const duration = 2000 + Math.random() * 1000 // 2–3s glitch duration
        setTimeout(() => {
          setIsGlitching(false)
          scheduleGlitch()
        }, duration)
      }, delay)
    }
    scheduleGlitch()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <AnimatePresence>
      {isGlitching && (
        <Motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ zIndex: 40 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* Horizontal distortion lines — repeating gradient creates scan-line interference */}
          <Motion.div
            className="absolute inset-0"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(42,245,255,0.015) 2px,
                rgba(42,245,255,0.015) 3px
              )`,
            }}
            animate={{
              opacity: [0, 0.2, 0.05, 0.15, 0],
              // Horizontal jitter — tiny translateX shifts simulate signal instability
              x: [0, 1, -1, 0.5, 0],
            }}
            transition={{
              duration: 2.5,
              ease: 'linear',
              repeat: 0,
            }}
          />

          {/* RGB shift layer — very subtle cyan offset creates chromatic aberration.
               Offset by 1px with low opacity for believable CRT color fringing. */}
          <Motion.div
            className="absolute inset-0"
            style={{
              boxShadow: 'inset 1px 0 0 rgba(42,245,255,0.04), inset -1px 0 0 rgba(255,60,60,0.02)',
              mixBlendMode: 'screen',
            }}
            animate={{
              opacity: [0, 0.6, 0, 0.4, 0],
            }}
            transition={{
              duration: 2,
              ease: 'linear',
            }}
          />

          {/* Flicker band — a single bright line that sweeps through the modal */}
          <Motion.div
            className="absolute left-0 w-full"
            style={{
              height: 1,
              backgroundColor: 'rgba(42,245,255,0.08)',
            }}
            animate={{
              top: ['-1%', '101%'],
              opacity: [0, 0.3, 0],
            }}
            transition={{
              duration: 1.8,
              ease: 'linear',
            }}
          />
        </Motion.div>
      )}
    </AnimatePresence>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: SettingsModal
//
// Modal container uses CLIP_MODAL (all 4 corners chamfered, 20px cut).
// Close button uses CLIP_CLOSE (all 4 corners chamfered, 6px cut).
// Footer buttons use CLIP_BUTTON (opposing corners chamfered, 8px cut).
// Border follows shape via ChamferShape two-layer technique.
//
// Save animation sequence:
// Step 1: Button scale 0.96 + text → "SAVING..."
// Step 2: Scan lines sweep through modal + opacity flicker
// Step 3: Glow pulse on modal border + text → "SAVED ✓"
// Step 4: Revert to "SAVE CHANGES"
// ═══════════════════════════════════════════════════════════════════════════════
export function SettingsModal({ isOpen, onClose }) {
  const [flowLimit, setFlowLimit] = useState(DEFAULTS.flowLimit)
  const [inputSensitivity, setInputSensitivity] = useState(DEFAULTS.inputSensitivity)
  const [injectionMode, setInjectionMode] = useState(DEFAULTS.injectionMode)
  const [pressureControl, setPressureControl] = useState(DEFAULTS.pressureControl)
  const [gyroAssist, setGyroAssist] = useState(DEFAULTS.gyroAssist)

  // Save animation state machine: idle → saving → scanning → saved → idle
  const [saveState, setSaveState] = useState('idle')
  const [showScanLines, setShowScanLines] = useState(false)
  const [borderGlow, setBorderGlow] = useState(false)

  // CRT TV shutdown animation state.
  // When isClosing=true, the modal plays the vertical collapse animation
  // before calling onClose to actually unmount.
  const [isClosing, setIsClosing] = useState(false)

  // Trigger CRT shutdown, then call onClose after animation completes
  const triggerClose = useCallback(() => {
    if (isClosing) return
    setIsClosing(true)
    // Duration matches the CRT animation timing (450ms)
    setTimeout(() => {
      setIsClosing(false)
      onClose()
    }, 450)
  }, [isClosing, onClose])

  const handleReset = useCallback(() => {
    setFlowLimit(DEFAULTS.flowLimit)
    setInputSensitivity(DEFAULTS.inputSensitivity)
    setInjectionMode(DEFAULTS.injectionMode)
    setPressureControl(DEFAULTS.pressureControl)
    setGyroAssist(DEFAULTS.gyroAssist)
  }, [])

  // Multi-step save animation sequence
  const handleSave = useCallback(() => {
    if (saveState !== 'idle') return

    // Step 1: Button response — text changes to "SAVING..."
    setSaveState('saving')

    // Step 2: System effect — scan lines sweep through modal
    setTimeout(() => {
      setShowScanLines(true)
      setSaveState('scanning')
    }, 300)

    // Step 3: Confirmation — glow pulse + "SAVED ✓"
    setTimeout(() => {
      setShowScanLines(false)
      setBorderGlow(true)
      setSaveState('saved')
    }, 1100)

    // Step 4: Close modal — triggers CRT shutdown animation
    setTimeout(() => {
      setBorderGlow(false)
      setSaveState('idle')
      triggerClose()
    }, 2200)
  }, [saveState, triggerClose])

  const saveButtonText = {
    idle: 'Save changes',
    saving: 'Saving...',
    scanning: 'Saving...',
    saved: 'Saved ✓',
  }[saveState]

  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop — Figma: rgba(4,4,5,0.88)
               Outside click DISABLED — modal closes only via X button or Save. */}
          <Motion.div
            className="absolute inset-0"
            style={{ backgroundColor: BG_OVERLAY }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Modal panel — CLIP_MODAL: all 4 corners chamfered, 20px cut
               Open: scale 0.96→1, y 12→0 (350ms)
               Close: CRT TV shutdown effect driven by isClosing state.
               - scaleY collapses to 0 from center (vertical squeeze)
               - brightness flash simulates CRT phosphor bloom before collapse
               - scaleX narrows slightly to enhance the tube-off feel
               - opacity fades at tail for clean disappearance
               - cubic-bezier(0.77, 0, 0.18, 1) = aggressive ease for dramatic feel */}
          <Motion.div
            className="relative flex flex-col"
            style={{
              width: 800,
              overflow: 'hidden',
              transformOrigin: 'center center',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={
              isClosing
                ? {
                    // CRT shutdown: brightness flash → vertical collapse → disappear
                    scaleY: [1, 1.01, 0.02, 0],
                    scaleX: [1, 1.01, 0.7, 0.3],
                    opacity: [1, 1, 0.9, 0],
                    filter: [
                      'brightness(1)',
                      'brightness(1.8)',   // phosphor bloom flash
                      'brightness(1.3)',
                      'brightness(0)',
                    ],
                  }
                : {
                    opacity: saveState === 'scanning' ? [1, 0.92, 1, 0.96, 1] : 1,
                    scale: 1,
                    scaleY: 1,
                    scaleX: 1,
                    y: 0,
                    filter: 'brightness(1)',
                  }
            }
            exit={{ opacity: 0 }}
            transition={
              isClosing
                ? {
                    duration: 0.45,
                    ease: [0.77, 0, 0.18, 1],
                    times: [0, 0.12, 0.65, 1],
                  }
                : {
                    duration: saveState === 'scanning' ? 0.6 : 0.35,
                    ease: EASE_OUT,
                  }
            }
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scan lines overlay — appears during save animation step 2 */}
            <ScanLines isActive={showScanLines} />

            {/* Ambient glitch overlay — loops while modal is open.
                 Fires every ~5s with 2–3s duration per burst.
                 Creates subtle system interference feel. */}
            <AmbientGlitch />

            {/* Modal border layer — chamfered shape with border color fill.
                 Extends 1px beyond content to create visible border.
                 Glow pulse: border brightens to full cyan during save step 3. */}
            <Motion.div
              className="absolute pointer-events-none"
              style={{
                inset: -1,
                clipPath: CLIP_MODAL,
              }}
              animate={{
                backgroundColor: borderGlow ? CYAN : CYAN_BORDER,
                boxShadow: borderGlow
                  ? `0 0 30px ${CYAN_GLOW}, 0 0 60px rgba(39,195,204,0.15)`
                  : '0 0 0px transparent',
              }}
              transition={{ duration: 0.4, ease: EASE_OUT }}
            />

            {/* Modal content layer — chamfered shape with modal bg fill */}
            <div
              className="relative flex flex-col w-full"
              style={{
                clipPath: CLIP_MODAL,
                backgroundColor: BG_MODAL,
                boxShadow: '0 0 80px rgba(0,0,0,0.6), 0 0 20px rgba(39,195,204,0.04)',
              }}
            >

              {/* ═══ HEADER — p-[20px], justify-between ═══ */}
              <div className="flex items-center justify-between shrink-0 w-full" style={{ padding: 20 }}>

                {/* Close button — CLIP_CLOSE: all 4 corners chamfered, 6px cut */}
                <ChamferShape
                  clipPath={CLIP_CLOSE}
                  fill="transparent"
                  borderColor={CYAN_BORDER}
                  className="shrink-0"
                  style={{ width: 40, height: 40 }}
                >
                  <Motion.button
                    type="button"
                    className="w-full h-full flex items-center justify-center cursor-pointer"
                    onClick={triggerClose}
                    whileHover={{
                      filter: `drop-shadow(0 0 6px ${CYAN_GLOW})`,
                      scale: 1.05,
                    }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close settings"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1L13 13M13 1L1 13" stroke={CYAN} strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </Motion.button>
                </ChamferShape>

                <p
                  className="text-[22px] font-medium leading-[1.2] shrink-0"
                  style={{ fontFamily: FONT_BDO, color: WHITE }}
                >
                  SYSTEM CONFIGURATION
                </p>

                <div className="shrink-0" style={{ width: 40, height: 40 }} />
              </div>

              {/* ═══ CONTENT — p-[20px], gap-[32px] ═══ */}
              <div className="flex flex-col shrink-0 w-full" style={{ padding: 20, gap: 32 }}>

                {/* Section 1: Fuel Flow Control */}
                <div className="flex flex-col w-full" style={{ gap: 20 }}>
                  <div className="w-full" style={{ paddingBottom: 16, borderBottom: `1px solid ${CYAN_BORDER}` }}>
                    <p className="text-[20px] font-medium leading-[1.2]" style={{ fontFamily: FONT_BDO, color: WHITE }}>
                      Fuel Flow Control
                    </p>
                  </div>
                  <div className="flex flex-col w-full" style={{ gap: 24 }}>
                    <Slider label="Flow Limit" value={flowLimit} onChange={setFlowLimit} />
                    <ModeSwitch label="Injection Mode" value={injectionMode} onChange={setInjectionMode} />
                    <ToggleSwitch label="Pressure Control" value={pressureControl} onChange={setPressureControl} />
                  </div>
                </div>

                {/* Section 2: Control Sensitivity */}
                <div className="flex flex-col w-full" style={{ gap: 20 }}>
                  <div className="w-full" style={{ paddingBottom: 16, borderBottom: `1px solid ${CYAN_BORDER}` }}>
                    <p className="text-[20px] font-medium leading-[1.2]" style={{ fontFamily: FONT_BDO, color: WHITE }}>
                      Control Sensitivity
                    </p>
                  </div>
                  <div className="flex flex-col w-full" style={{ gap: 24 }}>
                    <Slider label="Input Sensitivity" value={inputSensitivity} onChange={setInputSensitivity} />
                    <ToggleSwitch label="Gyro Assist" value={gyroAssist} onChange={setGyroAssist} />
                  </div>
                </div>
              </div>

              {/* ═══ FOOTER — p-[20px], justify-end ═══ */}
              <div className="flex items-center justify-end shrink-0 w-full" style={{ padding: 20 }}>
                <div className="flex items-center" style={{ gap: 16 }}>

                  {/* ─── RESET BUTTON ───
                       Button colors updated using exact design values:
                       - background: #040F0F
                       - border: #275959
                       - text: #FFFFFF */}
                  <div className="relative" style={{ width: 250, height: 44 }}>
                    <div
                      className="absolute pointer-events-none"
                      style={{ inset: -1, clipPath: CLIP_BUTTON, backgroundColor: '#275959' }}
                    />
                    <Motion.button
                      type="button"
                      className="relative w-full h-full flex items-center justify-center cursor-pointer"
                      style={{
                        clipPath: CLIP_BUTTON,
                        backgroundColor: '#040F0F',
                        fontFamily: FONT_BDO,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                      }}
                      onClick={handleReset}
                      whileHover={{
                        backgroundColor: '#0A1A1A',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(39,195,204,0.08)',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span
                        className="text-[16px] font-medium uppercase leading-[1.2]"
                        style={{ color: '#FFFFFF' }}
                      >
                        Reset
                      </span>
                    </Motion.button>
                  </div>

                  {/* ─── SAVE CHANGES BUTTON ───
                       Button colors updated using exact design values:
                       - background: #001B1C
                       - border: #27C3CC
                       - text: #27C3CC */}
                  <div className="relative" style={{ width: 250, height: 44 }}>
                    <Motion.div
                      className="absolute pointer-events-none"
                      style={{ inset: -1, clipPath: CLIP_BUTTON }}
                      animate={{
                        backgroundColor: saveState === 'saved' ? '#2AF5FF' : '#27C3CC',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                    <Motion.button
                      type="button"
                      className="relative w-full h-full flex items-center justify-center cursor-pointer"
                      style={{
                        clipPath: CLIP_BUTTON,
                        fontFamily: FONT_BDO,
                      }}
                      onClick={handleSave}
                      animate={{
                        backgroundColor: saveState === 'saved' ? '#003538' : '#001B1C',
                        boxShadow: saveState === 'saved'
                          ? `inset 0 1px 0 rgba(42,245,255,0.25), inset 0 -1px 8px rgba(39,195,204,0.12), 0 0 24px ${CYAN_GLOW}`
                          : 'inset 0 1px 0 rgba(42,245,255,0.12), inset 0 -1px 4px rgba(39,195,204,0.04)',
                        scale: saveState === 'saving' || saveState === 'scanning' ? 0.96 : 1,
                      }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      whileHover={saveState === 'idle' ? {
                        backgroundColor: '#002A2B',
                        boxShadow: `inset 0 1px 0 rgba(42,245,255,0.2), inset 0 -1px 6px rgba(39,195,204,0.08), 0 0 16px ${CYAN_GLOW}`,
                      } : undefined}
                      whileTap={saveState === 'idle' ? { scale: 0.97 } : undefined}
                    >
                      <div
                        className="absolute inset-[1px] pointer-events-none"
                        style={{
                          clipPath: CLIP_BUTTON,
                          background: 'linear-gradient(180deg, rgba(42,245,255,0.03) 0%, transparent 100%)',
                        }}
                      />
                      <AnimatePresence mode="wait">
                        <Motion.span
                          key={saveButtonText}
                          className="relative text-[16px] font-medium uppercase leading-[1.2]"
                          style={{ color: '#27C3CC' }}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                        >
                          {saveButtonText}
                        </Motion.span>
                      </AnimatePresence>
                    </Motion.button>
                  </div>
                </div>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
