import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion as Motion, AnimatePresence, useMotionValue, useSpring, animate } from 'framer-motion'
import clsx from 'clsx'
import { BackButton } from './ui/BackButton'

// ─── Constants ────────────────────────────────────────────────────────────────
const DIAL_SIZE = 292
const STROKE_WIDTH = 6
const KNOB_SIZE = 20

const PADDING = KNOB_SIZE / 2 + 3
const TRACK_RADIUS = (DIAL_SIZE / 2) - PADDING
const INNER_RADIUS = TRACK_RADIUS - 28
const CENTER = DIAL_SIZE / 2

const MAX_VALUE = 60
const TICK_COUNT = 60

// Circumference for stroke-dashoffset arc animation
const CIRCUMFERENCE = 2 * Math.PI * TRACK_RADIUS

// ─── Smoothing constant ──────────────────────────────────────────────────────
// Lerp factor: lower = smoother/laggier, higher = snappier.
// 0.15 gives a 1–2 frame delay at 60fps — feels like a weighted physical knob.
const LERP_FACTOR = 0.15

// ─── Angle math helpers ──────────────────────────────────────────────────────

/**
 * Convert a pointer position to an angle in degrees (0–360).
 * 0° = 12 o'clock, increasing clockwise.
 *
 * atan2(dx, -dy) naturally gives 0 at top, positive clockwise.
 * We normalize negative results to [0, 360).
 */
function pointerToAngle(pointerX, pointerY, centerX, centerY) {
  const dx = pointerX - centerX
  const dy = pointerY - centerY
  let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI)
  if (angleDeg < 0) angleDeg += 360
  return angleDeg
}

/** Map a 0–360 angle to a 0–60 minute value */
function angleToValue(angle) {
  return Math.round((angle / 360) * MAX_VALUE)
}

/** Map a 0–60 value back to angle */
function valueToAngle(value) {
  return (value / MAX_VALUE) * 360
}

/**
 * Get (x, y) on the circle for a given dial angle.
 * Converts dial angle (0° = top, CW) to standard math angle for cos/sin.
 */
