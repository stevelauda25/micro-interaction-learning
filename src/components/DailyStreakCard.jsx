import { useState, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import clsx from 'clsx'

// ─── Figma MCP Assets (regenerate after 7 days via MCP) ───────────────────────
// node: 1612:13529 — close/X icon
const ASSET_CLOSE   = 'https://www.figma.com/api/mcp/asset/4ba07f29-b63c-4038-b489-7f2162123c42'
// node: 1612:13522 — large hero flame
const ASSET_FLAME   = 'https://www.figma.com/api/mcp/asset/c93a64a0-cc53-45bb-a59a-ea9c836eed61'
// node: 1612:13536 — filled day flame (48×48 slot)
const ASSET_DAY_ON  = 'https://www.figma.com/api/mcp/asset/715ae1d1-e578-4177-87b0-40a16cd04925'
// node: 1612:13585 — empty day circle (48×48 slot)
const ASSET_DAY_OFF = 'https://www.figma.com/api/mcp/asset/897b0c85-18c1-4d31-adb4-7ffac14c5584'

// ─── Animation tuning ─────────────────────────────────────────────────────────
const ANIM = {
  shineDuration:    1.5,   // seconds for one shine sweep
  shineRepeatEvery: 3.5,   // seconds between sweeps (idle)
  // FIX 3: split the old single 0.65s call into 3 sequential steps
  badgeAppear:      0.4,   // step 1 — fade in + scale up at spawn
  badgePause:       0.25,  // step 2 — brief hold before travel
  badgeTravel:      0.9,   // step 3 — move down to circle
  circleBounce:     0.3,   // step 5 — bounce after fill
  labelDelay:       0.2,   // seconds before "DAY X STREAK!" appears
  labelDuration:    0.35,  // fade-in duration for the label
}

// ─── Week layout ──────────────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Which day index is "today" (first empty slot in the design = Thu = 4)
const TODAY_INDEX = 4

// ─── easing curves ────────────────────────────────────────────────────────────
const EASE_OUT_EXPO  = [0.16, 1, 0.3, 1]
const EASE_SPRING    = [0.34, 1.56, 0.64, 1]  // spring-like overshoot

// ─── Component ────────────────────────────────────────────────────────────────
export function DailyStreakCard() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [currentStreak, setCurrentStreak]   = useState(4)
  const [checkedInToday, setCheckedInToday] = useState(false)
  const [isAnimating, setIsAnimating]       = useState(false)
  const [showLabel, setShowLabel]           = useState(false)
  const [filledDays, setFilledDays]         = useState(
    [true, true, true, true, false, false, false]
  )

  // Badge floater state: absolute position relative to card, and visibility
  const [badge, setBadge] = useState({ visible: false, x: 0, y: 0 })

  // ── Refs ───────────────────────────────────────────────────────────────────
  const cardRef        = useRef(null)  // card container — anchor for all abs math
  const flameRef       = useRef(null)  // large hero flame — badge spawn origin
  const todayCircleRef = useRef(null)  // today's streak slot — badge destination
  const badgeRef       = useRef(null)  // the floating "+1" DOM node

  // ── Check-in handler ───────────────────────────────────────────────────────
  async function handleCheckIn() {
    if (checkedInToday || isAnimating) return
    setIsAnimating(true)

    // ── Measure bounding boxes relative to the card wrapper ─────────────────
    const cardRect  = cardRef.current.getBoundingClientRect()
    const flameRect = flameRef.current.getBoundingClientRect()
    const circRect  = todayCircleRef.current.getBoundingClientRect()

    // FIX 2: spawn at TOP-RIGHT corner of the hero flame (was center-bottom)
    const BADGE_HALF = 14  // half of approximate badge width for centering
    const spawnX = flameRect.right - cardRect.left - BADGE_HALF
    const spawnY = flameRect.top   - cardRect.top  - 10  // slight bleed above top edge

    // Land at center of today's streak circle
    const landX = circRect.left + circRect.width  / 2 - cardRect.left - BADGE_HALF
    const landY = circRect.top  + circRect.height / 2 - cardRect.top  - 10

    // Mount the badge (invisible — STEP 1 will fade it in)
    setBadge({ visible: true, x: spawnX, y: spawnY })

    // Wait 2 frames so the badge DOM node exists before we imperatively animate it
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    // FIX 3 ─ STEP 1: fade in + scale up at spawn position (~400ms)
    await animate(
      badgeRef.current,
      { opacity: [0, 1], scale: [0.5, 1.1] },
      { duration: ANIM.badgeAppear, ease: 'easeOut' }
    )

    // FIX 3 ─ STEP 2: brief pause so the user registers where "+1" came from
    await new Promise(r => setTimeout(r, ANIM.badgePause * 1000))

    // FIX 3 ─ STEP 3: travel DOWN to the circle (~900ms, smooth easeOut)
    // opacity fades out in the last third of travel so it "merges" into the circle
    await animate(
      badgeRef.current,
      {
        x: landX - spawnX,
        y: landY - spawnY,
        scale: [1.1, 1, 0.85],
        opacity: [1, 1, 0],
      },
      { duration: ANIM.badgeTravel, ease: EASE_OUT_EXPO }
    )

    setBadge(prev => ({ ...prev, visible: false }))

    // FIX 3 ─ STEP 4: activate the circle — flip filledDays state
    setFilledDays(prev => {
      const next = [...prev]
      next[TODAY_INDEX] = true
      return next
    })

    // Wait 1 frame so React re-renders the filled flame before we bounce it
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

    // FIX 3 ─ STEP 5: bounce the circle (scale 1 → 1.15 → 1, ~300ms)
    await animate(
      todayCircleRef.current,
      { scale: [1, 1.15, 1] },
      { duration: ANIM.circleBounce, ease: EASE_SPRING }
    )

    // STEP 6: increment streak counter + reveal label
    setCurrentStreak(s => s + 1)
    await new Promise(r => setTimeout(r, ANIM.labelDelay * 1000))
    setShowLabel(true)

    setIsAnimating(false)
    setCheckedInToday(true)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Outer wrapper holds the absolute-positioned badge without layout shift
    <div ref={cardRef} className="relative">

      {/* ── Card shell ──────────────────────────────────────────────────────── */}
      <motion.div
        className={clsx(
          'relative w-[450px] bg-white rounded-[20px]',
          'border border-black/10',
          'shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_1px_2px_rgba(0,0,0,0.04)]',
          'overflow-hidden',
        )}
        // Bonus: subtle lift on card hover
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
          {/* Spacer so title stays centered (mirrors close-btn width) */}
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
            className="flex flex-col gap-6 items-center overflow-hidden relative"
            data-node-id="1612:13509"
          >
            {/* Flame container — ref used for badge spawn math */}
            <div
              ref={flameRef}
              className="relative size-[163px]"
              data-node-id="1612:13522"
            >
              <img
                src={ASSET_FLAME}
                alt="Streak flame"
                className="size-full object-contain block"
              />

              {/*
               * ── Idle shine sweep (RIGHT → LEFT) ──────────────────────────
               * A rotated diagonal stripe (matching Figma node 1617:3570)
               * animates from the right edge to the left edge, clipped to
               * the flame bounding box.  Runs every ~3.5 s, pausing between.
               */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ rotate: '30.22deg' }}
                  // We translate the stripe container: start fully right, end fully left
                  animate={{ x: ['160%', '-160%'] }}
                  transition={{
                    duration:    ANIM.shineDuration,
                    repeat:      Infinity,
                    repeatDelay: ANIM.shineRepeatEvery,
                    ease:        'easeInOut',
                    repeatType:  'loop',
                  }}
                >
                  {/* The stripe itself — matches Figma gradient */}
                  <div
                    className="h-[190px] w-[37px]"
                    style={{
                      background:
                        'linear-gradient(91.55deg, rgba(255,255,255,0.35) 5.8%, rgba(255,255,255,0) 93.6%)',
                    }}
                  />
                </motion.div>
              </div>

              {/* ── "DAY X STREAK!" label (appears after check-in) ────────── */}
              <AnimatePresence>
                {showLabel && (
                  <motion.div
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
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

                  {/*
                   * The circle / flame slot.
                   * When TODAY_INDEX is targeted by the badge, this element
                   * is bounce-animated via its ref.
                   */}
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
                            /* Only animate entry for today's slot; rest start static */
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
                          {/*
                           * FIX 1: match Figma node 1612:13536 structure exactly.
                           * Applying inset directly to <img> with width/height:auto
                           * doesn't stretch it — the browser uses intrinsic dimensions.
                           * A positioned wrapper div gives the img a proper containing
                           * block so size-full (100%×100%) fills the inset area.
                           */}
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
            // Bonus: hover lift + press press
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
            {/* Inset shadow overlay — matches Figma */}
            <div className="absolute inset-0 pointer-events-none rounded-[8px] shadow-[inset_0px_-2px_2px_rgba(0,0,0,0.1)]" />
            {checkedInToday ? 'Checked In ✓' : 'Check In'}
          </motion.button>
        </div>
      </motion.div>

      {/*
       * ── Floating "+1" badge ────────────────────────────────────────────────
       * Lives OUTSIDE the card (but inside cardRef's wrapper) so overflow:hidden
       * on the card doesn't clip it mid-flight.
       * Position is set imperatively from bounding-box math in handleCheckIn.
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
