import { useState, useCallback, useEffect, useRef } from 'react'
import { motion as Motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { SettingsModal } from '../components/SettingsModal'

// ─── Figma SVG assets ────────────────────────────────────────────────────────
import rocketSvg from '../assets/scan-shuttle/rocket.svg'
import topArcSvg from '../assets/scan-shuttle/top-arc.svg'
import topArcInnerSvg from '../assets/scan-shuttle/top-arc-inner.svg'
import rulerLeftSvg from '../assets/scan-shuttle/ruler-left.svg'
import rulerRightSvg from '../assets/scan-shuttle/ruler-right.svg'
import btnScanOutlineSvg from '../assets/scan-shuttle/btn-scan-outline.svg'
import backBtnSvg from '../assets/scan-shuttle/back-btn.svg'
import settingsBtnSvg from '../assets/scan-shuttle/settings-btn.svg'
import menuActiveBgSvg from '../assets/scan-shuttle/menu-active-bg.svg'
import menuInactiveBgSvg from '../assets/scan-shuttle/menu-inactive-bg.svg'
import menuArrowActiveSvg from '../assets/scan-shuttle/menu-arrow-active.svg'
import menuArrowInactiveSvg from '../assets/scan-shuttle/menu-arrow-inactive.svg'
// Figma node 1697:32347 — exact diagonal stripe mask exported as SVG
import headerStripesSvg from '../assets/scan-shuttle/header-stripes.svg'
// Fuel System assets
import btnOutlineSvg from '../assets/fuel-system/btn-outline.svg'

// ─── Design tokens (from Figma) ─────────────────────────────────────────────
const CYAN = '#27C3CC'
const CYAN_DIM = 'rgba(39,195,204,0.4)'
const CYAN_GLOW = 'rgba(39,195,204,0.6)'
const AMBER = '#EB9E45'
const BG_DARK = '#0A1019'
const WHITE = '#FFFFFF'
const WHITE_70 = 'rgba(255,255,255,0.7)'
const WHITE_60 = 'rgba(255,255,255,0.6)'
const FONT_BDO = "'BDO Grotesk', sans-serif"
const FONT_OXANIUM = "'Oxanium', sans-serif"
const FONT_MONO = "'Geist Mono Variable', 'Geist Mono', monospace"

// Easing
const EASE_OUT = [0.22, 1, 0.36, 1]

// ─── Menu items (from Figma design) ─────────────────────────────────────────
const MENU_ITEMS = [
  { code: '01', label: 'Space Shuttle Information' },
  { code: '02', label: 'Crew Status' },
  { code: '03', label: 'Fuel System' },
  { code: '04', label: 'Planetary Data' },
  { code: '05', label: 'Life Support' },
  { code: '06', label: 'Communication' },
  { code: '07', label: 'System Diagnostics' },
  { code: '08', label: 'Emergency Protocol' },
  { code: '09', label: 'Reporting' },
]

// ─── Telemetry data (from Figma) ────────────────────────────────────────────
const TELEMETRY_LEFT = [
  'ENGINE 01', 'FUEL LVL', 'HEAT', 'TEMP', 'MODE', 'FLOW RT', 'OXYGEN', 'CO2', 'THRUST',
]
const TELEMETRY_RIGHT = [
  'ACTIVE', '78%', 'NORMAL', '21°C', 'AUTO', '12.4', '19%', '3%', '78%',
]


// ─── Fuel System: design tokens ─────────────────────────────────────────────
const FUEL_COLOR = '#FCB900'
const CAN_STROKE = 'white'

const FUEL_TELEMETRY_LEFT = [
  'FUEL CONSUMPTION RATE',
  'ENGINE FEED STATUS',
  'FLOW VELOCITY',
  'BURN MODE',
]
const FUEL_TELEMETRY_RIGHT = [
  '12.4 L/MIN',
  'STABLE /',
  '3.1 M/S',
  'IDLE',
]

// ─── Jerry can SVG paths (from Figma node 1700:81193, viewBox 0 0 300 428) ──
const CAN_OUTLINE = 'M2.02234 81.6827L2.01062 69.2286C2.00996 67.3585 1.97308 65.3344 2.03602 63.4834L2.06922 62.7012C2.1548 61.0701 3.24098 59.1646 4.94129 57.5157C6.62991 55.878 8.67932 54.7341 10.3104 54.4512C13.0785 53.9711 16.9632 54.1999 20.119 54.2481H20.1229C23.5187 54.2896 26.9147 54.2946 30.3104 54.2618L30.3095 54.2608C50.1098 54.2226 70.1806 54.41 90.0067 54.3555C92.5626 54.4329 95.5368 53.7913 98.243 52.6446C100.944 51.5 103.521 49.7912 105.174 47.6172C109.235 42.2736 111.66 35.6584 114.126 29.4161C116.626 23.0865 119.178 17.1059 123.453 12.545C128.652 6.99789 136.687 4.0966 144.439 3.99712C153.442 4.26178 163.486 4.08061 172.474 4.0811H172.475L223.735 4.06645L241.378 4.06743H241.379C247.711 4.0634 254.209 3.78729 260.118 5.15727C261.658 5.51407 263.979 6.55792 266.275 7.877C268.425 9.11196 270.392 10.4949 271.546 11.6075L271.766 11.8262C276.639 16.8472 279.419 23.9944 282.071 30.9151L283.206 33.8604L291.481 55.3506C292.537 58.1418 293.988 61.5701 295.248 64.8077C296.539 68.1262 297.692 71.3932 298.298 74.1895L298.299 74.1905C298.372 74.5273 298.437 75.259 298.483 76.3086C298.528 77.3217 298.55 78.5338 298.56 79.7676C298.581 82.2457 298.551 84.7298 298.551 85.8545V104.954L298.469 169.498V169.501L298.593 395.687V395.688C298.595 397.69 298.639 400.319 298.258 401.962V401.963C296.95 407.608 293.513 413.569 289.408 417.619C285.081 421.889 280.624 424.732 274.757 425.858L274.756 425.859C270.291 426.718 265.096 426.492 260.24 426.499H260.241L239.108 426.484H239.107L155.79 426.47L67.7528 426.46H67.7518L41.8446 426.48H41.8397C37.4027 426.5 32.2518 426.808 28.1473 426.322H28.1464C15.3453 424.812 4.42485 413.478 2.19617 400.864C1.85646 398.941 1.79119 396.183 1.8241 393.259C1.85555 390.466 1.98438 387.299 1.995 385.106V385.102L2.0243 354.516V354.509L1.75769 289.456C1.75626 288.146 1.81422 286.807 1.87488 285.428C1.935 284.061 1.99805 282.655 2.00379 281.257C2.18158 266.298 2.15149 251.339 1.91297 236.382L1.79773 229.972C1.68232 223.214 1.8623 216.614 1.84266 209.82L2.04383 121.963V121.959L2.02234 81.6836V81.6827Z'
const CAP_PATH = 'M44.0091 0.669351C54.0742 0.398126 64.7382 0.319041 74.7364 1.13445C75.9441 1.23288 79.4378 4.12958 79.6441 5.23332C80.86 11.7412 80.3124 19.1008 80.3878 25.81C76.1312 25.8935 71.1831 25.7059 66.8743 25.6523C54.7958 25.9012 41.909 25.6855 29.7257 25.7877C29.8474 19.0608 29.6538 12.7793 29.977 5.99618C30.5566 4.98367 31.2636 4.05 32.0809 3.21798C35.2978 -0.0121827 39.5924 0.690177 44.0091 0.669351Z'
const NECK_PATH = 'M25.5965 32.1602C25.8633 32.1471 26.13 32.1352 26.3967 32.1252C30.3429 31.9703 34.702 32.1042 38.6884 32.1079L62.0052 32.1136L77.3786 32.1175C82.9891 32.1272 89.0552 31.2612 93.2743 35.5428C96.9081 39.2306 97.5112 41.8735 97.6553 46.818L84.9494 46.91C69.016 46.6559 52.6287 46.9283 36.64 46.9048L22.0215 46.8842C19.6831 46.883 14.7989 46.7635 12.738 47.1889C13.6675 38.4095 15.8239 33.0249 25.5965 32.1602Z'
const LIQUID_CLIP = 'M144.037 0C153.021 0.265027 163.025 0.0835466 172.059 0.0840424L223.32 0.0686722L240.962 0.069913C247.199 0.0659463 253.904 -0.219658 260.005 1.19473C263.471 1.99774 269.831 5.67813 272.313 8.23642C278.121 14.2197 281.058 23.071 284.04 30.7174L292.318 52.2128C294.449 57.8493 297.935 65.4377 299.194 71.2504C299.598 73.111 299.477 81.0086 299.477 83.1997V102.299L299.395 166.845L299.519 393.031C299.521 394.942 299.576 397.776 299.149 399.611C297.781 405.516 294.211 411.699 289.935 415.919C285.478 420.317 280.793 423.332 274.593 424.522C269.965 425.412 264.579 425.179 259.824 425.186L238.691 425.171L155.374 425.156L67.337 425.146L41.4299 425.166C37.1134 425.186 31.7868 425.498 27.5736 425C14.1236 423.413 2.77913 411.578 0.458381 398.443C-0.269673 394.322 0.214954 386.952 0.236768 382.445L0.266018 351.859L3.23661e-05 286.807C-0.00319021 284.114 0.235281 281.325 0.245941 278.586C0.448963 261.504 0.380545 244.422 0.0401912 227.343C-0.0753257 220.585 0.104643 213.891 0.0850593 207.162L0.285354 119.304L0.264036 79.0287L0.252386 66.5741C0.251642 64.4782 0.202557 62.0741 0.312868 59.9755C0.534482 55.7516 5.71638 51.1582 9.66528 50.4734C12.5968 49.9649 16.6868 50.2047 19.7232 50.251C23.1094 50.2924 26.4958 50.2966 29.882 50.2639C49.7833 50.2255 69.7217 50.4134 89.6275 50.3584C94.2787 50.5007 100.759 48.0051 103.689 44.1497C111.536 33.8248 113.113 18.5159 122.058 8.97175C127.564 3.09727 135.99 0.0959453 144.037 0Z'

// ─── Sine wave path generator for liquid surface ────────────────────────────
// Creates a smooth SVG path representing a liquid surface with wave motion.
//   y: base Y position     amplitude: wave height
//   frequency: wave peaks   phase: horizontal offset (animated)
function generateWavePath(y, amplitude, frequency, phase, width = 600) {
  const segments = 60
  const step = width / segments
  let path = `M ${-width / 2} ${y}`
  for (let i = 0; i <= segments; i++) {
    const x = -width / 2 + i * step
    const waveY = y + Math.sin((i / segments) * Math.PI * 2 * frequency + phase) * amplitude
    const wave2 = Math.sin((i / segments) * Math.PI * 2 * (frequency * 1.7) + phase * 0.6) * amplitude * 0.3
    path += ` L ${x} ${waveY + wave2}`
  }
  path += ` L ${width / 2} 500 L ${-width / 2} 500 Z`
  return path
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: FuelButton — "ADD MORE FUEL" with fill states
// ═══════════════════════════════════════════════════════════════════════════════
function FuelButton({ onClick, isFilling, isComplete }) {
  const label = isFilling ? 'FILLING...' : isComplete ? 'TANK FULL' : 'ADD MORE FUEL'
  return (
    <Motion.button
      type="button"
      className="relative w-[206px] h-[36px] cursor-pointer select-none"
      onClick={onClick}
      whileHover={!isFilling ? { scale: 1.03 } : {}}
      whileTap={!isFilling ? { scale: 0.97 } : {}}
      disabled={isFilling || isComplete}
      aria-label={label}
    >
      <img src={btnOutlineSvg} alt="" className="absolute inset-0 w-full h-full" />
      <Motion.div
        className="absolute inset-0 rounded-sm pointer-events-none"
        animate={{
          boxShadow: isFilling
            ? '0 0 20px rgba(252,185,0,0.3), inset 0 0 10px rgba(252,185,0,0.05)'
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.3 }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <Motion.span
            key={label}
            className="text-[12px] font-medium uppercase"
            style={{ fontFamily: FONT_BDO, color: CYAN }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </Motion.span>
        </AnimatePresence>
      </div>
    </Motion.button>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: FuelSystemView — interactive jerry can with drag physics
//
// Three interconnected systems:
//
// 1. DRAG → ROTATION MAPPING
//    Horizontal drag delta maps to can rotation (drag right = +deg, left = -deg).
//    Vertical drag adds slight Y translation. Both follow the cursor with DELAY
//    via useSpring, creating a "heavy object with inertia" feel.
//    Rotation is clamped to ±10° to prevent unrealistic tilt.
//
// 2. LIQUID REACTION LOGIC
//    Wave amplitude is driven by drag velocity (speed = sqrt(dx²+dy²)).
//    Fast drags produce strong waves (up to 20px amplitude), slow drags are subtle.
//    The wave phase direction is influenced by the can's tilt — liquid sloshes
//    opposite to the direction of movement, just like real physics.
//    During fill, amplitude spikes to simulate turbulence.
//
// 3. INERTIA SYSTEM
//    On release, useSpring overshoots past center (stiffness 200, damping 15)
//    creating a bounce-back effect. Wave amplitude decays at 0.92× per frame,
//    so liquid continues sloshing briefly after the can settles.
//    The spring's mass parameter (0.8) adds perceived weight.
// ═══════════════════════════════════════════════════════════════════════════════
function FuelSystemView({ fuelLevel, isFilling, isComplete, onAddFuel }) {
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  // ─── Animated counting display ────────────────────────────────────────
  // Direct DOM ref for the percentage text — updated in the same rAF loop
  // as waves so counting stays perfectly synced with liquid level.
  // No React re-renders per frame; only a state flip when reaching 100%.
  const percentTextRef = useRef(null)
  const [showFull, setShowFull] = useState(false)
  const fullTriggeredRef = useRef(false)

  // ─── Drag → rotation: motion values with spring physics ───────────────
  // Raw values track the cursor offset; springs add inertia + overshoot
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const rawRotate = useMotionValue(0)

  // Spring config: stiffness controls snap-back speed, damping controls overshoot
  // Low damping (15) = more bounce on release. Mass adds perceived weight.
  const springX = useSpring(rawX, { stiffness: 200, damping: 15, mass: 0.8 })
  const springY = useSpring(rawY, { stiffness: 200, damping: 15, mass: 0.8 })
  const springRotate = useSpring(rawRotate, { stiffness: 250, damping: 12, mass: 0.5 })

  // ─── Wave state (mutated per rAF frame — no React rerenders) ──────────
  const waveState = useRef({
    phase: 0,
    amplitude: 2,            // idle amplitude (subtle calm wave)
    targetAmplitude: 2,
    isDragging: false,
    lastX: 0,
    lastY: 0,
  })

  // Displayed fuel level (animated smoothly during fill)
  const displayLevelRef = useRef(fuelLevel)

  // Direct SVG refs for 60fps wave updates (no React rerender)
  const wave1Ref = useRef(null)
  const wave2Ref = useRef(null)
  const wave3Ref = useRef(null)
  const wave4Ref = useRef(null)

  // ─── Animated counting logic ──────────────────────────────────────────
  // Uses requestAnimationFrame to increment the displayed percentage
  // step-by-step (12 → 13 → 14 → ... → 100) with ease-out timing.
  // The ease-out cubic (1 - (1-t)^3) makes counting slower near the end,
  // avoiding a mechanical linear feel. The percentage text is updated via
  // direct DOM ref (percentTextRef) to avoid React re-renders per frame,
  // keeping wave animation and counting perfectly in sync.
  // When the count reaches 100, a React state flip (setShowFull) triggers
  // the "FULL" text transition with amber color + scale pop.
  useEffect(() => {
    if (fuelLevel === displayLevelRef.current) return
    const start = displayLevelRef.current
    const end = fuelLevel
    const duration = 1800 // ~1.8s fill — slightly longer for visible counting
    const startTime = performance.now()

    // Spike wave amplitude during fill (turbulence effect)
    waveState.current.targetAmplitude = 8

    function tick(now) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Ease-out cubic: fast start, slows near end — counting decelerates
      const eased = 1 - Math.pow(1 - t, 3)
      const current = start + (end - start) * eased
      displayLevelRef.current = current

      // ── Counting display: update DOM text directly (no re-render) ──
      // Math.round ensures we show whole numbers: 42 → 43 → 44 → ... → 100
      if (percentTextRef.current) {
        percentTextRef.current.textContent = `${Math.round(current)}% / 100%`
      }

      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        // Fill complete — settle waves and trigger "FULL" state if at 100
        waveState.current.targetAmplitude = 2
        if (Math.round(end) >= 100 && !fullTriggeredRef.current) {
          fullTriggeredRef.current = true
          setShowFull(true)
        }
      }
    }
    requestAnimationFrame(tick)
  }, [fuelLevel])

  // ─── Main animation loop (requestAnimationFrame) ──────────────────────
  useEffect(() => {
    function animate() {
      const ws = waveState.current
      const dt = 1 / 60

      // Phase advances for continuous wave motion
      ws.phase += dt * (1.2 + ws.amplitude * 0.15)

      // ── Inertia system: wave amplitude decay ──
      // When not dragging, amplitude lerps toward target (idle = 2).
      // Decay factor 0.92 per frame means waves persist ~0.5s after release,
      // creating the "liquid keeps sloshing" effect.
      if (!ws.isDragging) {
        ws.amplitude += (ws.targetAmplitude - ws.amplitude) * 0.04
        if (ws.amplitude > ws.targetAmplitude + 0.5) {
          ws.amplitude *= 0.92 // decay — wave energy dissipates per frame
        }
      }

      // Liquid surface Y — maps fuel level to can internal height
      // Can body spans y=105 (full) to y=425 (empty), 320px range
      const level = displayLevelRef.current
      const minY = 425
      const maxY = 105
      const baseY = minY - (level / 100) * (minY - maxY)

      // 4 wave layers at different opacities for depth
      const amp = ws.amplitude
      if (wave1Ref.current) wave1Ref.current.setAttribute('d', generateWavePath(baseY - 30, amp * 0.6, 1.2, ws.phase * 0.7))
      if (wave2Ref.current) wave2Ref.current.setAttribute('d', generateWavePath(baseY - 15, amp * 0.8, 1.5, ws.phase * 0.9))
      if (wave3Ref.current) wave3Ref.current.setAttribute('d', generateWavePath(baseY - 5, amp * 0.9, 1.8, ws.phase * 1.1))
      if (wave4Ref.current) wave4Ref.current.setAttribute('d', generateWavePath(baseY + 5, amp, 2.0, ws.phase))

      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // ─── Pointer handlers: unified drag for can movement + liquid ─────────
  const handlePointerDown = useCallback((e) => {
    const ws = waveState.current
    ws.isDragging = true
    ws.lastX = e.clientX
    ws.lastY = e.clientY
    containerRef.current?.setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e) => {
    const ws = waveState.current
    if (!ws.isDragging) return

    const dx = e.clientX - ws.lastX
    const dy = e.clientY - ws.lastY
    const speed = Math.sqrt(dx * dx + dy * dy)
    ws.lastX = e.clientX
    ws.lastY = e.clientY

    // ── Drag → rotation mapping ──
    // Horizontal delta directly maps to rotation angle.
    // Multiplier 0.15 keeps rotation proportional to drag distance.
    // Clamped to ±10° to prevent unrealistic tilt.
    const currentRotate = rawRotate.get()
    const newRotate = Math.max(-10, Math.min(10, currentRotate + dx * 0.15))
    rawRotate.set(newRotate)

    // ── Drag → translation (delayed by spring) ──
    // Small offset multipliers (0.3x, 0.15y) create "heavy object" feel.
    // The spring's inertia means the can lags behind the cursor.
    rawX.set(rawX.get() + dx * 0.3)
    rawY.set(rawY.get() + dy * 0.15)

    // ── Liquid reaction: velocity → wave amplitude ──
    // Higher drag speed = stronger waves. Clamped at 20 to prevent distortion.
    // Smooth blend (0.7/0.3) prevents jarring amplitude jumps.
    const mappedAmplitude = Math.min(2 + speed * 0.8, 20)
    ws.amplitude = ws.amplitude * 0.7 + mappedAmplitude * 0.3
    ws.targetAmplitude = mappedAmplitude
  }, [rawX, rawY, rawRotate])

  const handlePointerUp = useCallback((e) => {
    const ws = waveState.current
    ws.isDragging = false
    // Wave settles to idle — inertia carries briefly via 0.92 decay
    ws.targetAmplitude = 2
    // ── Spring return: setting to 0 triggers overshoot bounce-back ──
    // The spring (stiffness:200, damping:15) will overshoot past 0
    // then oscillate to rest — creating the "release bounce" effect.
    rawX.set(0)
    rawY.set(0)
    rawRotate.set(0)
    containerRef.current?.releasePointerCapture(e.pointerId)
  }, [rawX, rawY, rawRotate])

  return (
    <Motion.div
      className="flex-1 flex flex-col items-center gap-[20px] min-w-0 max-w-[700px]"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* Orbit / Mission header row */}
      <div className="flex items-center justify-between w-full" style={{ fontFamily: FONT_OXANIUM }}>
        <span className="text-[18px] font-medium uppercase" style={{ color: WHITE }}>
          ORBIT: LEO TRANSFER
        </span>
        <span className="text-[18px] font-medium uppercase text-right" style={{ color: WHITE }}>
          MISSION ID: B01-ARTEMIS
        </span>
      </div>

      {/* Main viewport — 650px tall, rulers + jerry can + telemetry */}
      <div className="relative w-full h-[650px] overflow-hidden">
        {/* Side rulers */}
        <div className="absolute left-0 top-0 w-[40px] h-[650px]">
          <img src={rulerLeftSvg} alt="" className="w-full h-full" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[40px] h-[650px]">
          <img src={rulerRightSvg} alt="" className="w-full h-full" />
        </div>

        {/* Telemetry labels — fuel-specific data */}
        <div className="absolute left-[52px] top-0 flex flex-col gap-[16px] opacity-70">
          {FUEL_TELEMETRY_LEFT.map((label) => (
            <p key={label} className="text-[15px] font-medium uppercase" style={{ fontFamily: FONT_OXANIUM, color: CYAN }}>
              {label}
            </p>
          ))}
        </div>
        {/* Right column values — right-aligned, no decorative line */}
        <div className="absolute right-[52px] top-0 flex flex-col gap-[16px] opacity-70">
          {FUEL_TELEMETRY_RIGHT.map((val, i) => (
            <p key={i} className="text-[15px] font-medium uppercase whitespace-nowrap text-right" style={{ fontFamily: FONT_OXANIUM, color: CYAN }}>
              {val}
            </p>
          ))}
        </div>

        {/* ── Interactive jerry can — the whole object moves on drag ── */}
        <div className="absolute left-1/2 top-[calc(50%-7px)] -translate-x-1/2 -translate-y-1/2">
          <Motion.div
            ref={containerRef}
            className="relative select-none touch-none"
            style={{
              width: 300,
              height: 428,
              cursor: 'grab',
              // Spring-driven transform: whole can moves + rotates on drag
              x: springX,
              y: springY,
              rotate: springRotate,
            }}
            // Hover micro-interaction: slight scale-up
            whileHover={{ scale: 1.03 }}
            whileTap={{ cursor: 'grabbing' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <svg viewBox="0 0 300 428" width="300" height="428" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="fuelCanClip">
                  <path d={LIQUID_CLIP} />
                </clipPath>
              </defs>

              {/* Liquid layers (clipped inside can body) — 4 layers for depth */}
              <g clipPath="url(#fuelCanClip)">
                <path ref={wave1Ref} fill={FUEL_COLOR} fillOpacity="0.265" />
                <path ref={wave2Ref} fill={FUEL_COLOR} fillOpacity="0.4" />
                <path ref={wave3Ref} fill={FUEL_COLOR} fillOpacity="0.53" />
                <path ref={wave4Ref} fill={FUEL_COLOR} fillOpacity="1" />
              </g>

              {/* Can outline (on top of liquid) */}
              <path d={CAN_OUTLINE} stroke={CAN_STROKE} strokeWidth="2.68" opacity="0.4" />
              <path d={CAP_PATH} fill={CAN_STROKE} opacity="0.4" />
              <path d={NECK_PATH} fill={CAN_STROKE} opacity="0.4" />

              {/* Structural lines */}
              <path d="M256 4C256 8.80572 256 286.002 256 424" stroke={CAN_STROKE} strokeWidth="2" opacity="0.4" />
              <path d="M40 56C40 60.2679 40 306.445 40 429" stroke={CAN_STROKE} strokeWidth="2" opacity="0.4" />
              <path d="M298 105C294.625 105 99.9269 105 3.00001 105" stroke={CAN_STROKE} strokeWidth="2" opacity="0.4" />

              {/* Measurement marks inside can body */}
              <g transform="translate(170, 118)" opacity="0.4">
                <path d="M0.75 0V12M0.75 6H87.75M87.75 0V12" stroke={CAN_STROKE} strokeWidth="1.5" />
                <path d="M23.75 74V86M23.75 80H87.75M87.75 74V86" stroke={CAN_STROKE} strokeWidth="1.5" />
                <path d="M0.75 148V160M0.75 154H87.75M87.75 148V160" stroke={CAN_STROKE} strokeWidth="1.5" />
                <path d="M23.75 222V234M23.75 228H87.75M87.75 222V234" stroke={CAN_STROKE} strokeWidth="1.5" />
              </g>

              {/* Highlight / reflection — subtle gradient overlay for glass-like feel */}
              <defs>
                <linearGradient id="canHighlight" x1="80" y1="60" x2="220" y2="420" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="white" stopOpacity="0.06" />
                  <stop offset="40%" stopColor="white" stopOpacity="0" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path d={CAN_OUTLINE} fill="url(#canHighlight)" />
            </svg>
          </Motion.div>
        </div>

        {/* Fuel percentage — animated counting display
             percentTextRef is updated via DOM in the rAF counting loop.
             When showFull triggers, AnimatePresence crossfades to "FULL"
             with amber color (#EB9E45) and a scale pop (1 → 1.1 → 1). */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[560px]">
          <AnimatePresence mode="wait">
            {showFull ? (
              <Motion.p
                key="full"
                className="text-[24px] font-semibold uppercase text-center"
                style={{ fontFamily: FONT_OXANIUM, color: AMBER }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: [1.1, 1] }}
                transition={{
                  opacity: { duration: 0.3 },
                  scale: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] },
                }}
              >
                FULL
              </Motion.p>
            ) : (
              <Motion.p
                key="counting"
                ref={percentTextRef}
                className="text-[24px] font-semibold uppercase text-center"
                style={{ fontFamily: FONT_OXANIUM, color: WHITE }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                {fuelLevel}% / 100%
              </Motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ADD MORE FUEL button */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
          <FuelButton onClick={onAddFuel} isFilling={isFilling} isComplete={isComplete} />
        </div>
      </div>
    </Motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Dot grid background (matching Figma ellipse pattern)
// ═══════════════════════════════════════════════════════════════════════════════
function DotGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Figma node 1696:13712 — dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 0.5px, transparent 0.5px)',
          backgroundSize: '12.5px 12.5px',
        }}
      />

      {/* Figma node 1696:23822 — inner ellipse: 952×952 at x:124 y:4 */}
      <div
        className="absolute rounded-full"
        style={{
          width: 952, height: 952,
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(39,195,204,0.06)',
        }}
      />
      {/* Figma node 1697:23836 — outer ellipse: 1222×1222 at x:-11 y:-131 */}
      <div
        className="absolute rounded-full"
        style={{
          width: 1222, height: 1222,
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(39,195,204,0.04)',
        }}
      />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Header — Figma node 1696:23796
// Exact values: px-[52px] py-[24px], stripe mask 1461×231 at opacity 0.2
// ═══════════════════════════════════════════════════════════════════════════════
function Header({ onBack, onSettings }) {
  return (
    <Motion.div
      // Figma: px-[52px] py-[24px], items-end, justify-between
      className="relative flex items-end justify-between px-[52px] py-[24px] overflow-hidden"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* Figma node 1697:32347 — "Mask group"
           Exact SVG: 1461.005×230.86px, vertically centered, opacity 0.2
           Contains real diagonal parallelogram stripes exported from Figma */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: 1461, height: 231 }}
      >
        <img src={headerStripesSvg} alt="" className="w-full h-full" />
      </div>

      {/* Figma node 1696:23797 — Back button 40×40 */}
      <button
        type="button"
        onClick={onBack}
        className="relative w-[40px] h-[40px] cursor-pointer shrink-0 group z-10"
        aria-label="Back to home"
      >
        <img
          src={backBtnSvg}
          alt=""
          className="absolute inset-0 w-full h-full transition-all duration-200 group-hover:drop-shadow-[0_0_6px_rgba(39,195,204,0.4)]"
        />
      </button>

      {/* Figma node 1696:23816 — Title gap-[12px], BDO Grotesk Medium 28px */}
      <div
        className="flex items-center gap-[12px] z-10"
        style={{ fontFamily: FONT_BDO }}
      >
        <span className="text-[28px] font-medium leading-[1.2]" style={{ color: CYAN }}>
          B-01
        </span>
        <span className="text-[28px] font-medium leading-[1.2]" style={{ color: WHITE }}>
          Artemis
        </span>
      </div>

      {/* Figma node 1699:51891 — Settings button 40×40 */}
      <button
        type="button"
        onClick={onSettings}
        className="relative w-[40px] h-[40px] cursor-pointer shrink-0 group z-10"
        aria-label="Settings"
      >
        <img
          src={settingsBtnSvg}
          alt=""
          className="absolute inset-0 w-full h-full transition-all duration-200 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
        />
      </button>
    </Motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Left menu — sci-fi module selector
// ═══════════════════════════════════════════════════════════════════════════════
function MenuItem({ item, isActive, isDisabled, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Motion.button
      type="button"
      // Figma: each menu item is 56px tall, 24px horizontal padding, 10px vertical
      // Disabled items: opacity 0.4, no pointer events — only index 0 and 2 are functional
      className="relative w-full h-[56px] flex items-center justify-between px-[24px] py-[10px] select-none shrink-0"
      style={{
        cursor: isDisabled ? 'default' : 'pointer',
        pointerEvents: isDisabled ? 'none' : 'auto',
      }}
      onClick={() => !isDisabled && onClick(index)}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index, ease: EASE_OUT }}
      whileTap={{ scale: 0.98 }}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Background shape — Figma SVG (440px wide, matching Figma exactly) */}
      <img
        src={isActive ? menuActiveBgSvg : menuInactiveBgSvg}
        alt=""
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[56px] w-[440px]"
        style={{ maxWidth: '100%', opacity: isDisabled ? 0.3 : 1 }}
      />

      {/* ── Hover shine effect ──
           Looping diagonal light sweep that continuously moves across
           the menu item while hovered. Uses a 45° gradient translating
           from left to right, repeating every ~1.5s for premium feel. */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <Motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Motion.div
              className="absolute top-0 left-0 h-full w-[60%]"
              style={{
                // Diagonal shine — 30° angle for premium sweep
                background: 'linear-gradient(110deg, transparent 20%, rgba(39,195,204,0.08) 45%, rgba(39,195,204,0.14) 50%, rgba(39,195,204,0.08) 55%, transparent 80%)',
              }}
              initial={{ x: '-100%' }}
              animate={{ x: '280%' }}
              transition={{
                // Continuous loop while hovered — ~1.5s per sweep
                duration: 1.5,
                ease: 'linear',
                repeat: Infinity,
                repeatDelay: 0.2,
              }}
            />
          </Motion.div>
        )}
      </AnimatePresence>

      {/* Text content — Figma: 22px BDO Grotesk Medium, 12px gap */}
      <div
        className="relative flex items-center gap-3"
        style={{ fontFamily: FONT_BDO }}
      >
        <span
          className="text-[22px] font-medium leading-[1.2]"
          style={{ color: isActive ? 'black' : isDisabled ? 'rgba(39,195,204,0.3)' : CYAN }}
        >
          {item.code}
        </span>
        <Motion.span
          className="text-[22px] font-medium leading-[1.2]"
          style={{ color: isActive ? 'black' : isDisabled ? 'rgba(255,255,255,0.25)' : WHITE }}
          animate={{
            textShadow: isHovered && !isActive
              ? '0 0 10px rgba(39,195,204,0.35)'
              : '0 0 0px transparent',
          }}
          transition={{ duration: 0.25 }}
        >
          {item.label}
        </Motion.span>
      </div>

      {/* Arrow icon — Figma: 24×24 */}
      <div className="relative w-[24px] h-[24px] shrink-0" style={{ opacity: isDisabled ? 0.3 : 1 }}>
        <img
          src={isActive ? menuArrowActiveSvg : menuArrowInactiveSvg}
          alt=""
          className="w-full h-full"
        />
      </div>
    </Motion.button>
  )
}

function LeftMenu({ activeIndex, onSelect }) {
  return (
    <Motion.nav
      // Figma: menu items stacked with ~16px gap, NOT stretched to fill.
      // 9 items × 56px = 504px, plus 8 gaps × 16px = 128px → total ~632px
      className="flex flex-col gap-[16px]"
      aria-label="System modules"
    >
      {/* Only index 0 (Space Shuttle) and 2 (Fuel System) are functional.
           All other menu items are disabled: opacity 0.4, pointer-events none. */}
      {MENU_ITEMS.map((item, i) => (
        <MenuItem
          key={item.code}
          item={item}
          isActive={activeIndex === i}
          isDisabled={i !== 0 && i !== 2}
          onClick={onSelect}
          index={i}
        />
      ))}
    </Motion.nav>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Scan line — fast looping cinematic scanner
//
// Instead of a single slow pass, the scan line rapidly sweeps
// top ↔ bottom in alternating passes (~1s each), looping continuously
// during the scanning state. This creates an "active system analyzing"
// feel rather than a one-time sweep.
//
// Timing: ~1s per pass × 5 passes = 5s total scan duration
// ═══════════════════════════════════════════════════════════════════════════════
function ScanLine({ isScanning }) {
  return (
    <AnimatePresence>
      {isScanning && (
        <Motion.div
          className="absolute left-0 right-0 pointer-events-none z-20"
          initial={{ top: '0%', opacity: 0 }}
          animate={{
            // Fast looping: top ↔ bottom, alternating direction
            top: ['0%', '100%'],
            opacity: [0, 1, 1, 1, 0],
          }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{
            top: {
              duration: 1,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'reverse',
            },
            opacity: {
              duration: 1,
              times: [0, 0.05, 0.5, 0.95, 1],
              repeat: Infinity,
              repeatType: 'reverse',
            },
          }}
        >
          {/* Main scan line — bright core with glow */}
          <div
            className="w-full h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent 2%, ${CYAN} 15%, ${CYAN} 85%, transparent 98%)`,
              boxShadow: `0 0 12px ${CYAN_GLOW}, 0 0 30px ${CYAN_DIM}, 0 0 60px rgba(39,195,204,0.15)`,
            }}
          />
          {/* Gradient trail above the line */}
          <div
            className="absolute bottom-[2px] left-0 right-0 h-[40px]"
            style={{
              background: `linear-gradient(to top, ${CYAN_DIM}, transparent)`,
            }}
          />
          {/* Subtle glow below */}
          <div
            className="absolute top-[2px] left-0 right-0 h-[20px]"
            style={{
              background: `linear-gradient(to bottom, rgba(39,195,204,0.15), transparent)`,
            }}
          />
        </Motion.div>
      )}
    </AnimatePresence>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Scan overlay — grid + pulsing brightness + blinking dots
//
// During looping scan, the overlay provides:
// 1. Measurement grid — static, visible while scanning
// 2. Pulsing brightness — gentle screen overlay that pulses with each pass
// 3. Blinking dots — randomly timed to create "analyzing details" feel
// ═══════════════════════════════════════════════════════════════════════════════
function ScanOverlay({ isScanning }) {
  return (
    <AnimatePresence>
      {isScanning && (
        <Motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          {/* Grid overlay — sci-fi measurement grid */}
          <Motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.08 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              backgroundImage: `
                linear-gradient(rgba(39,195,204,0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(39,195,204,0.3) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Pulsing brightness overlay — syncs with scan passes */}
          <Motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.02, 0.06, 0.02] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: `radial-gradient(ellipse at center, ${CYAN} 0%, transparent 70%)`,
              mixBlendMode: 'screen',
            }}
          />

          {/* Blinking analysis dots — random-timed pulses */}
          <ScanDots />
        </Motion.div>
      )}
    </AnimatePresence>
  )
}

// Blinking dots that pulse at different rates during scan — creates
// "system analyzing details" micro-feedback at fixed positions
function ScanDots() {
  const DOT_POSITIONS = [
    { x: '20%', y: '15%', dur: 0.8, del: 0 },
    { x: '75%', y: '25%', dur: 1.1, del: 0.3 },
    { x: '30%', y: '40%', dur: 0.9, del: 0.1 },
    { x: '65%', y: '55%', dur: 1.3, del: 0.5 },
    { x: '25%', y: '70%', dur: 0.7, del: 0.2 },
    { x: '70%', y: '82%', dur: 1.0, del: 0.4 },
    { x: '45%', y: '92%', dur: 0.85, del: 0.6 },
  ]

  return (
    <>
      {DOT_POSITIONS.map((dot, i) => (
        <Motion.div
          key={i}
          className="absolute w-[4px] h-[4px] rounded-full"
          style={{
            left: dot.x,
            top: dot.y,
            backgroundColor: CYAN,
            boxShadow: `0 0 6px ${CYAN}, 0 0 12px ${CYAN_DIM}`,
          }}
          animate={{ opacity: [0, 1, 0.5, 0] }}
          transition={{
            duration: dot.dur,
            delay: dot.del,
            repeat: Infinity,
            repeatDelay: dot.dur * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Completion flash — brief glow when scan finishes
// ═══════════════════════════════════════════════════════════════════════════════
function CompletionFlash({ trigger }) {
  return (
    <AnimatePresence>
      {trigger && (
        <Motion.div
          className="absolute inset-0 pointer-events-none z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            background: `radial-gradient(ellipse at center, ${CYAN_GLOW}, transparent 70%)`,
          }}
        />
      )}
    </AnimatePresence>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Scan button — "SCAN SHUTTLE" with states
// ═══════════════════════════════════════════════════════════════════════════════
function ScanButton({ isScanning, isComplete, onClick }) {
  const label = isComplete ? 'SCANNED ✓' : isScanning ? 'SCANNING...' : 'SCAN SHUTTLE'

  return (
    <Motion.button
      type="button"
      // Figma node 1697:32836 — exact: w-[206px] h-[36px], py-[12px]
      className="relative w-[206px] h-[36px] cursor-pointer select-none"
      onClick={onClick}
      whileHover={!isScanning && !isComplete ? { scale: 1.03 } : {}}
      whileTap={!isScanning && !isComplete ? { scale: 0.97 } : {}}
      disabled={isScanning}
      aria-label={label}
    >
      {/* Button outline — Figma SVG (stretched to larger container) */}
      <img
        src={btnScanOutlineSvg}
        alt=""
        className="absolute inset-0 w-full h-full"
      />

      {/* Hover glow — smooth transition between states */}
      <Motion.div
        className="absolute inset-0 rounded-sm pointer-events-none"
        animate={{
          boxShadow: isScanning
            ? `0 0 20px ${CYAN_DIM}, inset 0 0 10px rgba(39,195,204,0.06)`
            : isComplete
              ? `0 0 15px rgba(39,195,204,0.35)`
              : '0 0 0px transparent',
        }}
        transition={{ duration: 0.3, ease: EASE_OUT }}
      />

      {/* Figma node 1697:32838 — BDO Grotesk Medium, 12px, #27c3cc, uppercase */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <Motion.span
            key={label}
            className="text-[12px] font-medium uppercase"
            style={{ fontFamily: FONT_BDO, color: '#27c3cc' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
          >
            {label}
          </Motion.span>
        </AnimatePresence>
      </div>

      {/* Success pulse animation */}
      {isComplete && (
        <Motion.div
          className="absolute inset-0 rounded-sm pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1.2, repeat: 2, ease: 'easeInOut' }}
          style={{ border: `1px solid ${CYAN}` }}
        />
      )}
    </Motion.button>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Telemetry labels — left & right data columns
// ═══════════════════════════════════════════════════════════════════════════════
function TelemetryLabels({ scanPhase }) {
  const isRevealed = scanPhase === 'complete' || scanPhase === 'idle'

  return (
    <>
      {/* Figma node 1697:32738 — Left coordinate badge
           Exact: border 1px solid #27c3cc, opacity 0.6, px-[4px] py-[2px]
           Font: Oxanium Medium 14px, #27c3cc, uppercase */}
      <div
        className="absolute left-[52px] top-[107px] flex items-center justify-center px-[4px] py-[2px] opacity-60"
        style={{ border: '1px solid #27c3cc' }}
      >
        <span
          className="text-[14px] font-medium uppercase"
          style={{ fontFamily: FONT_OXANIUM, color: '#27c3cc' }}
        >
          20,7 N
        </span>
      </div>
      {/* Figma node 1697:32739 — Right coordinate badge
           Anchored from right edge to prevent overflow clipping */}
      <div
        className="absolute right-[52px] top-[107px] flex items-center justify-center px-[4px] py-[2px] opacity-60"
        style={{ border: '1px solid #27c3cc' }}
      >
        <span
          className="text-[14px] font-medium uppercase"
          style={{ fontFamily: FONT_OXANIUM, color: '#27c3cc' }}
        >
          88,4 W
        </span>
      </div>

      {/* Figma node 1697:32772 — Left column labels
           Exact: left-[52px] top-[149px] gap-[12px] opacity-70
           Font: Oxanium Medium 15px #27c3cc uppercase */}
      <div className="absolute left-[52px] top-[149px] flex flex-col gap-[12px] opacity-70">
        {TELEMETRY_LEFT.map((label, i) => (
          <Motion.p
            key={label}
            className="text-[15px] font-medium uppercase"
            style={{ fontFamily: FONT_OXANIUM, color: '#27c3cc' }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: isRevealed ? 1 : 0, x: isRevealed ? 0 : -8 }}
            transition={{ duration: 0.3, delay: scanPhase === 'complete' ? 0.05 * i : 0 }}
          >
            {label}
          </Motion.p>
        ))}
      </div>

      {/* Right column values — layout fix: anchored from RIGHT edge to prevent
           overflow clipping. Flex row [line][text] ensures text sits BESIDE the
           line, never overlapping. right-[52px] keeps content inside the viewport
           boundary (40px ruler + 12px gap from right edge). */}
      <div className="absolute right-[52px] top-[149px] flex flex-col gap-[12px] opacity-70">
        {TELEMETRY_RIGHT.map((val, i) => (
          <Motion.div
            key={i}
            className="flex items-center gap-[8px]"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: isRevealed ? 1 : 0, x: isRevealed ? 0 : 8 }}
            transition={{ duration: 0.3, delay: scanPhase === 'complete' ? 0.05 * i : 0 }}
          >
            <div className="w-[16px] h-[1px] shrink-0" style={{ backgroundColor: 'rgba(39,195,204,0.4)' }} />
            <span
              className="text-[15px] font-medium uppercase whitespace-nowrap"
              style={{ fontFamily: FONT_OXANIUM, color: '#27c3cc' }}
            >
              {val}
            </span>
          </Motion.div>
        ))}
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Shuttle viewport — rocket + rulers + arcs + scan effects
//
// This is the central visual area containing:
// 1. Top arc decorations (Figma SVG)
// 2. Side measurement rulers (Figma SVG)
// 3. Rocket SVG (Figma export — full vector paths)
// 4. Scan line overlay
// 5. Scan brightness mask
// 6. Blinking analysis dots
// 7. Completion flash
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// Nozzle offset from rocket center (SVG geometry):
// Left nozzle x=128, Right x=195, Center x=161.5 → offset = 33.5px symmetric
const NOZZLE_OFFSET_X = 33.5


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: NozzleFlame — small rounded flame at one nozzle opening
//
// Compact, rounded-bottom flame with orange→yellow→white gradient.
// Left and right flames have slightly offset animation timing so they
// feel independent and organic (like two separate engines, not one).
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: NozzleFlame — single flame element (no positioning, parent handles layout)
//
// Renders the animated teardrop flame SVG with gradient.
// Position is controlled by the flex container in RocketFlame, not by this component.
// ═══════════════════════════════════════════════════════════════════════════════
// Two flame states:
// - idle: small, subtle pilot flame — gentle flicker, low opacity, barely visible
// - launching (anticipation/ignition/launch): progressively bigger and more dynamic
function NozzleFlame({ launchPhase, side }) {
  const isIdle = launchPhase === 'idle' || launchPhase === 'fadeUI' || launchPhase === 'done'
  const isThrusting = launchPhase === 'launch'
  const isIgnition = launchPhase === 'ignition'
  const isBuilding = launchPhase === 'anticipation'

  const gradId = `nozzleGrad_${side}`
  const coreId = `nozzleCore_${side}`
  const delayOffset = side === 'right' ? 0.08 : 0

  // Idle flame: engine is ON — stable, clearly visible, but calmer than launch.
  // Size is close to anticipation baseline so the transition feels natural.
  const opacityVal = isIdle
    ? [0.55, 0.7, 0.6]         // idle: bright enough to read as "engine running"
    : isBuilding
      ? [0.6, 0.85, 0.65]      // anticipation: intensifying
      : [0.85, 1, 0.9]         // ignition/launch: full intensity

  // Launch animation: ONLY scaleY (vertical stretch downward).
  // NO scaleX animation — width is FIXED at idle value for all states.
  // Flame stretches from top center anchor, extending the bottom edge only.
  const scaleYVal = isThrusting
    ? [1.0, 1.4, 1.1, 1.35]    // launch: tall stretching pulse
    : isIgnition
      ? [0.5, 0.8, 0.55]       // ignition: height ramps up
      : isBuilding
        ? [0.4, 0.5, 0.45]     // anticipation: holds idle height
        : [0.4, 0.5, 0.45]     // idle: base state (DO NOT CHANGE)

  // Idle breathes slowly (2.5s), launch phases pulse faster
  const duration = isThrusting ? 0.35 : isIgnition ? 0.5 : isBuilding ? 0.7 : 2.5

  return (
    <Motion.div
      key={`nozzle_flame_${side}`}
      className={`${side}-nozzle pointer-events-none`}
      style={{
        width: 44,
        height: 60,
        // Fixed transformOrigin: top center — scaleY stretches DOWNWARD only.
        transformOrigin: 'top center',
        // Fixed scaleX at idle value — width NEVER changes between states.
        // This is in style (not animate) so it cannot be animated.
        transform: 'scaleX(0.96)',
      }}
      // NO scaleX in initial or animate — width is FIXED via style.
      initial={{ opacity: 0.55, scaleY: 0.4 }}
      animate={{
        opacity: opacityVal,
        scaleY: scaleYVal,
        // NO scaleX — width never changes between idle and launch.
        // NO x, y, translate — position never changes.
        // ONLY scaleY → flame stretches downward from fixed top anchor.
      }}
      transition={{
        duration,
        delay: delayOffset,
        repeat: Infinity,
        repeatType: 'mirror',
        ease: 'easeInOut',
        scaleY: {
          duration: isIdle ? 2.5 : duration * 1.5,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: [0.4, 0, 0.2, 1],
        },
      }}
    >
      <svg viewBox="0 0 44 60" fill="none" className="w-full h-full">
        <defs>
          <radialGradient id={gradId} cx="50%" cy="25%" r="55%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#FFB84D" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#FF6B1A" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FF3300" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={coreId} cx="50%" cy="20%" r="30%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="60%" stopColor="#FFE066" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="22" cy="18" rx="20" ry="28" fill={`url(#${gradId})`} />
        <ellipse cx="22" cy="14" rx="9" ry="16" fill={`url(#${coreId})`} />
      </svg>
    </Motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ExhaustTrail — Duolingo-style wavy trailing exhaust
//
// Creates layered organic blobs that flow downward with wavy skew motion.
// 3 layers with staggered size, delay, and opacity create depth and life.
//
// Each layer animates:
//   - scaleY: breathes vertically (1 → 1.4 → 1)
//   - skewX: sways left/right (0° → 3° → -3° → 0°) for organic waviness
//   - translateY: drifts downward (0 → 20px) simulating exhaust flow
//   - opacity: flickers softly (0.7 → 1 → 0.6)
//
// The combination of these on offset timings gives a flowing,
// alive feel — playful but controlled, like Duolingo animations.
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: ExhaustTrail — wavy trailing blobs below one nozzle
//
// No absolute positioning — parent flex container handles side-by-side layout.
// Each trail is a stack of 3 blurred layers with staggered animation.
// ═══════════════════════════════════════════════════════════════════════════════
function ExhaustTrail({ launchPhase, side }) {
  const isVisible = launchPhase === 'ignition' || launchPhase === 'launch'
  const isThrusting = launchPhase === 'launch'

  const layers = [
    { width: 36, height: 90, delay: 0, opacity: [0.6, 0.85, 0.55], blur: 4 },
    { width: 50, height: 130, delay: 0.12, opacity: [0.35, 0.55, 0.3], blur: 8 },
    { width: 64, height: 170, delay: 0.25, opacity: [0.15, 0.3, 0.12], blur: 14 },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <div
          key={`trail_container_${side}`}
          className={`${side}-nozzle-trail pointer-events-none relative`}
          style={{ width: 64, marginTop: 4 }}
        >
          {layers.map((layer, i) => (
            <Motion.div
              key={`trail_${side}_${i}`}
              className="absolute pointer-events-none"
              style={{
                width: layer.width,
                height: layer.height,
                left: '50%',
                top: i * 10,
                transform: `translateX(-50%)`,
                transformOrigin: 'top center',
                filter: `blur(${layer.blur}px)`,
              }}
              initial={{ opacity: 0, scaleY: 0.2 }}
              animate={{
                // ONLY scaleY + opacity — no y, no x, no skewX.
                // Trail stretches downward from its top anchor, same as flame.
                // No position movement = no visual jumping.
                scaleY: isThrusting ? [1, 1.4, 1.1, 1.35] : [0.6, 0.9, 0.65],
                opacity: layer.opacity,
              }}
              exit={{ opacity: 0, scaleY: 0, transition: { duration: 0.3 } }}
              transition={{
                duration: isThrusting ? 1.2 : 1.5,
                delay: layer.delay,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
            >
              <svg
                viewBox={`0 0 ${layer.width} ${layer.height}`}
                fill="none"
                className="w-full h-full"
              >
                <defs>
                  <radialGradient id={`trail_${side}_${i}`} cx="50%" cy="20%" r="60%">
                    <stop offset="0%" stopColor="#FF8C42" stopOpacity="0.7" />
                    <stop offset="50%" stopColor="#FF6B1A" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#CC3300" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <ellipse
                  cx={layer.width / 2}
                  cy={layer.height * 0.35}
                  rx={layer.width / 2 - 2}
                  ry={layer.height * 0.45}
                  fill={`url(#trail_${side}_${i})`}
                />
              </svg>
            </Motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: RocketFlame — dual flames placed side-by-side using flex layout
//
// Fix: flames are in a flex row with explicit gap to force separation.
// This guarantees both left and right flames are always visible and never
// overlap each other. The container is centered below the rocket.
// ═══════════════════════════════════════════════════════════════════════════════
function RocketFlame({ launchPhase }) {
  // Always visible — idle shows small pilot flames, launch phases grow them
  const isLaunching = launchPhase === 'anticipation' || launchPhase === 'ignition' || launchPhase === 'launch'

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        // Flame top sits just below the rocket container bottom.
        // -10px pushes it slightly lower so it starts at the nozzle exit,
        // not inside the nozzle cone.
        bottom: -55,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        // Nozzle center-to-center = 67px (SVG: left x=128, right x=195).
        // Flame width = 38px. Gap = 67 - 38 = 29px.
        gap: 27,
        zIndex: 20,
      }}
    >
      {/* LEFT nozzle — inner glow + flame + trail
           Glow has two states:
           - idle: very dim (0.1 opacity), barely perceptible warmth
           - launching: bright pulsing (0.5–0.9 opacity) */}
      <div className="left-nozzle flex flex-col items-center relative">
        <Motion.div
          className="pointer-events-none"
          style={{
            width: 36,
            height: 24,
            marginBottom: -10,
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255,180,77,0.5) 0%, rgba(255,120,30,0.2) 50%, transparent 100%)',
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: isLaunching ? [0.5, 0.9, 0.6, 0.85] : [0.12, 0.2, 0.14],
          }}
          transition={{ duration: isLaunching ? 0.5 : 2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <NozzleFlame key="flame_left" launchPhase={launchPhase} side="left" />
        <ExhaustTrail key="trail_left" launchPhase={launchPhase} side="left" />
      </div>

      {/* RIGHT nozzle — inner glow + flame + trail */}
      <div className="right-nozzle flex flex-col items-center relative">
        <Motion.div
          className="pointer-events-none"
          style={{
            width: 36,
            height: 24,
            marginBottom: -10,
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255,180,77,0.5) 0%, rgba(255,120,30,0.2) 50%, transparent 100%)',
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: isLaunching ? [0.5, 0.9, 0.6, 0.85] : [0.12, 0.2, 0.14],
          }}
          transition={{ duration: isLaunching ? 0.5 : 2, delay: 0.08, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <NozzleFlame key="flame_right" launchPhase={launchPhase} side="right" />
        <ExhaustTrail key="trail_right" launchPhase={launchPhase} side="right" />
      </div>
    </div>
  )
}


function ShuttleViewport({
  isScanning,
  scanPhase,
  showFlash,
  launchPhase,
}) {
  // During launch, surrounding UI elements fade out
  const isLaunchActive = launchPhase === 'fadeUI' || launchPhase === 'anticipation'
    || launchPhase === 'ignition' || launchPhase === 'launch' || launchPhase === 'done'

  return (
    <div className="relative w-full h-[650px] overflow-hidden">
      {/* ─── Surrounding UI: arc, rulers, labels ───
           Fade out during launch sequence (Step 1) */}
      <Motion.div
        animate={{
          opacity: isLaunchActive ? 0 : 1,
          y: isLaunchActive ? 10 : 0,
        }}
        transition={{ duration: 0.8, ease: EASE_OUT }}
      >
        {/* Top arc decoration — outer */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[507px] h-[95px]">
          <img src={topArcSvg} alt="" className="w-full h-full" />
        </div>
        {/* Top arc decoration — inner with ticks (60% opacity) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[5px] w-[507px] h-[80px] opacity-60">
          <img src={topArcInnerSvg} alt="" className="w-full h-full" />
        </div>
        {/* Left ruler */}
        <div className="absolute left-0 top-0 w-[40px] h-[650px]">
          <img src={rulerLeftSvg} alt="" className="w-full h-full" />
        </div>
        {/* Right ruler */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[40px] h-[650px]">
          <img src={rulerRightSvg} alt="" className="w-full h-full" />
        </div>
        {/* Telemetry labels */}
        <TelemetryLabels scanPhase={scanPhase} />
      </Motion.div>

      {/* ─── Rocket container ─── */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[27px] w-[323px] h-[560px]">
        {/* Launch animation sequence — intentionally slow & heavy:
             - idle: gentle float (y ±4px, 3s loop)
             - anticipation: SLOW dip DOWN 8px over 1.5s — engine struggling
               against gravity. Micro-shake via x oscillation gives tense,
               mechanical vibration feel. This is where the audience feels WEIGHT.
             - ignition: hold at max compression — the pause before release
             - launch: rocket releases upward at -120vh over 1.5s — heavy but
               powerful, like real mass being pushed through atmosphere
             - done: offscreen */}
        <Motion.div
          className="relative w-full h-full"
          animate={
            launchPhase === 'launch'
              ? { y: '-120vh', x: 0 }
              : launchPhase === 'ignition'
                ? {
                    // Hold at max compression, shake intensifies before release
                    y: 8,
                    x: [0, 1.5, -1.5, 1, -1, 0.5, -0.5, 0],
                  }
                : launchPhase === 'anticipation'
                  ? {
                      // Slow compression DOWN — engine fighting gravity.
                      // Micro-shake: x oscillates ±1px, looping slowly.
                      // The combination of downward dip + lateral vibration
                      // creates the "struggling engine" feel.
                      y: 8,
                      x: [0, 0.8, -0.8, 0.6, -0.6, 0],
                    }
                  : !isScanning
                    ? { y: [0, -4, 0], x: 0 }
                    : { y: 0, x: 0 }
          }
          transition={
            launchPhase === 'launch'
              ? {
                  // Main launch thrust — 2.5s sells the WEIGHT of a real rocket.
                  // Easing [0.16, 1, 0.3, 1]: very slow start (fighting gravity),
                  // then smooth acceleration as thrust overcomes mass.
                  // The first ~0.8s barely moves — that's the "heavy release" feel.
                  duration: 2.5,
                  ease: [0.16, 1, 0.3, 1],
                }
              : launchPhase === 'ignition'
                ? {
                    // Intensified shake at ignition — engine at full power
                    y: { duration: 0.3, ease: 'easeOut' },
                    x: { duration: 0.6, repeat: Infinity, ease: 'linear' },
                  }
                : launchPhase === 'anticipation'
                  ? {
                      // SLOW compression — 1.5s to reach max dip.
                      // This duration is the key to the "pressure build" feel.
                      // Shorter = snappy (wrong). Longer = tense (right).
                      y: { duration: 1.5, ease: [0.4, 0, 0.2, 1] },
                      x: { duration: 0.8, repeat: Infinity, ease: 'linear' },
                    }
                  : !isScanning
                    ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.3 }
          }
        >
          {/* Rocket SVG */}
          <img
            src={rocketSvg}
            alt="Space shuttle Artemis"
            className="w-full h-full"
            style={{
              filter: isScanning ? 'brightness(0.85)' : 'brightness(1)',
              transition: 'filter 0.4s ease',
            }}
          />

          {/* Flame / exhaust — appears during ignition + launch phases */}
          <RocketFlame launchPhase={launchPhase} />

          {/* Scan effects */}
          <ScanOverlay isScanning={isScanning} />
          <ScanLine isScanning={isScanning} />
          <CompletionFlash trigger={showFlash} />
        </Motion.div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Footer — Figma node 1696:23779
//
// Exact Figma structure:
//   px-[52px] py-[24px], flex items-end
//   Inner flex (1696:23795): gap-[12px], flex-1 children
//     1. "b312" column: text 18px Oxanium Medium white + 6px bar rgba(39,195,204,0.3)
//     2. Spacer bar: 6px tall, rgba(39,195,204,0.09)
//     3. "an-12" column: text 18px Oxanium Medium white + 6px bar rgba(39,195,204,0.3)
//     4-8. Five 3px bars: rgba(39,195,204,0.09)
// ═══════════════════════════════════════════════════════════════════════════════
function BottomBar() {
  return (
    <Motion.div
      // Figma: px-[52px] py-[24px], items-end
      className="relative flex items-end px-[52px] py-[24px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      {/* Figma node 1696:23795 — inner flex container
           gap-[12px], flex-1 children, items-end */}
      <div className="flex flex-1 gap-[12px] items-end">

        {/* Figma node 1696:23775 — "B312" column */}
        <div className="flex flex-col gap-[4px] items-start flex-1">
          <p
            className="text-[18px] font-medium uppercase w-full"
            style={{ fontFamily: FONT_OXANIUM, color: WHITE }}
          >
            B312
          </p>
          {/* Figma node 1696:23770 — accent bar: 6px, rgba(39,195,204,0.3) */}
          <div className="w-full h-[6px]" style={{ backgroundColor: 'rgba(39,195,204,0.3)' }} />
        </div>

        {/* Figma node 1696:23771 — spacer bar: 6px, rgba(39,195,204,0.09) */}
        <div className="flex-1 h-[6px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />

        {/* Figma node 1696:23776 — "AN-12" column */}
        <div className="flex flex-col gap-[4px] items-start flex-1">
          <p
            className="text-[18px] font-medium uppercase w-full"
            style={{ fontFamily: FONT_OXANIUM, color: WHITE }}
          >
            AN-12
          </p>
          {/* Figma node 1696:23778 — accent bar: 6px, rgba(39,195,204,0.3) */}
          <div className="w-full h-[6px]" style={{ backgroundColor: 'rgba(39,195,204,0.3)' }} />
        </div>

        {/* Figma nodes 1696:23788–23792 — five trailing 3px segment bars */}
        <div className="flex-1 h-[3px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />
        <div className="flex-1 h-[3px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />
        <div className="flex-1 h-[3px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />
        <div className="flex-1 h-[3px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />
        <div className="flex-1 h-[3px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />
      </div>
    </Motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE: SpacecraftFUIPage
//
// Two view modes controlled by activeMenuIndex:
//   - Index 0 (default): Scan Shuttle view (rocket + scan interaction)
//   - Index 2: Fuel System view (jerry can + drag/fill interaction)
//
// Scan state machine (shuttle mode):
//   idle → scanning → complete → idle (reset after delay)
// ═══════════════════════════════════════════════════════════════════════════════
export function SpacecraftFUIPage() {
  const navigate = useNavigate()
  const [activeMenuIndex, setActiveMenuIndex] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // ─── Scan state machine (shuttle mode) ──────────────────────────────────
  const [scanPhase, setScanPhase] = useState('idle')
  const isScanning = scanPhase === 'scanning'
  const isScanComplete = scanPhase === 'complete'
  const [showFlash, setShowFlash] = useState(false)

  const scanTimerRef = useRef(null)
  const resetTimerRef = useRef(null)

  const handleScan = useCallback(() => {
    if (scanPhase !== 'idle') return
    setScanPhase('scanning')

    scanTimerRef.current = setTimeout(() => {
      setShowFlash(true)
      setScanPhase('complete')
      setTimeout(() => setShowFlash(false), 600)
      resetTimerRef.current = setTimeout(() => setScanPhase('idle'), 3000)
    }, 5000)
  }, [scanPhase])

  // ─── Launch state machine ────────────────────────────────────────────────
  // Phases: idle → fadeUI → anticipation → ignition → launch → done → idle
  //
  // The BUILDUP is intentionally very slow (2.5s total before launch).
  // This creates the feeling of an engine STRUGGLING against gravity,
  // building pressure like a coiled spring, then RELEASING.
  //
  // Timeline:
  //   0ms:    fadeUI        — UI fades out slowly (800ms)
  //   600ms:  anticipation  — rocket dips DOWN 8px, micro-shake begins (2000ms)
  //                           flame starts small during this phase
  //                           WHY so slow: this IS the tension — the audience
  //                           needs to feel the weight, the struggle, the power
  //                           building before release
  //   2600ms: ignition      — flame grows large, final dramatic hold (800ms)
  //                           WHY delayed: the pause after max pressure and
  //                           before release is what makes the launch feel powerful
  //   3400ms: launch        — rocket releases upward -120vh (2500ms)
  //                           WHY 2.5s: heavy objects accelerate slowly.
  //                           The first ~0.8s barely moves (fighting gravity),
  //                           then smooth acceleration as thrust overcomes mass.
  //   5900ms: done          — rocket offscreen, clean
  //   7500ms: idle          — reset everything
  const [launchPhase, setLaunchPhase] = useState('idle')

  const handleLaunch = useCallback(() => {
    if (launchPhase !== 'idle' || scanPhase !== 'idle') return

    // Step 1: UI fades out — slow dissolve sets cinematic mood
    setLaunchPhase('fadeUI')

    // Step 2: Anticipation — the CORE of the experience.
    // Rocket compresses down, engine shakes, flame sputters to life.
    // This 2-second hold is what creates the "ngeden" / pressure-build feel.
    setTimeout(() => setLaunchPhase('anticipation'), 600)

    // Step 3: Ignition — flame flares to full power, final breath before release
    setTimeout(() => setLaunchPhase('ignition'), 2600)

    // Step 4: LAUNCH — the payoff. All that built tension releases upward.
    setTimeout(() => setLaunchPhase('launch'), 3400)

    // Step 5: Done — rocket has exited the screen (3400 + 2500 = 5900ms)
    setTimeout(() => setLaunchPhase('done'), 5900)

    // Step 6: Reset — back to idle after a pause
    setTimeout(() => setLaunchPhase('idle'), 7500)
  }, [launchPhase, scanPhase])

  // ─── Fuel System state (fuel mode, activeMenuIndex === 2) ───────────────
  const [fuelLevel, setFuelLevel] = useState(42)
  const [isFilling, setIsFilling] = useState(false)
  const isFuelComplete = fuelLevel >= 100

  const handleAddFuel = useCallback(() => {
    if (isFilling || isFuelComplete) return
    setIsFilling(true)
    setFuelLevel(100)
    setTimeout(() => setIsFilling(false), 1600)
  }, [isFilling, isFuelComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  // activeMenu === "fuel-system" when menu index 2 is selected
  const isFuelSystemMode = activeMenuIndex === 2

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: BG_DARK }}
    >
      <DotGrid />

      <div className="w-full max-w-[1100px] mx-auto flex flex-col flex-1 min-h-0">

        {/* Header — shared across all modes */}
        <Header onBack={() => navigate('/')} onSettings={() => setIsSettingsOpen(true)} />

        <div className="flex-1 flex min-h-0 px-[52px] gap-[32px] mt-[24px]">

          {/* Left sidebar — navigation (shared, always visible) */}
          <Motion.div
            className="w-[440px] shrink-0 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <LeftMenu
              activeIndex={activeMenuIndex}
              onSelect={setActiveMenuIndex}
            />
          </Motion.div>

          {/* Right content — switches between Shuttle and Fuel System views */}
          <AnimatePresence mode="wait">
            {isFuelSystemMode ? (
              <FuelSystemView
                key="fuel-system"
                fuelLevel={fuelLevel}
                isFilling={isFilling}
                isComplete={isFuelComplete}
                onAddFuel={handleAddFuel}
              />
            ) : (
              <Motion.div
                key="shuttle"
                className="flex-1 flex flex-col items-center gap-[20px] min-w-0 max-w-[700px]"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{
                  opacity: isScanning ? 0.92 : 1,
                  scale: 1,
                  // Screen shake during launch — stronger burst as rocket releases.
                  // The shake during anticipation is handled by the rocket itself
                  // (micro-oscillation on the rocket container). This is the
                  // whole-view shake that sells the force of the launch.
                  x: launchPhase === 'launch'
                    ? [0, 3, -3, 2, -2, 1, -1, 0]
                    : 0,
                }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  duration: 0.5,
                  delay: 0.15,
                  ease: EASE_OUT,
                  x: { duration: 0.5, ease: 'easeOut' },
                }}
              >
                <Motion.div
                  className="flex items-center justify-between w-full"
                  style={{ fontFamily: FONT_OXANIUM }}
                  animate={{
                    opacity: launchPhase !== 'idle' ? 0 : 1,
                    y: launchPhase !== 'idle' ? 10 : 0,
                  }}
                  transition={{ duration: 0.4, ease: EASE_OUT }}
                >
                  <span className="text-[18px] font-medium uppercase" style={{ color: WHITE }}>
                    ORBIT: LEO TRANSFER
                  </span>
                  <span className="text-[18px] font-medium uppercase text-right" style={{ color: WHITE }}>
                    MISSION ID: B01-ARTEMIS
                  </span>
                </Motion.div>

                <ShuttleViewport
                  isScanning={isScanning}
                  scanPhase={scanPhase}
                  showFlash={showFlash}
                  launchPhase={launchPhase}
                />

                {/* Button row — Scan Shuttle + Launch side by side */}
                <Motion.div
                  className="flex items-center gap-[12px]"
                  animate={{
                    opacity: launchPhase !== 'idle' ? 0 : 1,
                    y: launchPhase !== 'idle' ? 10 : 0,
                  }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <ScanButton
                    isScanning={isScanning}
                    isComplete={isScanComplete}
                    onClick={handleScan}
                  />

                  {/* Launch button — same visual style as ScanButton.
                       Only enabled when scan is idle and launch is idle. */}
                  <Motion.button
                    type="button"
                    className="relative w-[206px] h-[36px] cursor-pointer select-none"
                    onClick={handleLaunch}
                    whileHover={launchPhase === 'idle' && scanPhase === 'idle' ? { scale: 1.03 } : {}}
                    whileTap={launchPhase === 'idle' && scanPhase === 'idle' ? { scale: 0.97 } : {}}
                    disabled={launchPhase !== 'idle' || scanPhase !== 'idle'}
                    aria-label="Launch rocket"
                  >
                    <img
                      src={btnScanOutlineSvg}
                      alt=""
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[12px] font-medium uppercase"
                        style={{ fontFamily: FONT_BDO, color: '#EB9E45' }}
                      >
                        LAUNCH
                      </span>
                    </div>
                  </Motion.button>
                </Motion.div>
              </Motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar — shared across all modes */}
        <BottomBar />
      </div>

      {/* Settings modal — triggered by header settings button */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
