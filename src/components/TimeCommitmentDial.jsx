import { useState, useRef, useCallback } from 'react'
import { motion as Motion, useMotionValue, animate } from 'framer-motion'
import clsx from 'clsx'
import { BackButton } from './ui/BackButton'


// ─── Constants ────────────────────────────────────────────────────────────────
const DIAL_SIZE = 292          // px — matches Figma node 1622:3645
const STROKE_WIDTH = 6         // progress arc thickness
const KNOB_SIZE = 20           // draggable knob diameter

// FIX 1 — Radius calculation: inset by strokeWidth + half knob + knob stroke
// so the knob never extends beyond the SVG viewBox bounds.
// Total knob extent = knob radius (10) + knob stroke (3) = 13px
const PADDING = KNOB_SIZE / 2 + 3  // 13px — room for knob + its stroke
const TRACK_RADIUS = (DIAL_SIZE / 2) - PADDING  // fits entirely inside viewBox
const INNER_RADIUS = TRACK_RADIUS - 28          // where tick marks sit
const CENTER = DIAL_SIZE / 2

const MAX_VALUE = 60
const TICK_COUNT = 60          // one per minute

// ─── Angle math helpers ───────────────────────────────────────────────────────

/**
 * Convert a pointer position to an angle in degrees (0–360).
 * 0° = 12 o'clock, increasing clockwise.
 *
 * Math.atan2 gives the angle from the positive X-axis, counter-clockwise.
 * We need: offset so 0° = top, direction = clockwise.
 *
 * Steps:
 *   1. Get dx/dy from center of circle
 *   2. atan2(dx, -dy) → angle from top, clockwise (swap x/y and negate y)
 *   3. Normalize to [0, 360)
 */
function pointerToAngle(pointerX, pointerY, centerX, centerY) {
  const dx = pointerX - centerX
  const dy = pointerY - centerY

  // atan2(dx, -dy) naturally gives 0 at top, positive clockwise
  let angleDeg = Math.atan2(dx, -dy) * (180 / Math.PI)

  // Normalize negative angles to [0, 360)
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
 * Get knob (x, y) on the circle for a given angle (degrees, 0° = top).
 * Converts to standard math angle first:
 *   standard = 90° − dialAngle  (since 0° top → 90° in standard)
 */
function angleToPoint(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  }
}

