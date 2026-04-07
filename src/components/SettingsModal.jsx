import { useState, useCallback, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — extracted from Figma MCP node 1702:100393
// ═══════════════════════════════════════════════════════════════════════════════

const CYAN = '#27C3CC'
const CYAN_BORDER = 'rgba(42,245,255,0.19)'
const CYAN_GLOW = 'rgba(39,195,204,0.35)'
const AMBER = '#EB9E45'
const BG_OVERLAY = 'rgba(4,4,5,0.88)'
const BG_MODAL = '#0C1420'
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
// Screenshot shows equal diagonal cuts on every corner.
const CLIP_MODAL = `polygon(
  20px 0, calc(100% - 20px) 0,
  100% 20px, 100% calc(100% - 20px),
  calc(100% - 20px) 100%, 20px 100%,
  0 calc(100% - 20px), 0 20px
)`

// Close button — Figma node 1702:100397 (40×40)
// All 4 corners chamfered. Cut size: 6px.
// Screenshot shows a bordered square with chamfered corners and X icon.
const CLIP_CLOSE = `polygon(
  6px 0, calc(100% - 6px) 0,
  100% 6px, 100% calc(100% - 6px),
  calc(100% - 6px) 100%, 6px 100%,
  0 calc(100% - 6px), 0 6px
)`

// Footer buttons (Reset / Save) — Figma nodes 1702:100592 / 1702:100595 (250×44)
// Top-left and bottom-right corners chamfered. Cut size: 8px.
// Screenshot shows diagonal cuts on opposing corners (top-left, bottom-right).
const CLIP_BUTTON = `polygon(
  8px 0, 100% 0,
  100% calc(100% - 8px), calc(100% - 8px) 100%,
  0 100%, 0 8px
)`

// Toggle ON button — Figma node 1702:100499 (374×40)
// Bottom-left corner chamfered. Cut size: 14px.
// Screenshot shows cyan fill with a 45° cut at bottom-left only.
const CLIP_TOGGLE_ON = `polygon(
  0 0, 100% 0,
  100% 100%, 14px 100%,
  0 calc(100% - 14px)
)`

// Toggle OFF button — Figma node 1702:100502 (374×40)
// Bottom-right corner chamfered. Cut size: 14px.
// Screenshot shows dark bg with border, 45° cut at bottom-right (mirror of ON).
const CLIP_TOGGLE_OFF = `polygon(
  0 0, 100% 0,
  100% calc(100% - 14px), calc(100% - 14px) 100%,
  0 100%
)`

// Injection mode bar — Figma node 1702:100485 (760×40)
// Bottom-left corner chamfered. Cut size: 14px.
// Screenshot shows bordered bar with single 45° cut at bottom-left.
const CLIP_MODE_BAR = `polygon(
  0 0, 100% 0,
  100% 100%, 14px 100%,
  0 calc(100% - 14px)
)`

// Slider track — Figma node 1702:100414 (w×20)
// Bottom-right corner chamfered. Cut size: 12px.
// Screenshot shows cyan fill + tick marks with 45° cut at bottom-right.
const CLIP_SLIDER = `polygon(
  0 0, 100% 0,
  100% calc(100% - 12px), calc(100% - 12px) 100%,
  0 100%
)`

// Value badge — Figma node 1702:100480 (52×52)
// Vertical hexagon shape (pointy top/bottom, flat sides).
const CLIP_BADGE = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'


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
// Active fill is a child div inside the clipped track, automatically masked.
// Thumb is positioned at the cut boundary.
// ═══════════════════════════════════════════════════════════════════════════════
function Slider({ label, value, onChange }) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

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

  const TICK_COUNT = 24

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
               Contains tick marks in the background and cyan fill on top */}
          <div className="relative w-full overflow-hidden" style={{ height: 20, clipPath: CLIP_SLIDER }}>
            {/* Inactive track background — dark with tick marks */}
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(39,195,204,0.06)' }}>
              {Array.from({ length: TICK_COUNT }, (_, i) => {
                const tickPct = ((i + 1) / (TICK_COUNT + 1)) * 100
                return (
                  <div
                    key={i}
                    className="absolute h-[10px] top-1/2 -translate-y-1/2"
                    style={{
                      width: 2,
                      left: `${tickPct}%`,
                      backgroundColor: tickPct <= value ? 'transparent' : 'rgba(39,195,204,0.18)',
                    }}
                  />
                )
              })}
            </div>

            {/* Active fill — solid cyan, automatically clipped by parent CLIP_SLIDER */}
            <div
              className="absolute left-0 top-0 h-full"
              style={{
                width: `${value}%`,
                backgroundColor: CYAN,
                transition: isDragging ? 'none' : 'width 0.15s ease-out',
              }}
            />
          </div>

          {/* Thumb — h-[28px] full container height
               Micro-interaction: scale 1→1.12 on grab, spring bounce on release */}
          <Motion.div
            className="absolute top-0"
            style={{
              left: `calc(${value}% - 6px)`,
              width: 12,
              height: 28,
              backgroundColor: CYAN,
              clipPath: CLIP_SLIDER,
              boxShadow: isDragging
                ? `0 0 12px ${CYAN_GLOW}, 0 0 4px ${CYAN_GLOW}`
                : '0 0 4px rgba(39,195,204,0.15)',
              transition: isDragging ? 'none' : 'left 0.15s ease-out',
            }}
            animate={{ scale: isDragging ? 1.12 : 1 }}
            transition={isDragging
              ? { duration: 0.15 }
              : { type: 'spring', stiffness: 400, damping: 15 }
            }
          />
        </div>
      </div>

      {/* Value badge — 52×52 hexagonal amber shape (CLIP_BADGE) */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: 52, height: 52 }}>
        <div className="absolute inset-0" style={{ backgroundColor: AMBER, clipPath: CLIP_BADGE }} />
        <span
          className="relative text-[18px] font-medium uppercase"
          style={{ fontFamily: FONT_BDO, color: BLACK }}
        >
          {value}%
        </span>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ModeSwitch — injection mode selector
