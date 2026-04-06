import { useState, useRef, useCallback } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, animate } from 'framer-motion'
import clsx from 'clsx'
import { StreakFlame } from './StreakFlame'

// ─── Figma MCP Assets (regenerate after 7 days via MCP) ───────────────────────
// node: 1612:13529 — close/X icon
const ASSET_CLOSE   = 'https://www.figma.com/api/mcp/asset/4ba07f29-b63c-4038-b489-7f2162123c42'
// node: 1612:13536 — filled day flame (48×48 slot)
const ASSET_DAY_ON  = 'https://www.figma.com/api/mcp/asset/715ae1d1-e578-4177-87b0-40a16cd04925'
// node: 1612:13585 — empty day circle (48×48 slot)
const ASSET_DAY_OFF = 'https://www.figma.com/api/mcp/asset/897b0c85-18c1-4d31-adb4-7ffac14c5584'

// ─── Animation tuning ─────────────────────────────────────────────────────────
// Each value is the duration of one discrete step in the sequence.
// The sequence is STRICTLY SEQUENTIAL — no two phases overlap.
//
// Why these values?
//   - Short phases (appear, pause) keep things snappy
//   - Longer phases (travel, morph) give the eye time to track motion
//   - Micro-pauses between phases create "breaths" that prevent
//     the animation from feeling mechanical or rushed
const ANIM = {
  shineDuration:    1.5,   // seconds — one idle shine sweep
  shineRepeatEvery: 3.5,   // seconds — gap between sweeps
  flameToBody:      0.15,  // seconds — pause after flame burst before badge appears
  badgeAppear:      0.45,  // seconds — +1 fades in + spring scale at spawn
  badgePause:       0.2,   // seconds — hold so user reads "+1" before it moves
  badgeTravel:      0.95,  // seconds — smooth drop to target circle
  morphShrink:      0.2,   // seconds — circle contracts before swap
  morphExpand:      0.35,  // seconds — flame pops in with bounce
  rewardBounce:     0.35,  // seconds — final celebratory bounce
  labelDelay:       0.2,   // seconds — breath before label
  labelDuration:    0.35,  // seconds — label fade-in
}

// ─── Week layout ──────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TODAY_INDEX = 4  // Thu — first empty slot in the Figma design

// ─── Easing curves ────────────────────────────────────────────────────────────
// Expo out: fast start → long gentle tail. Perfect for travel animations
// where the object should "land" softly.
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]
// Spring-like cubic: overshoots then settles. Gives bounces a playful,
// elastic quality without needing a spring physics config.
const EASE_SPRING   = [0.34, 1.56, 0.64, 1]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const delay = (s) => new Promise(r => setTimeout(r, s * 1000))
const frames = (n = 2) =>
  new Promise(r => {
    let count = 0
    const tick = () => { if (++count >= n) r(); else requestAnimationFrame(tick) }
    requestAnimationFrame(tick)
  })