// ─── SVG arc path helper ──────────────────────────────────────────────────────
function describeArc(radius, startAngle, endAngle) {
  const start = angleToPoint(startAngle, radius)
  const end = angleToPoint(endAngle, radius)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArc, 1, end.x, end.y,
  ].join(' ')
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TimeCommitmentDial() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [value, setValue] = useState(25)       // 0–60 minutes
  const [angle, setAngle] = useState(valueToAngle(25))
  const [isDragging, setIsDragging] = useState(false)

  // For center number scale animation
  const centerScale = useMotionValue(1)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const circleRef = useRef(null)    // SVG container — used for bounding box
  const prevAngleRef = useRef(valueToAngle(25))  // FIX 2 — tracks last accepted angle for anti-wrap
  const valueRef = useRef(25)       // FIX 3 — avoids stale closure on `value`

  // ── Drag logic ─────────────────────────────────────────────────────────────

  /**
   * Core drag handler: takes a pointer event, calculates angle from the
   * circle center using boundingClientRect, maps to value.
   *
   * FIX 2 — Anti-wrap logic:
   *   We track the previous accepted angle in prevAngleRef. If the delta
   *   between the new angle and the previous exceeds 180°, the user has
   *   crossed the 0°/360° boundary in a single frame — which is physically
   *   impossible with smooth dragging. We reject that update so the knob
   *   can't teleport from max → 0 or vice versa.
   *
   * FIX 3 — Stale closure fix:
   *   `value` was in the dependency array, causing handlePointerInteraction
   *   to be recreated every time value changed, which in turn recreated
   *   handlePointerDown/Move. Using valueRef avoids that entirely.
   */
  const handlePointerInteraction = useCallback((e) => {
    if (!circleRef.current) return

    // Get circle center from bounding box (not hardcoded)
    const rect = circleRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const newAngle = pointerToAngle(e.clientX, e.clientY, centerX, centerY)

    // ── Anti-wrap: reject jumps larger than 180° ──────────────────────────
    // A smooth drag can never produce a > 180° delta in a single pointer event.
    // This prevents the slider from jumping across the 0°/360° boundary.
    const delta = Math.abs(newAngle - prevAngleRef.current)
    if (delta > 180) return  // ignore this update — user crossed the seam

    prevAngleRef.current = newAngle
    setAngle(newAngle)

    const newValue = angleToValue(newAngle)

    // Only trigger scale animation when value actually changes
    if (newValue !== valueRef.current) {
      valueRef.current = newValue
      setValue(newValue)
      // Subtle scale pop on the center number
      animate(centerScale, [1.05, 1], { duration: 0.2, ease: 'easeOut' })
    }
  }, [centerScale])  // no more `value` dependency — uses valueRef instead

  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    // FIX 3 — Capture pointer so moves outside the element still register
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)

    // On initial click, seed prevAngleRef to the clicked angle so the
    // anti-wrap check doesn't reject the very first interaction.
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
  }, [handlePointerInteraction])

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    handlePointerInteraction(e)
  }, [isDragging, handlePointerInteraction])

  const handlePointerUp = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }, [])

  // ── Derived values ─────────────────────────────────────────────────────────
  const knobPos = angleToPoint(angle, TRACK_RADIUS)
  const progressPath = angle > 0.5
    ? describeArc(TRACK_RADIUS, 0, Math.min(angle, 359.5))
    : ''

  // ── Tick marks ─────────────────────────────────────────────────────────────
  const ticks = []
  for (let i = 0; i < TICK_COUNT; i++) {
    const tickAngle = (i / TICK_COUNT) * 360
    const isMajor = i % 15 === 0  // 0, 15, 30, 45
    const isMinor5 = i % 5 === 0 && !isMajor

    const outerR = INNER_RADIUS + (isMajor ? 8 : isMinor5 ? 4 : 2)
    const innerR = INNER_RADIUS - (isMajor ? 2 : 0)

    const outer = angleToPoint(tickAngle, outerR)
    const inner = angleToPoint(tickAngle, innerR)

    ticks.push(
      <line
        key={i}
        x1={outer.x} y1={outer.y}
        x2={inner.x} y2={inner.y}
        stroke={isMajor ? '#1a1a1a' : 'rgba(0,0,0,0.15)'}
        strokeWidth={isMajor ? 2.5 : 1}
        strokeLinecap="round"
      />
    )
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
          {/* Back navigation — top-left of header, navigates to Short Escapes listing */}
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
          {/* FIX 1 — overflow-visible so the knob shadow/scale is never clipped */}
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
              {progressPath && (
                <path
                  d={progressPath}
                  fill="none"
                  stroke="#1a9df3"
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  className="transition-none"
                  style={{
                    filter: isDragging
                      ? 'drop-shadow(0 0 6px rgba(26, 157, 243, 0.35))'
                      : 'none',
                  }}
                />
              )}

              {/* ── Tick marks ────────────────────────────────────────────── */}
              {ticks}

              {/* ── Draggable knob ────────────────────────────────────────── */}
              <g
                style={{
                  transition: isDragging ? 'none' : 'filter 0.2s ease',
                  filter: isDragging
                    ? 'drop-shadow(0 2px 8px rgba(26, 157, 243, 0.4))'
                    : 'drop-shadow(0 1px 3px rgba(0,0,0,0.12))',
                }}
              >
                {/* Outer ring */}
                <circle
                  cx={knobPos.x}
                  cy={knobPos.y}
                  r={isDragging ? KNOB_SIZE / 2 * 1.1 : KNOB_SIZE / 2}
                  fill="white"
                  stroke="#1a9df3"
                  strokeWidth={3}
                  style={{
                    transition: isDragging ? 'r 0.15s ease-out' : 'r 0.2s ease',
                  }}
                />
                {/* Inner dot */}
                <circle
                  cx={knobPos.x}
                  cy={knobPos.y}
                  r={4}
                  fill="#1a9df3"
                />
              </g>
            </svg>

            {/* ── Center number display ────────────────────────────────────── */}
            <Motion.div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ scale: centerScale }}
              data-node-id="1622:3651"
            >
              <p
                className="text-[34px] text-black leading-none"
                data-node-id="1622:3652"
              >
                {value}
              </p>
              <p
                className="text-[17px] text-black/50 leading-none mt-1"
                data-node-id="1622:3653"
              >
                {value === 1 ? 'Minute' : 'Minutes'}
              </p>
            </Motion.div>
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
            whileHover={{ scale: 1.02, y: -1 }}
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
            {/* Inset shadow overlay — matches Figma */}
            <div className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0px_2px_1px_rgba(255,255,255,0.16),inset_0px_1.2px_1.2px_rgba(255,255,255,0.12),inset_0px_0px_1.2px_1.8px_rgba(0,0,0,0.1)]" />
            Continue
          </Motion.button>
        </div>
      </div>
    </div>
  )
}
