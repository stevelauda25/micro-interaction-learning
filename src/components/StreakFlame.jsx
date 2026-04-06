import { useState, useEffect, useMemo } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'

// ─── Figma MCP Asset ─────────────────────────────────────────────────────────
// node: 1612:13522 — large hero flame (original Figma shape, untouched)
const ASSET_FLAME = 'https://www.figma.com/api/mcp/asset/c93a64a0-cc53-45bb-a59a-ea9c836eed61'

// ─── Phase durations (ms) ────────────────────────────────────────────────────
// Tuned so the full explosion reads as one fluid gesture (~500ms to peak),
// then a slow, satisfying settle while the badge sequence plays out.
const PHASE = {
  anticipation: 100,  // brief dip — builds tension before energy release
  charge:       180,  // scale rising — user feels "something is coming"
  burst:        350,  // peak pop + particles — the emotional high point
  reward:       600,  // glow lingers while badge is in flight
  settle:       500,  // gentle return to idle — no abrupt snap
}

// ─── Easing curves ───────────────────────────────────────────────────────────
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]

// ─── Particle configuration ─────────────────────────────────────────────────
const PARTICLE_COUNT = 5
function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    // Spread in an upward arc — wider than the flame, random jitter
    xOffset: (i - Math.floor(PARTICLE_COUNT / 2)) * 14 + (Math.random() - 0.5) * 10,
    yOffset: -(20 + Math.random() * 16),
    size: 3 + Math.random() * 3,
    delay: Math.random() * 0.1,
  }))
}

// ─── Component ───────────────────────────────────────────────────────────────
// Wraps the original Figma flame image with a multi-phase reward animation.
// The flame shape is NEVER modified — only scale, position, glow, and
// particles animate around it.
//
// Props:
//   triggerAnimation    — flip to true to start the explosion sequence
//   onBurstPeak         — called at the PEAK of the burst (so parent can
//                          start the badge sequence with correct timing)
//   onAnimationComplete — called when the full sequence finishes
//   size                — pixel size of the container (default 163)
export function StreakFlame({
  triggerAnimation = false,
  onBurstPeak,
  onAnimationComplete,
  size = 163,
}) {
  // ── Phase state machine ────────────────────────────────────────────────────
  const [phase, setPhase] = useState('idle')
  const [particles, setParticles] = useState(() => generateParticles())

  // ── Phase sequencer ────────────────────────────────────────────────────────
  // Runs a strict sequential chain: anticipation → charge → burst → reward → settle.
  // The parent is notified at burst peak so it can begin the badge appear
  // while the flame is still in its reward/settle tail.
  useEffect(() => {
    if (!triggerAnimation) return

    let cancelled = false
    const timers = []

    function after(ms) {
      return new Promise(resolve => {
        const t = setTimeout(() => { if (!cancelled) resolve() }, ms)
        timers.push(t)
      })
    }

    async function runSequence() {
      // ── Anticipation: slight scale dip (builds tension) ───────────────
      setPhase('anticipation')
      await after(PHASE.anticipation)

      // ── Charge: scale rising, slight lift ─────────────────────────────
      setPhase('charge')
      await after(PHASE.charge)

      // ── Burst: peak pop + particles + glow ────────────────────────────
      // This is the emotional high point — everything pops at once.
      setParticles(generateParticles())
      setPhase('burst')

      // Signal the parent that the burst has peaked.
      // The badge sequence can safely start now — the flame continues
      // its reward/settle tail independently, so both play in parallel
      // without overlapping the critical "flame reacts first" moment.
      onBurstPeak?.()

      await after(PHASE.burst)

      // ── Reward: glow lingers, flame slightly larger than idle ─────────
      setPhase('reward')
      await after(PHASE.reward)

      // ── Settle: smooth return to idle breathing ───────────────────────
      setPhase('settle')
      await after(PHASE.settle)

      setPhase('idle')
      onAnimationComplete?.()
    }

    runSequence()

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [triggerAnimation, onBurstPeak, onAnimationComplete])

  // ── Per-phase motion values ────────────────────────────────────────────────
  // Each phase has distinct scale + y values so the flame reads as
  // a single fluid gesture: dip → rise → pop → settle.
  const flameMotion = useMemo(() => {
    switch (phase) {
      case 'anticipation':
        // Slight dip — like pulling back a slingshot
        return { scale: 0.95, y: 2 }
      case 'charge':
        // Rising energy — scale increasing, lifting upward
        return { scale: 1.2, y: -4 }
      case 'burst':
        // Peak explosion — biggest scale, highest lift
        return { scale: 1.4, y: -8 }
      case 'reward':
        // Settling larger than idle — "reward state"
        return { scale: 1.1, y: -2 }
      case 'settle':
        return { scale: 1, y: 0 }
      default:
        return { scale: 1, y: 0 }
    }
  }, [phase])

  const flameTransition = useMemo(() => {
    switch (phase) {
      case 'anticipation':
        // Quick, snappy dip
        return { duration: 0.1, ease: 'easeOut' }
      case 'charge':
        // Smooth ramp-up — expo ease gives a "winding up" feel
        return { duration: 0.2, ease: EASE_OUT_EXPO }
      case 'burst':
        // Spring for the pop — overshoot + bounce reads as energetic
        return { type: 'spring', stiffness: 400, damping: 12 }
      case 'reward':
        // Slow, gentle ease — the glow is lingering
        return { duration: 0.6, ease: EASE_OUT_EXPO }
      case 'settle':
        // Smooth return — no harsh snap back to idle
        return { duration: 0.5, ease: 'easeInOut' }
      default:
        return { duration: 0.3 }
    }
  }, [phase])

  const isIdle = phase === 'idle'
  const showGlow = phase === 'burst' || phase === 'reward'
  const showParticles = phase === 'burst' || phase === 'reward'

  return (
    // overflow-visible so scaled flame + particles + glow are never clipped
    <div className="relative overflow-visible" style={{ width: size, height: size }}>

      {/* ── Radial glow (behind flame) ──────────────────────────────────────── */}
      {/* Appears only during burst + reward. Fades out slowly during settle
          so it doesn't vanish abruptly. */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-visible"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.8, ease: 'easeOut' } }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: '150%',
                height: '150%',
                background: 'radial-gradient(circle, rgba(255,150,0,0.3) 0%, rgba(255,150,0,0) 65%)',
                filter: 'blur(10px)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Flame image (original Figma asset — shape untouched) ────────────── */}
      <motion.div
        className="relative w-full h-full"
        animate={flameMotion}
        transition={flameTransition}
      >
        {/* Idle: subtle breathing pulse. During animation phases the
            breathing stops — the parent motion.div handles all scaling. */}
        <motion.img
          src={ASSET_FLAME}
          alt="Streak flame"
          className="size-full object-contain block"
          animate={isIdle ? { scale: [1, 1.03, 1] } : { scale: 1 }}
          transition={isIdle
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.3 }
          }
        />
      </motion.div>

      {/* ── Burst particles ─────────────────────────────────────────────────── */}
      {/* Small circles that fly upward + outward from the flame center,
          fading as they travel. Gives the burst a "sparks" quality. */}
      <AnimatePresence>
        {showParticles && particles.map(p => (
          <motion.div
            key={`particle-${p.id}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              background: 'radial-gradient(circle, #FFD54F, #FF9800)',
              left: '50%',
              top: '35%',
            }}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: p.xOffset,
              y: p.yOffset,
              scale: 0.3,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.7,
              delay: p.delay,
              ease: EASE_OUT_EXPO,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