// ─── Component ────────────────────────────────────────────────────────────────
export function DailyStreakCard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [currentStreak, setCurrentStreak]   = useState(4)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [isAnimating, setIsAnimating]       = useState(false)
  const [showLabel, setShowLabel]           = useState(false)
  const [triggerFlame, setTriggerFlame]     = useState(false)
  const [filledDays, setFilledDays]         = useState(
    [true, true, true, true, false, false, false]
  )

  // Badge floater: absolute position relative to cardRef
  const [badge, setBadge] = useState({ visible: false, x: 0, y: 0 })

  // ── Refs ───────────────────────────────────────────────────────────────────
  const cardRef         = useRef(null)
  const flameRef        = useRef(null)
  const todayCircleRef  = useRef(null)
  const badgeRef        = useRef(null)
  // Resolves when StreakFlame hits its burst peak — the signal to start badge
  const burstResolverRef = useRef(null)

  // ── Flame callbacks ────────────────────────────────────────────────────────
  // Called by StreakFlame at the PEAK of its burst phase.
  // This is the handoff point: the flame has reacted, now the badge can appear.
  const handleBurstPeak = useCallback(() => {
    burstResolverRef.current?.()
  }, [])

  // Called when the flame finishes its full settle sequence.
  const handleFlameComplete = useCallback(() => {
    setTriggerFlame(false)
  }, [])

  // ── Check-in handler ───────────────────────────────────────────────────────
  //
  // ANIMATION SEQUENCE — strictly sequential, each phase completes before
  // the next begins. This is critical for a "premium reward" feel:
  //
  //   1. FLAME EXPLOSION    → user feels the flame react (emotion)
  //   2. BADGE APPEAR (+1)  → reward materialises near flame
  //   3. BADGE TRAVEL        → reward moves to target (clear direction)
  //   4. CIRCLE MORPH        → empty slot transforms (satisfying swap)
  //   5. REWARD BOUNCE       → filled flame bounces (celebration)
  //   6. LABEL APPEAR        → confirmation text ("DAY 5 STREAK!")
  //
  // Why sequential? Simultaneous animations feel chaotic and mechanical.
  // Staggering creates narrative — anticipation, action, payoff.
  async function handleCheckIn() {
    if (checkedInToday || isAnimating) return
    setIsAnimating(true)

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 1 — FLAME EXPLOSION (fires first, alone)
    // ═══════════════════════════════════════════════════════════════════════
    // The flame must react BEFORE anything else happens.
    // User clicks → flame dips (anticipation) → charges up → pops.
    // We wait for the burst peak signal before proceeding.
    const burstPromise = new Promise(r => { burstResolverRef.current = r })
    setTriggerFlame(true)
    await burstPromise

    // Micro-pause after burst peak — lets the user register the flame
    // reaction before the +1 badge draws their attention elsewhere.
    await delay(ANIM.flameToBody)

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 2 — BADGE APPEAR (+1 materialises near flame)
    // ═══════════════════════════════════════════════════════════════════════
    // Badge spawns at the top-right of the hero flame — this is where
    // the user's eye naturally tracks after the burst.
    const cardRect  = cardRef.current.getBoundingClientRect()
    const flameRect = flameRef.current.getBoundingClientRect()
    const circRect  = todayCircleRef.current.getBoundingClientRect()

    const BADGE_HALF = 14
    const spawnX = flameRect.right - cardRect.left - BADGE_HALF
    const spawnY = flameRect.top   - cardRect.top  - 10
    const landX  = circRect.left + circRect.width  / 2 - cardRect.left - BADGE_HALF
    const landY  = circRect.top  + circRect.height / 2 - cardRect.top  - 10

    setBadge({ visible: true, x: spawnX, y: spawnY })
    await frames(2)

    // Spring-like pop: scale overshoots to 1.15 then settles to 1.
    // The overshoot makes the badge feel like it "pops into existence"
    // rather than just fading in.
    await animate(
      badgeRef.current,
      { opacity: [0, 1], scale: [0.6, 1.15, 1] },
      { duration: ANIM.badgeAppear, ease: EASE_SPRING }
    )

    // Brief hold — user needs time to read "+1" before it moves.
    // Without this pause, the badge blurs into the travel and
    // the reward value is lost.
    await delay(ANIM.badgePause)

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 3 — BADGE TRAVEL (smooth drop to target circle)
    // ═══════════════════════════════════════════════════════════════════════
    // Expo easeOut: fast launch → slow landing. The long tail gives the
    // user's eye time to track the badge to its destination.
    // Opacity fades in the last third so the badge "merges" into the circle.
    await animate(
      badgeRef.current,
      {
        x: landX - spawnX,
        y: landY - spawnY,
        scale: [1, 0.95, 0.85],
        opacity: [1, 1, 0],
      },
      { duration: ANIM.badgeTravel, ease: EASE_OUT_EXPO }
    )

    setBadge(prev => ({ ...prev, visible: false }))

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 4 — CIRCLE MORPH (empty → flame, with transformation illusion)
    // ═══════════════════════════════════════════════════════════════════════
    // The empty circle must NOT hard-swap to a flame. Instead:
    //   1. Circle contracts + dims (absorbing energy)
    //   2. State flips (invisible — happens at smallest scale)
    //   3. Flame expands out with a bounce
    //
    // This creates the illusion of transformation rather than replacement.

    // Step 1: Shrink + dim the empty circle (absorbing the badge energy)
    await animate(
      todayCircleRef.current,
      { scale: [1, 0.8], opacity: [1, 0.5] },
      { duration: ANIM.morphShrink, ease: 'easeIn' }
    )

    // Step 2: Flip state at the contracted point — visually seamless
    // because the element is small + dim.
    setFilledDays(prev => {
      const next = [...prev]
      next[TODAY_INDEX] = true
      return next
    })

    await frames(2)

    // Step 3: Expand the new flame out with spring-like bounce.
    // Starting from the contracted scale makes it feel like the
    // circle "hatched" into a flame.
    await animate(
      todayCircleRef.current,
      { scale: [0.8, 1.1, 1], opacity: [0.5, 1, 1] },
      { duration: ANIM.morphExpand, ease: EASE_SPRING }
    )

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 5 — REWARD BOUNCE (celebratory pop on the filled slot)
    // ═══════════════════════════════════════════════════════════════════════
    // A second, larger bounce — this is the "reward confirmation" moment.
    // The overshoot to 1.25 is bigger than the morph bounce (1.1) so it
    // reads as a distinct celebration rather than a continuation.
    await animate(
      todayCircleRef.current,
      { scale: [1, 1.25, 1] },
      { duration: ANIM.rewardBounce, ease: EASE_SPRING }
    )

    // Update streak counter AFTER the morph + bounce — so the number
    // change coincides with the visual confirmation, not the click.
    setCurrentStreak(s => s + 1)

    // ═══════════════════════════════════════════════════════════════════════
    // PHASE 6 — LABEL APPEAR (final confirmation text)
    // ═══════════════════════════════════════════════════════════════════════
    // "DAY 5 STREAK!" fades in as the last beat — the narrative payoff.
    // Appears only after all motion has settled.
    await delay(ANIM.labelDelay)
    setShowLabel(true)

    setIsAnimating(false)
    setCheckedInToday(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={cardRef} className="relative">

      {/* ── Card shell ──────────────────────────────────────────────────────── */}
      <motion.div
        className={clsx(
          'relative w-[450px] bg-white rounded-[20px]',
          'border border-black/10',
          'shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_1px_2px_rgba(0,0,0,0.04)]',
          'overflow-hidden',
        )}
        whileHover={{ scale: 1.005, y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        data-node-id="1612:13419"
      >
        {/* inset border highlight — matches Figma */}
        <div className="absolute inset-0 pointer-events-none rounded-[20px] shadow-[inset_0px_-1px_1px_rgba(0,0,0,0.12),inset_0px_1px_1px_rgba(255,255,255,0.25)]" />

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-end justify-between px-7 py-5"
          data-node-id="1612:13420"
        >
          <div className="size-9 rounded-full shrink-0" />

          <p
            className="font-medium text-[20px] leading-[1.5] text-[#020a1d] whitespace-nowrap"
            style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
            data-node-id="1612:13498"
          >
            Daily Streak
          </p>

          <button
            className="flex items-center justify-center size-9 rounded-full border border-black/10 hover:bg-gray-50 transition-colors shrink-0"
            aria-label="Close"
            data-node-id="1612:13528"
          >
            <img src={ASSET_CLOSE} alt="" className="size-5 block" />
          </button>
        </div>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-6 items-center px-7"
          data-node-id="1612:13600"
        >
          {/* ── Hero flame + shine sweep ─────────────────────────────────── */}
          <div
            className="flex flex-col gap-6 items-center overflow-visible relative"
            data-node-id="1612:13509"
          >
            {/* Flame container — ref used for badge spawn math */}
            <div
              ref={flameRef}
              className="relative size-[163px]"
              data-node-id="1612:13522"
            >
              <StreakFlame
                triggerAnimation={triggerFlame}
                onBurstPeak={handleBurstPeak}
                onAnimationComplete={handleFlameComplete}
                size={163}
              />

              {/*
               * ── Idle shine sweep (RIGHT → LEFT) ──────────────────────────
               * Rotated diagonal stripe matching Figma node 1617:3570.
               * Clipped to the flame bounding box.
               */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ rotate: '30.22deg' }}
                  animate={{ x: ['160%', '-160%'] }}
                  transition={{
                    duration:    ANIM.shineDuration,
                    repeat:      Infinity,
                    repeatDelay: ANIM.shineRepeatEvery,
                    ease:        'easeInOut',
                    repeatType:  'loop',
                  }}
                >
                  <div
                    className="h-[190px] w-[37px]"
                    style={{
                      background:
                        'linear-gradient(91.55deg, rgba(255,255,255,0.35) 5.8%, rgba(255,255,255,0) 93.6%)',
                    }}
                  />
                </motion.div>
              </div>

              {/* ── "DAY X STREAK!" label (Phase 6 — appears last) ────────── */}
              {/* FIX: positioned below the flame using top:100% + margin
                  instead of -bottom-8, so it never overlaps the flame. */}
              <AnimatePresence>
                {showLabel && (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
                    style={{ top: '100%', marginTop: 8 }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: ANIM.labelDuration, ease: 'easeOut' }}
                  >
                    <span
                      className="text-[15px] text-[#ff7e00] tracking-[0.4px] uppercase"
                      style={{ fontFamily: "'Luckiest Guy', sans-serif" }}
                    >
                      DAY {currentStreak} STREAK!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Week tracker ────────────────────────────────────────────────── */}
          <div
            className="bg-white border border-[#e5e5e5] rounded-[8px] w-full overflow-hidden"
            data-node-id="1612:13531"
          >
            {/* Day columns */}
            <div
              className="flex items-start justify-between px-4 py-3 border-b border-[#e5e5e5]"
              data-node-id="1612:13532"
            >
              {DAYS.map((day, i) => (
                <div
                  key={day}
                  className="flex flex-col gap-1 items-center"
                  data-node-id={`day-col-${i}`}
                >
                  <p
                    className="text-[14px] font-medium leading-[1.5] text-[#101828] text-center w-min"
                    style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
                  >
                    {day}
                  </p>

                  <div
                    ref={i === TODAY_INDEX ? todayCircleRef : null}
                    className="relative size-[48px] overflow-hidden"
                    data-node-id={`streak-slot-${i}`}
                  >
                    <AnimatePresence mode="wait">
                      {filledDays[i] ? (
                        <motion.div
                          key="on"
                          className="absolute inset-0"
                          initial={
                            i === TODAY_INDEX
                              ? { scale: 0.5, opacity: 0 }
                              : false
                          }
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type:      'spring',
                            stiffness: 420,
                            damping:   14,
                          }}
                        >
                          <div
                            className="absolute"
                            style={{ top: '10%', right: '18.34%', bottom: '10.96%', left: '20%' }}
                          >
                            <img
                              src={ASSET_DAY_ON}
                              alt={`${day} streak complete`}
                              className="absolute block max-w-none size-full"
                            />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="off"
                          className="absolute inset-0"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          <img
                            src={ASSET_DAY_OFF}
                            alt={`${day} streak empty`}
                            className="absolute block max-w-none size-full"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>

            {/* Motivational message */}
            <div
              className="flex items-center justify-center p-4"
              data-node-id="1612:13575"
            >
              <p
                className="flex-1 text-[14px] leading-normal text-[#101828] text-center"
                style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
                data-node-id="1612:13576"
              >
                {checkedInToday ? (
                  <>
                    <span>Amazing! You&apos;re on a </span>
                    <span className="font-semibold text-[#ff7e00]">
                      {currentStreak}-day streak!
                    </span>
                  </>
                ) : (
                  <>
                    <span>You&apos;re on a roll! Get your milestone in </span>
                    <span className="font-semibold text-[#ff7e00]">3 days.</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer / CTA button ──────────────────────────────────────────── */}
        <div className="px-7 pt-5 pb-7" data-node-id="1612:13601">
          <motion.button
            onClick={handleCheckIn}
            disabled={checkedInToday || isAnimating}
            whileHover={
              !checkedInToday && !isAnimating
                ? { scale: 1.02, y: -2 }
                : {}
            }
            whileTap={
              !checkedInToday && !isAnimating
                ? { scale: 0.97, y: 2 }
                : {}
            }
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={clsx(
              'relative w-full rounded-[8px] py-3 px-3',
              'border border-white/40',
              'text-white text-[18px] tracking-[0.4px] uppercase',
              'shadow-[0px_4px_2px_rgba(0,0,0,0.25),0px_4px_0px_#0b84d4]',
              'transition-opacity duration-200',
              checkedInToday || isAnimating
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer',
            )}
            style={{
              fontFamily:  "'Luckiest Guy', sans-serif",
              background:  '#1a9df3',
              textShadow:  '0px 2px 0px rgba(0,0,0,0.03)',
            }}
            data-node-id="1612:13598"
          >
            <div className="absolute inset-0 pointer-events-none rounded-[8px] shadow-[inset_0px_-2px_2px_rgba(0,0,0,0.1)]" />
            {checkedInToday ? 'Checked In \u2713' : 'Check In'}
          </motion.button>
        </div>
      </motion.div>

      {/*
       * ── Floating "+1" badge ────────────────────────────────────────────────
       * Lives OUTSIDE the card (but inside cardRef) so overflow:hidden
       * on the card doesn't clip it mid-flight.
       */}
      {badge.visible && (
        <div
          ref={badgeRef}
          className={clsx(
            'absolute z-20 pointer-events-none',
            'bg-[#ff7e00] text-white text-[13px] font-bold',
            'rounded-full px-2.5 py-0.5',
            'shadow-[0px_2px_8px_rgba(255,126,0,0.4)]',
            'will-change-transform',
          )}
          style={{
            left: badge.x,
            top:  badge.y,
            fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif",
          }}
        >
          +1
        </div>
      )}
    </div>
  )
}