function angleToPoint(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TimeCommitmentDial() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [value, setValue] = useState(25)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false) // controls entry animation
  const [displayValue, setDisplayValue] = useState(null) // for animated number swap

  // ── Motion values — updated per-frame without triggering re-renders ────────
  // smoothAngle drives the knob position and arc; it lerps toward targetAngle.
  const targetAngle = useRef(valueToAngle(25))
  const smoothAngle = useMotionValue(0) // starts at 0 for entry animation

  // Spring-based knob scale for tactile feel on state changes
  // stiffness 300 + damping 15 gives a bouncy-but-controlled overshoot
  const knobScale = useSpring(1, { stiffness: 300, damping: 15 })

  // ── Refs ───────────────────────────────────────────────────────────────────
  const circleRef = useRef(null)
  const prevAngleRef = useRef(valueToAngle(25))
  const valueRef = useRef(25)
  const rafRef = useRef(null)
  const isDraggingRef = useRef(false)

  // ── Animation frame loop ───────────────────────────────────────────────────
  // Runs continuously during drag to lerp smoothAngle toward targetAngle.
  // This is what creates the "weighted knob" feel — the visual position
  // always chases the actual pointer position with exponential decay.
  const startAnimationLoop = useCallback(() => {
    const loop = () => {
      const current = smoothAngle.get()
      const target = targetAngle.current

      // Lerp: move 15% of the remaining distance each frame
      const next = current + (target - current) * LERP_FACTOR

      // Stop looping when we're close enough (< 0.1°)
      if (Math.abs(target - next) > 0.1) {
        smoothAngle.set(next)
        rafRef.current = requestAnimationFrame(loop)
      } else {
        smoothAngle.set(target)
        rafRef.current = null
      }
    }

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop)
    }
  }, [smoothAngle])

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── Entry animation ────────────────────────────────────────────────────────
  // Sequence: arc draws from 0 → value, knob follows, then number fades in.
  // Total duration ~900ms for a premium first impression.
  useEffect(() => {
    const targetVal = valueToAngle(25)

    // Animate smoothAngle from 0 to initial value over 800ms
    // easeOut curve makes the arc decelerate naturally
    animate(smoothAngle, targetVal, {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1], // custom ease-out curve — fast start, gentle stop
      onComplete: () => {
        // Number appears last — 200ms after arc finishes
        setTimeout(() => {
          setDisplayValue(25)
          setIsLoaded(true)
        }, 100)
      },
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const handlePointerInteraction = useCallback((e) => {
    if (!circleRef.current) return

    const rect = circleRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const newAngle = pointerToAngle(e.clientX, e.clientY, centerX, centerY)

    // Anti-wrap: reject > 180° jumps (physically impossible in smooth drag).
    // This prevents teleporting across the 0°/360° seam.
    const delta = Math.abs(newAngle - prevAngleRef.current)
    if (delta > 180) return

    prevAngleRef.current = newAngle
    targetAngle.current = newAngle

    // Start the lerp loop — smoothAngle will chase targetAngle
    startAnimationLoop()

    const newValue = angleToValue(newAngle)

    if (newValue !== valueRef.current) {
      valueRef.current = newValue
      setValue(newValue)
      setDisplayValue(newValue)
    }
  }, [startAnimationLoop])

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    isDraggingRef.current = true

    // Scale up knob on grab — 1.15x with spring overshoot
    knobScale.set(1.15)

    if (circleRef.current) {
      const rect = circleRef.current.getBoundingClientRect()
      const clickAngle = pointerToAngle(
        e.clientX, e.clientY,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      )
      prevAngleRef.current = clickAngle
    }

    handlePointerInteraction(e)
  }, [handlePointerInteraction, knobScale])

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    handlePointerInteraction(e)
  }, [handlePointerInteraction])

  const handlePointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
    isDraggingRef.current = false

    // Release animation: knob squishes down then bounces back
    // 1.15 → 0.95 → 1.0 with spring physics
    // cubic-bezier(0.34, 1.56, 0.64, 1) is approximated by the spring config
    knobScale.set(0.95)
    setTimeout(() => knobScale.set(1), 120)

    // Micro overshoot on release: push angle slightly past target, then settle.
    // This simulates physical momentum — the dial "coasts" a tiny bit.
    const current = smoothAngle.get()
    const overshootAmount = 3 // degrees — subtle enough to feel natural
    const direction = current - (prevAngleRef.current - 1) > 0 ? 1 : -1
    const overshootTarget = targetAngle.current + (overshootAmount * direction)

    // Clamp overshoot to valid range
    const clamped = Math.max(0, Math.min(359.5, overshootTarget))

    animate(smoothAngle, [clamped, targetAngle.current], {
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1], // overshoot easing — passes target then returns
    })
  }, [knobScale, smoothAngle])

  // ── Derived SVG values (recomputed from smoothAngle via motion) ────────────
  // We subscribe to smoothAngle changes to derive knob position and arc.
  const [renderAngle, setRenderAngle] = useState(0)

  useEffect(() => {
    const unsubscribe = smoothAngle.on('change', (latest) => {
      setRenderAngle(latest)
    })
    return unsubscribe
  }, [smoothAngle])

  const knobPos = angleToPoint(renderAngle, TRACK_RADIUS)

  // stroke-dashoffset: full circumference = no arc, 0 = full circle.
  // We subtract the portion that should be visible.
  const dashOffset = CIRCUMFERENCE - (renderAngle / 360) * CIRCUMFERENCE

  // ── Tick marks with progress-aware opacity ─────────────────────────────────
  const ticks = useMemo(() => {
    const result = []
    for (let i = 0; i < TICK_COUNT; i++) {
      const tickAngle = (i / TICK_COUNT) * 360
      const isMajor = i % 15 === 0
      const isMinor5 = i % 5 === 0 && !isMajor

      const outerR = INNER_RADIUS + (isMajor ? 8 : isMinor5 ? 4 : 2)
      const innerR = INNER_RADIUS - (isMajor ? 2 : 0)

      const outer = angleToPoint(tickAngle, outerR)
      const inner = angleToPoint(tickAngle, innerR)

      // Ticks that the progress has passed get slightly brighter
      const isPassed = tickAngle <= renderAngle
      const baseOpacity = isMajor ? 1 : 0.15
      const activeOpacity = isMajor ? 1 : 0.35

      result.push(
        <line
          key={i}
          x1={outer.x} y1={outer.y}
          x2={inner.x} y2={inner.y}
          stroke={isMajor ? '#1a1a1a' : 'rgba(0,0,0,1)'}
          strokeWidth={isMajor ? 2.5 : 1}
          strokeLinecap="round"
          opacity={isPassed ? activeOpacity : baseOpacity}
          style={{ transition: 'opacity 0.2s ease' }}
        />
      )
    }
    return result
  }, [renderAngle])

  // ── Number animation variants ──────────────────────────────────────────────
  // Old value slides up and fades out, new value slides up from below and fades in.
  // This prevents the jarring instant-swap that breaks the premium feel.
  const numberVariants = {
    enter: {
      opacity: 0,
      y: 6,
    },
    center: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -6,
    },
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="bg-[#f5f5f5] min-h-screen flex items-center justify-center"
      style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
      data-node-id="1617:3523"
    >
      <div
        className="bg-white flex flex-col w-[390px] h-[800px] overflow-clip"
        data-node-id="1622:3634"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-end justify-between h-[72px] pb-3 pt-5 px-5"
          data-node-id="1622:3636"
        >
          <BackButton to="/" showLabel={false} />
          <div className="size-8 shrink-0" data-node-id="1622:3640" />
        </div>

        {/* ── Question text ───────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-2 px-5 py-3"
          data-node-id="1622:3641"
        >
          <p
            className="font-medium text-[24px] leading-normal text-[#020a1d]"
            data-node-id="1622:3642"
          >
            How much time can you commit daily?
          </p>
          <p
            className="text-[14px] leading-[1.5] text-[#5f6268]"
            data-node-id="1622:3643"
          >
            {`Pick a daily time that works for you. We'll adapt your learning plan to help you stay consistent.`}
          </p>
        </div>

        {/* ── Timer container ─────────────────────────────────────────────── */}
        <div
          className="flex flex-1 flex-col gap-7 items-center justify-center px-5 min-h-0"
          data-node-id="1622:3644"
        >
          {/* ── Circular dial ─────────────────────────────────────────────── */}
          <div
            className="relative select-none overflow-visible"
            style={{ width: DIAL_SIZE, height: DIAL_SIZE }}
            data-node-id="1622:3645"
          >
            <svg
              ref={circleRef}
              width={DIAL_SIZE}
              height={DIAL_SIZE}
              viewBox={`0 0 ${DIAL_SIZE} ${DIAL_SIZE}`}
              className="touch-none overflow-visible"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
            >
              {/* ── Glow filter for arc leading edge ───────────────────────── */}
              <defs>
                <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                  <feColorMatrix
                    in="blur"
                    type="matrix"
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0"
                  />
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* ── Background track (light gray ring) ────────────────────── */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={TRACK_RADIUS}
                fill="none"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth={STROKE_WIDTH}
              />

              {/* ── Active progress arc (blue) ────────────────────────────── */}
              {/* Uses stroke-dashoffset for buttery smooth animation.
                  The circle starts at 3 o'clock by default, so we rotate -90°
                  to make it start from 12 o'clock (matching our dial's 0°). */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={TRACK_RADIUS}
                fill="none"
                stroke="#1a9df3"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
                style={{
                  filter: isDragging ? 'url(#arc-glow)' : 'none',
                  transition: isDragging ? 'filter 0.15s ease-out' : 'filter 0.3s ease',
                }}
              />

              {/* ── Leading edge glow dot ─────────────────────────────────── */}
              {/* A small radial glow at the arc's leading tip adds depth */}
              {renderAngle > 1 && (
                <circle
                  cx={knobPos.x}
                  cy={knobPos.y}
                  r={8}
                  fill="rgba(26, 157, 243, 0.15)"
                  style={{
                    transition: 'opacity 0.2s ease',
                    opacity: isDragging ? 1 : 0.5,
                  }}
                />
              )}

              {/* ── Tick marks ────────────────────────────────────────────── */}
              {ticks}

              {/* ── Draggable knob ────────────────────────────────────────── */}
              {/* The knob uses a motion-value-driven scale for tactile feedback.
                  SVG transform is used instead of CSS transform for cross-browser
                  consistency — we translate to knob position, then scale in place. */}
              <g
                style={{
                  filter: isDragging
                    ? 'drop-shadow(0 3px 10px rgba(26, 157, 243, 0.45))'
                    : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
                  transition: 'filter 0.2s ease',
                }}
              >
                {/* Outer ring — scales with knobScale motion value */}
                <Motion.circle
                  cx={knobPos.x}
                  cy={knobPos.y}
                  r={KNOB_SIZE / 2}
                  fill="white"
                  stroke="#1a9df3"
                  strokeWidth={3}
                  style={{
                    scale: knobScale,
                    transformOrigin: `${knobPos.x}px ${knobPos.y}px`,
                  }}
                />
                {/* Inner dot */}
                <Motion.circle
                  cx={knobPos.x}
                  cy={knobPos.y}
                  r={4}
                  fill="#1a9df3"
                  style={{
                    scale: knobScale,
                    transformOrigin: `${knobPos.x}px ${knobPos.y}px`,
                  }}
                />
              </g>
            </svg>

            {/* ── Center number display ────────────────────────────────────── */}
            {/* AnimatePresence handles the crossfade: exiting number slides up
                and fades out while the entering number slides up from below.
                `mode="popLayout"` ensures both are briefly visible for overlap. */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              data-node-id="1622:3651"
            >
              <div className="relative h-[42px] flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <Motion.p
                    key={displayValue}
                    variants={numberVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      duration: 0.18,
                      ease: [0.25, 0.1, 0.25, 1], // smooth ease — no bounce on numbers
                    }}
                    className="text-[34px] text-black leading-none"
                    data-node-id="1622:3652"
                  >
                    {displayValue}
                  </Motion.p>
                </AnimatePresence>
              </div>
              <Motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="text-[17px] text-black/50 leading-none mt-1"
                data-node-id="1622:3653"
              >
                {value === 1 ? 'Minute' : 'Minutes'}
              </Motion.p>
            </div>
          </div>

          {/* ── Helper text ──────────────────────────────────────────────── */}
          <p
            className="text-[14px] leading-[1.5] text-[#717379] text-center w-full"
            data-node-id="1622:3655"
          >
            Most learners start with 15–30 minutes a day
          </p>
        </div>

        {/* ── Footer / CTA ────────────────────────────────────────────────── */}
        <div
          className="px-5 py-7"
          data-node-id="1622:3656"
        >
          <Motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97, y: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={clsx(
              'relative w-full rounded-full py-3 px-3',
              'border border-black/10 overflow-hidden',
              'text-white text-[18px] font-medium leading-[1.5]',
              'cursor-pointer',
            )}
            style={{
              background: '#1a9df3',
              textShadow: '0px 2.583px 3.874px rgba(0,0,0,0.05)',
            }}
            data-node-id="1622:3657"
          >
            <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0px_2px_1px_rgba(255,255,255,0.16),inset_0px_1.2px_1.2px_rgba(255,255,255,0.12),inset_0px_0px_1.2px_1.8px_rgba(0,0,0,0.1)]" />
            Continue
          </Motion.button>
        </div>
      </div>
    </div>
  )
}