//
// Bar uses CLIP_MODE_BAR (bottom-left chamfer, 14px cut).
// Border follows the chamfered shape via ChamferShape.
// ═══════════════════════════════════════════════════════════════════════════════
function ModeSwitch({ label, value, onChange }) {
  const currentIndex = INJECTION_MODES.indexOf(value)

  const handlePrev = useCallback(() => {
    const prev = (currentIndex - 1 + INJECTION_MODES.length) % INJECTION_MODES.length
    onChange(INJECTION_MODES[prev])
  }, [currentIndex, onChange])

  const handleNext = useCallback(() => {
    const next = (currentIndex + 1) % INJECTION_MODES.length
    onChange(INJECTION_MODES[next])
  }, [currentIndex, onChange])

  return (
    <div className="flex flex-col gap-[10px] w-full">
      <p
        className="text-[18px] font-medium leading-[1.2]"
        style={{ fontFamily: FONT_BDO, color: WHITE }}
      >
        {label}
      </p>

      {/* Mode bar — chamfered bottom-left (CLIP_MODE_BAR: 14px cut) */}
      <ChamferShape
        clipPath={CLIP_MODE_BAR}
        fill="transparent"
        borderColor={CYAN_BORDER}
        style={{ height: 40 }}
      >
        <div className="flex items-center justify-between w-full h-full" style={{ padding: '10px 24px' }}>
          <Motion.button
            type="button"
            className="relative z-10 flex items-center justify-center cursor-pointer"
            style={{ width: 24, height: 24 }}
            onClick={handlePrev}
            whileHover={{ scale: 1.1, filter: `drop-shadow(0 0 4px ${CYAN_GLOW})` }}
            whileTap={{ scale: 0.9 }}
            aria-label="Previous mode"
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M8 2L2 8L8 14" stroke={CYAN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Motion.button>

          <div className="flex-1 flex flex-col items-center justify-center gap-[4px]">
            <AnimatePresence mode="wait">
              <Motion.span
                key={value}
                className="text-[18px] font-medium capitalize"
                style={{ fontFamily: FONT_BDO, color: WHITE, lineHeight: '1.2' }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
              >
                {value}
              </Motion.span>
            </AnimatePresence>

            {/* Indicator dots — w-[40px] h-[2px] each, active full, inactive 10% */}
            <div className="flex gap-[4px]">
              {INJECTION_MODES.map((m) => (
                <Motion.div
                  key={m}
                  style={{ width: 40, height: 2 }}
                  animate={{ backgroundColor: CYAN, opacity: m === value ? 1 : 0.1 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                />
              ))}
            </div>
          </div>

          <Motion.button
            type="button"
            className="relative z-10 flex items-center justify-center cursor-pointer"
            style={{ width: 24, height: 24 }}
            onClick={handleNext}
            whileHover={{ scale: 1.1, filter: `drop-shadow(0 0 4px ${CYAN_GLOW})` }}
            whileTap={{ scale: 0.9 }}
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
// Active state gets cyan fill, inactive gets bordered outline.
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
        {/* ON button — CLIP_TOGGLE_ON: bottom-left chamfer, 14px cut */}
        <Motion.button
          type="button"
          className="flex-1 relative cursor-pointer"
          style={{ height: 40, fontFamily: FONT_BDO }}
          onClick={() => onChange(true)}
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
            style={{ clipPath: CLIP_TOGGLE_ON, padding: '10px 24px' }}
            animate={{
              backgroundColor: value ? CYAN : BG_MODAL,
              boxShadow: value
                ? '0 0 16px rgba(39,195,204,0.25)'
                : '0 0 0px transparent',
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
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

        {/* OFF button — CLIP_TOGGLE_OFF: bottom-right chamfer, 14px cut */}
        <Motion.button
          type="button"
          className="flex-1 relative cursor-pointer"
          style={{ height: 40, fontFamily: FONT_BDO }}
          onClick={() => onChange(false)}
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
            style={{ clipPath: CLIP_TOGGLE_OFF, padding: '10px 24px' }}
            animate={{
              backgroundColor: !value ? CYAN : BG_MODAL,
              boxShadow: !value
                ? '0 0 16px rgba(39,195,204,0.25)'
                : '0 0 0px transparent',
            }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
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
// MAIN: SettingsModal
//
// Modal container uses CLIP_MODAL (all 4 corners chamfered, 20px cut).
// Close button uses CLIP_CLOSE (all 4 corners chamfered, 6px cut).
// Footer buttons use CLIP_BUTTON (opposing corners chamfered, 8px cut).
// Border follows shape via ChamferShape two-layer technique.
// ═══════════════════════════════════════════════════════════════════════════════
export function SettingsModal({ isOpen, onClose }) {
  const [flowLimit, setFlowLimit] = useState(DEFAULTS.flowLimit)
  const [inputSensitivity, setInputSensitivity] = useState(DEFAULTS.inputSensitivity)
  const [injectionMode, setInjectionMode] = useState(DEFAULTS.injectionMode)
  const [pressureControl, setPressureControl] = useState(DEFAULTS.pressureControl)
  const [gyroAssist, setGyroAssist] = useState(DEFAULTS.gyroAssist)

  const handleReset = useCallback(() => {
    setFlowLimit(DEFAULTS.flowLimit)
    setInputSensitivity(DEFAULTS.inputSensitivity)
    setInjectionMode(DEFAULTS.injectionMode)
    setPressureControl(DEFAULTS.pressureControl)
    setGyroAssist(DEFAULTS.gyroAssist)
  }, [])

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
          {/* Backdrop — Figma: rgba(4,4,5,0.88) */}
          <Motion.div
            className="absolute inset-0 cursor-pointer"
            style={{ backgroundColor: BG_OVERLAY }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Modal panel — CLIP_MODAL: all 4 corners chamfered, 20px cut
               Open: scale 0.96→1, y 12→0 (350ms)
               Close: reverse (250ms) */}
          <Motion.div
            className="relative flex flex-col"
            /* Modal is fixed size — no scrollbar. Content must fit inside exactly. */
            style={{
              width: 800,
              overflow: 'hidden',
            }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal border layer — chamfered shape with border color fill
                 Extends 1px beyond content layer to create visible border */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: -1,
                clipPath: CLIP_MODAL,
                backgroundColor: CYAN_BORDER,
              }}
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
                    onClick={onClose}
                    whileHover={{ filter: `drop-shadow(0 0 6px ${CYAN_GLOW})` }}
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

                  {/* RESET — CLIP_BUTTON: opposing corners chamfered, 8px cut */}
                  <ChamferShape
                    clipPath={CLIP_BUTTON}
                    fill="transparent"
                    borderColor={CYAN_BORDER}
                    style={{ width: 250, height: 44 }}
                  >
                    <Motion.button
                      type="button"
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ fontFamily: FONT_BDO, color: WHITE, padding: '16px 0' }}
                      onClick={handleReset}
                      whileHover={{ filter: `drop-shadow(0 0 8px rgba(39,195,204,0.15))` }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="text-[16px] font-medium uppercase leading-[1.2]">Reset</span>
                    </Motion.button>
                  </ChamferShape>

                  {/* SAVE — CLIP_BUTTON: same shape, cyan border */}
                  <ChamferShape
                    clipPath={CLIP_BUTTON}
                    fill="transparent"
                    borderColor={CYAN}
                    style={{ width: 250, height: 44 }}
                  >
                    <Motion.button
                      type="button"
                      className="w-full h-full flex items-center justify-center cursor-pointer"
                      style={{ fontFamily: FONT_BDO, color: CYAN, padding: '16px 0' }}
                      onClick={onClose}
                      whileHover={{
                        filter: `drop-shadow(0 0 10px ${CYAN_GLOW})`,
                        backgroundColor: 'rgba(39,195,204,0.05)',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="text-[16px] font-medium uppercase leading-[1.2]">Save changes</span>
                    </Motion.button>
                  </ChamferShape>
                </div>
              </div>
            </div>
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}
