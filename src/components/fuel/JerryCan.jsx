import { useRef, useEffect, useCallback } from 'react'
import { motion as Motion } from 'framer-motion'

// ─── Design tokens from Figma ────────────────────────────────────────────────
const FUEL_COLOR = '#FCB900'
const CAN_STROKE = 'white'

// ─── Jerry can outline path (Figma node 1700:81193, viewBox 0 0 300 428) ────
// This is the main container outline — opacity 0.4, stroke white, 2.68px
const CAN_OUTLINE = 'M2.02234 81.6827L2.01062 69.2286C2.00996 67.3585 1.97308 65.3344 2.03602 63.4834L2.06922 62.7012C2.1548 61.0701 3.24098 59.1646 4.94129 57.5157C6.62991 55.878 8.67932 54.7341 10.3104 54.4512C13.0785 53.9711 16.9632 54.1999 20.119 54.2481H20.1229C23.5187 54.2896 26.9147 54.2946 30.3104 54.2618L30.3095 54.2608C50.1098 54.2226 70.1806 54.41 90.0067 54.3555C92.5626 54.4329 95.5368 53.7913 98.243 52.6446C100.944 51.5 103.521 49.7912 105.174 47.6172C109.235 42.2736 111.66 35.6584 114.126 29.4161C116.626 23.0865 119.178 17.1059 123.453 12.545C128.652 6.99789 136.687 4.0966 144.439 3.99712C153.442 4.26178 163.486 4.08061 172.474 4.0811H172.475L223.735 4.06645L241.378 4.06743H241.379C247.711 4.0634 254.209 3.78729 260.118 5.15727C261.658 5.51407 263.979 6.55792 266.275 7.877C268.425 9.11196 270.392 10.4949 271.546 11.6075L271.766 11.8262C276.639 16.8472 279.419 23.9944 282.071 30.9151L283.206 33.8604L291.481 55.3506C292.537 58.1418 293.988 61.5701 295.248 64.8077C296.539 68.1262 297.692 71.3932 298.298 74.1895L298.299 74.1905C298.372 74.5273 298.437 75.259 298.483 76.3086C298.528 77.3217 298.55 78.5338 298.56 79.7676C298.581 82.2457 298.551 84.7298 298.551 85.8545V104.954L298.469 169.498V169.501L298.593 395.687V395.688C298.595 397.69 298.639 400.319 298.258 401.962V401.963C296.95 407.608 293.513 413.569 289.408 417.619C285.081 421.889 280.624 424.732 274.757 425.858L274.756 425.859C270.291 426.718 265.096 426.492 260.24 426.499H260.241L239.108 426.484H239.107L155.79 426.47L67.7528 426.46H67.7518L41.8446 426.48H41.8397C37.4027 426.5 32.2518 426.808 28.1473 426.322H28.1464C15.3453 424.812 4.42485 413.478 2.19617 400.864C1.85646 398.941 1.79119 396.183 1.8241 393.259C1.85555 390.466 1.98438 387.299 1.995 385.106V385.102L2.0243 354.516V354.509L1.75769 289.456C1.75626 288.146 1.81422 286.807 1.87488 285.428C1.935 284.061 1.99805 282.655 2.00379 281.257C2.18158 266.298 2.15149 251.339 1.91297 236.382L1.79773 229.972C1.68232 223.214 1.8623 216.614 1.84266 209.82L2.04383 121.963V121.959L2.02234 81.6836V81.6827Z'

// Cap (top lid piece)
const CAP_PATH = 'M44.0091 0.669351C54.0742 0.398126 64.7382 0.319041 74.7364 1.13445C75.9441 1.23288 79.4378 4.12958 79.6441 5.23332C80.86 11.7412 80.3124 19.1008 80.3878 25.81C76.1312 25.8935 71.1831 25.7059 66.8743 25.6523C54.7958 25.9012 41.909 25.6855 29.7257 25.7877C29.8474 19.0608 29.6538 12.7793 29.977 5.99618C30.5566 4.98367 31.2636 4.05 32.0809 3.21798C35.2978 -0.0121827 39.5924 0.690177 44.0091 0.669351Z'

// Neck piece
const NECK_PATH = 'M25.5965 32.1602C25.8633 32.1471 26.13 32.1352 26.3967 32.1252C30.3429 31.9703 34.702 32.1042 38.6884 32.1079L62.0052 32.1136L77.3786 32.1175C82.9891 32.1272 89.0552 31.2612 93.2743 35.5428C96.9081 39.2306 97.5112 41.8735 97.6553 46.818L84.9494 46.91C69.016 46.6559 52.6287 46.9283 36.64 46.9048L22.0215 46.8842C19.6831 46.883 14.7989 46.7635 12.738 47.1889C13.6675 38.4095 15.8239 33.0249 25.5965 32.1602Z'

// Clip path for liquid containment (from liquid-mask.svg)
const LIQUID_CLIP = 'M144.037 0C153.021 0.265027 163.025 0.0835466 172.059 0.0840424L223.32 0.0686722L240.962 0.069913C247.199 0.0659463 253.904 -0.219658 260.005 1.19473C263.471 1.99774 269.831 5.67813 272.313 8.23642C278.121 14.2197 281.058 23.071 284.04 30.7174L292.318 52.2128C294.449 57.8493 297.935 65.4377 299.194 71.2504C299.598 73.111 299.477 81.0086 299.477 83.1997V102.299L299.395 166.845L299.519 393.031C299.521 394.942 299.576 397.776 299.149 399.611C297.781 405.516 294.211 411.699 289.935 415.919C285.478 420.317 280.793 423.332 274.593 424.522C269.965 425.412 264.579 425.179 259.824 425.186L238.691 425.171L155.374 425.156L67.337 425.146L41.4299 425.166C37.1134 425.186 31.7868 425.498 27.5736 425C14.1236 423.413 2.77913 411.578 0.458381 398.443C-0.269673 394.322 0.214954 386.952 0.236768 382.445L0.266018 351.859L3.23661e-05 286.807C-0.00319021 284.114 0.235281 281.325 0.245941 278.586C0.448963 261.504 0.380545 244.422 0.0401912 227.343C-0.0753257 220.585 0.104643 213.891 0.0850593 207.162L0.285354 119.304L0.264036 79.0287L0.252386 66.5741C0.251642 64.4782 0.202557 62.0741 0.312868 59.9755C0.534482 55.7516 5.71638 51.1582 9.66528 50.4734C12.5968 49.9649 16.6868 50.2047 19.7232 50.251C23.1094 50.2924 26.4958 50.2966 29.882 50.2639C49.7833 50.2255 69.7217 50.4134 89.6275 50.3584C94.2787 50.5007 100.759 48.0051 103.689 44.1497C111.536 33.8248 113.113 18.5159 122.058 8.97175C127.564 3.09727 135.99 0.0959453 144.037 0Z'

// ═══════════════════════════════════════════════════════════════════════════════
// Sine wave path generator for liquid surface
//
// Creates a smooth SVG path representing a liquid surface with wave motion.
// Parameters:
//   - y: base Y position of the liquid surface
//   - amplitude: wave height (affected by drag/shake/fill state)
//   - frequency: number of wave peaks across width
//   - phase: horizontal offset (animated over time for motion)
//   - width: total path width
// ═══════════════════════════════════════════════════════════════════════════════
function generateWavePath(y, amplitude, frequency, phase, width = 600) {
  const segments = 60
  const step = width / segments
  let path = `M ${-width / 2} ${y}`

  for (let i = 0; i <= segments; i++) {
    const x = -width / 2 + i * step
    const waveY = y + Math.sin((i / segments) * Math.PI * 2 * frequency + phase) * amplitude
    // Secondary wave for organic feel
    const wave2 = Math.sin((i / segments) * Math.PI * 2 * (frequency * 1.7) + phase * 0.6) * amplitude * 0.3
    path += ` L ${x} ${waveY + wave2}`
  }

  // Close path below viewport to fill the liquid body
  path += ` L ${width / 2} 500 L ${-width / 2} 500 Z`
  return path
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: JerryCan — interactive liquid container
//
// Features:
//   1. Idle wave animation (subtle sine wave loop)
//   2. Drag-to-shake (increases wave intensity based on velocity)
//   3. Fill animation (smooth level rise with turbulence)
//   4. Inertia decay (wave continues after drag stops, decays 0.95/frame)
// ═══════════════════════════════════════════════════════════════════════════════
export function JerryCan({ fuelLevel = 42, onDragStart, onDragEnd }) {
  const containerRef = useRef(null)
  const rafRef = useRef(null)

  // ─── Wave state (mutated per frame, not React state to avoid rerenders) ──
  const waveState = useRef({
    phase: 0,
    amplitude: 2,           // idle amplitude
    targetAmplitude: 2,
    velocity: 0,            // drag velocity
    lastX: 0,
    lastY: 0,
    isDragging: false,
  })

  // Displayed fuel level ref (animated during fill, no React re-render per frame)
  const displayLevelRef = useRef(fuelLevel)

  // SVG ref for direct DOM manipulation (perf: no React rerender per frame)
  const wave1Ref = useRef(null)
  const wave2Ref = useRef(null)
  const wave3Ref = useRef(null)
  const wave4Ref = useRef(null)

  // ─── Animate fuel level during fill ─────────────────────────────────────
  useEffect(() => {
    if (fuelLevel === displayLevelRef.current) return
    const start = displayLevelRef.current
    const end = fuelLevel
    const duration = 1400 // ~1.4s fill
    const startTime = performance.now()

    // Increase wave intensity during fill
    waveState.current.targetAmplitude = 8

    function tick(now) {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - t, 3)
      const current = start + (end - start) * eased
      displayLevelRef.current = current

      if (t < 1) {
        requestAnimationFrame(tick)
      } else {
        // Fill complete — settle wave back to idle
        waveState.current.targetAmplitude = 2
      }
    }
    requestAnimationFrame(tick)
  }, [fuelLevel])

  // ─── Main animation loop (requestAnimationFrame) ────────────────────────
  useEffect(() => {
    function animate() {
      const ws = waveState.current
      const dt = 1 / 60

      // Phase advances for continuous wave motion
      ws.phase += dt * (1.2 + ws.amplitude * 0.15)

      // ── Wave intensity decay (inertia + damping) ──
      // amplitude lerps toward target, with 0.95 decay per frame for drag-induced waves
      if (!ws.isDragging) {
        ws.amplitude += (ws.targetAmplitude - ws.amplitude) * 0.04
        // Extra fast decay for high amplitudes (drag shake settling)
        if (ws.amplitude > ws.targetAmplitude + 0.5) {
          ws.amplitude *= 0.97
        }
      }

      // Liquid surface Y position — maps fuelLevel to jerry can internal height
      // Can body spans roughly y=105 to y=425 (320px internal)
      const level = displayLevelRef.current
      const minY = 425
      const maxY = 105
      const baseY = minY - (level / 100) * (minY - maxY)

      // Generate wave paths for each liquid layer (matching Figma's 4 layers)
      // Each layer has different opacity and slight Y offset for depth
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

  // ─── Drag handlers (pointer events for wave intensity mapping) ──────────
  const handlePointerDown = useCallback((e) => {
    const ws = waveState.current
    ws.isDragging = true
    ws.lastX = e.clientX
    ws.lastY = e.clientY
    ws.velocity = 0
    containerRef.current?.setPointerCapture(e.pointerId)
    onDragStart?.()
  }, [onDragStart])

  const handlePointerMove = useCallback((e) => {
    const ws = waveState.current
    if (!ws.isDragging) return

    // Calculate velocity from delta movement
    const dx = e.clientX - ws.lastX
    const dy = e.clientY - ws.lastY
    const speed = Math.sqrt(dx * dx + dy * dy)
    ws.lastX = e.clientX
    ws.lastY = e.clientY

    // ── Drag → wave mapping ──
    // velocity factor: higher speed = more wave intensity
    // Clamped to prevent extreme distortion
    ws.velocity = speed
    const mappedAmplitude = Math.min(2 + speed * 0.8, 20)
    ws.amplitude = ws.amplitude * 0.7 + mappedAmplitude * 0.3 // smooth blend
    ws.targetAmplitude = mappedAmplitude
  }, [])

  const handlePointerUp = useCallback((e) => {
    const ws = waveState.current
    ws.isDragging = false
    // Let inertia carry briefly, then decay to idle
    ws.targetAmplitude = 2
    containerRef.current?.releasePointerCapture(e.pointerId)
    onDragEnd?.()
  }, [onDragEnd])

  return (
    <Motion.div
      ref={containerRef}
      className="relative select-none touch-none"
      style={{ width: 300, height: 428, cursor: 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      whileTap={{ cursor: 'grabbing' }}
    >
      <svg viewBox="0 0 300 428" width="300" height="428" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Clip path using jerry can body outline — constrains liquid inside */}
          <clipPath id="canClip">
            <path d={LIQUID_CLIP} />
          </clipPath>
        </defs>

        {/* ── Layer 1: Liquid (clipped inside can shape) ── */}
        <g clipPath="url(#canClip)">
          {/* 4 wave layers at different opacities — matches Figma liquid-mask.svg
              Layer 1: 0.265 opacity (deepest / background)
              Layer 2: 0.4 opacity
              Layer 3: 0.53 opacity
              Layer 4: 1.0 opacity (surface) */}
          <path ref={wave1Ref} fill={FUEL_COLOR} fillOpacity="0.265" />
          <path ref={wave2Ref} fill={FUEL_COLOR} fillOpacity="0.4" />
          <path ref={wave3Ref} fill={FUEL_COLOR} fillOpacity="0.53" />
          <path ref={wave4Ref} fill={FUEL_COLOR} fillOpacity="1" />
        </g>

        {/* ── Layer 2: Can outline (on top of liquid) ── */}
        <path d={CAN_OUTLINE} stroke={CAN_STROKE} strokeWidth="2.68" opacity="0.4" />
        <path d={CAP_PATH} fill={CAN_STROKE} opacity="0.4" />
        <path d={NECK_PATH} fill={CAN_STROKE} opacity="0.4" />

        {/* Vertical structural lines (from jerry-can.svg) */}
        <path d="M256 4C256 8.80572 256 286.002 256 424" stroke={CAN_STROKE} strokeWidth="2" opacity="0.4" />
        <path d="M40 56C40 60.2679 40 306.445 40 429" stroke={CAN_STROKE} strokeWidth="2" opacity="0.4" />
        {/* Horizontal structural line */}
        <path d="M298 105C294.625 105 99.9269 105 3.00001 105" stroke={CAN_STROKE} strokeWidth="2" opacity="0.4" />

        {/* ── Layer 3: Measurement marks (from can-details.svg) ──
             Positioned inside can body at the right side */}
        <g transform="translate(170, 118)" opacity="0.4">
          <path d="M0.75 0V12M0.75 6H87.75M87.75 0V12" stroke={CAN_STROKE} strokeWidth="1.5" />
          <path d="M23.75 74V86M23.75 80H87.75M87.75 74V86" stroke={CAN_STROKE} strokeWidth="1.5" />
          <path d="M0.75 148V160M0.75 154H87.75M87.75 148V160" stroke={CAN_STROKE} strokeWidth="1.5" />
          <path d="M23.75 222V234M23.75 228H87.75M87.75 222V234" stroke={CAN_STROKE} strokeWidth="1.5" />
        </g>
      </svg>
    </Motion.div>
  )
}
