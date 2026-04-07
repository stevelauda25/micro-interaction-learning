import { useState, useCallback, useEffect, useRef } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

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


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Dot grid background (matching Figma ellipse pattern)
// ═══════════════════════════════════════════════════════════════════════════════
function DotGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* ── Diagonal stripe texture (Figma: "Mask group" across full page) ──
           Subtle repeating diagonal bars at ~120° that span the entire
           background. Very low opacity (2-3%) to not overpower content.
           This is the "system panel" texture visible in the Figma design. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            120deg,
            transparent 0px,
            transparent 24px,
            rgba(39,195,204,0.025) 24px,
            rgba(39,195,204,0.025) 26px,
            transparent 26px,
            transparent 50px,
            rgba(255,255,255,0.015) 50px,
            rgba(255,255,255,0.015) 52px
          )`,
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 0.5px, transparent 0.5px)',
          backgroundSize: '12.5px 12.5px',
        }}
      />

      {/* ── Background circles — centered on page ──
           Figma shows two concentric ellipses roughly centered. */}
      <div
        className="absolute rounded-full"
        style={{
          width: 952, height: 952,
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(39,195,204,0.06)',
        }}
      />
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
// COMPONENT: Header bar — back button, title, settings
// ═══════════════════════════════════════════════════════════════════════════════
function Header({ onBack }) {
  return (
    <Motion.div
      className="relative flex items-center justify-between px-[32px] py-[20px] overflow-hidden"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      {/* ── Diagonal stripe pattern (Figma: "Mask group" 1697:32347) ──
           Repeating ~120° diagonal bars across the header background.
           Matches the subtle dark stripe texture visible in Figma.
           Uses repeating-linear-gradient with two slightly different
           dark tones to create the striped depth effect. */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            120deg,
            transparent 0px,
            transparent 18px,
            rgba(39,195,204,0.03) 18px,
            rgba(39,195,204,0.03) 20px,
            transparent 20px,
            transparent 38px,
            rgba(255,255,255,0.02) 38px,
            rgba(255,255,255,0.02) 40px
          )`,
          backgroundSize: '40px 100%',
        }}
      />

      {/* Top edge glow line — thin cyan line at header top */}
      <div
        className="absolute top-0 inset-x-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${CYAN} 15%, ${CYAN} 85%, transparent)`,
          opacity: 0.15,
        }}
      />
      {/* Bottom edge line — subtle separator */}
      <div
        className="absolute bottom-0 inset-x-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, ${CYAN} 0%, rgba(39,195,204,0.3) 30%, rgba(39,195,204,0.3) 70%, ${CYAN} 100%)`,
          opacity: 0.1,
        }}
      />

      {/* Back button — using Figma SVG */}
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

      {/* Title */}
      <div className="flex items-center gap-3 z-10" style={{ fontFamily: FONT_BDO }}>
        <span className="text-[28px] font-medium leading-[1.2]" style={{ color: CYAN }}>
          B-01
        </span>
        <span className="text-[28px] font-medium leading-[1.2]" style={{ color: WHITE }}>
          Artemis
        </span>
      </div>

      {/* Settings button — using Figma SVG */}
      <button
        type="button"
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
function MenuItem({ item, isActive, onClick, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Motion.button
      type="button"
      // Figma: each menu item is 56px tall, 24px horizontal padding, 10px vertical
      className="relative w-full h-[56px] flex items-center justify-between px-[24px] py-[10px] cursor-pointer select-none shrink-0"
      onClick={() => onClick(index)}
      onMouseEnter={() => setIsHovered(true)}
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
        style={{ maxWidth: '100%' }}
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
          style={{ color: isActive ? 'black' : CYAN }}
        >
          {item.code}
        </span>
        <Motion.span
          className="text-[22px] font-medium leading-[1.2]"
          style={{ color: isActive ? 'black' : WHITE }}
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
      <div className="relative w-[24px] h-[24px] shrink-0">
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
      {MENU_ITEMS.map((item, i) => (
        <MenuItem
          key={item.code}
          item={item}
          isActive={activeIndex === i}
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
      // Enlarged button: Figma base is 206×36, scaled up for visual dominance
      // as primary CTA — 260×48 feels proportional to the shuttle viewport
      className="relative w-[260px] h-[48px] cursor-pointer select-none"
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

      {/* Label — 14px for enlarged button, tracking for sci-fi feel */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <Motion.span
            key={label}
            className="text-[14px] font-medium uppercase"
            style={{ fontFamily: FONT_BDO, color: CYAN, letterSpacing: '0.1em' }}
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
      {/* Coordinate badges */}
      <div className="absolute left-[52px] top-[107px] flex items-center justify-center px-1 py-0.5 opacity-60"
        style={{ border: `1px solid ${CYAN}` }}>
        <span className="text-[14px] font-medium uppercase" style={{ fontFamily: FONT_OXANIUM, color: CYAN }}>
          20,7 N
        </span>
      </div>
      <div className="absolute right-[52px] top-[107px] flex items-center justify-center px-1 py-0.5 opacity-60"
        style={{ border: `1px solid ${CYAN}` }}>
        <span className="text-[14px] font-medium uppercase" style={{ fontFamily: FONT_OXANIUM, color: CYAN }}>
          88,4 W
        </span>
      </div>

      {/* Left column labels */}
      <div className="absolute left-[52px] top-[149px] flex flex-col gap-3 opacity-70">
        {TELEMETRY_LEFT.map((label, i) => (
          <Motion.p
            key={label}
            className="text-[15px] font-medium uppercase"
            style={{ fontFamily: FONT_OXANIUM, color: CYAN }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: isRevealed ? 1 : 0, x: isRevealed ? 0 : -8 }}
            transition={{ duration: 0.3, delay: scanPhase === 'complete' ? 0.05 * i : 0 }}
          >
            {label}
          </Motion.p>
        ))}
      </div>

      {/* Right column values */}
      <div className="absolute right-[52px] top-[149px] flex flex-col gap-3 items-end opacity-70 w-[62px]">
        {TELEMETRY_RIGHT.map((val, i) => (
          <Motion.p
            key={i}
            className="text-[15px] font-medium uppercase text-right w-full"
            style={{ fontFamily: FONT_OXANIUM, color: CYAN }}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: isRevealed ? 1 : 0, x: isRevealed ? 0 : 8 }}
            transition={{ duration: 0.3, delay: scanPhase === 'complete' ? 0.05 * i : 0 }}
          >
            {val}
          </Motion.p>
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
function ShuttleViewport({
  isScanning,
  scanPhase,
  showFlash,
}) {
  return (
    <div className="relative w-full h-[650px] overflow-hidden">
      {/* Top arc decoration — outer */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[507px] h-[95px]">
        <img src={topArcSvg} alt="" className="w-full h-full" />
      </div>
      {/* Top arc decoration — inner (60% opacity) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[5px] w-[507px] h-[72px] opacity-60">
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

      {/* ─── Rocket container ─── */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[27px] w-[323px] h-[560px]">
        {/* Phase 1: Idle floating animation */}
        <Motion.div
          className="relative w-full h-full"
          animate={
            !isScanning
              ? { y: [0, -4, 0] }
              : { y: 0 }
          }
          transition={
            !isScanning
              ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        >
          {/* Rocket SVG — from Figma (inline, paths preserved) */}
          <img
            src={rocketSvg}
            alt="Space shuttle Artemis"
            className="w-full h-full"
            style={{
              filter: isScanning ? 'brightness(0.85)' : 'brightness(1)',
              transition: 'filter 0.4s ease',
            }}
          />

          {/* Scan effects — grid, dots, looping scan line */}
          <ScanOverlay isScanning={isScanning} />
          <ScanLine isScanning={isScanning} />
          <CompletionFlash trigger={showFlash} />
        </Motion.div>
      </div>

      {/* Telemetry labels */}
      <TelemetryLabels scanPhase={scanPhase} />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Footer system bar — Figma bottom status strip
//
// Structure (matching Figma):
//   ┌─────────────────────────────────────────────────────────┐
//   │ [glow line across top]                                   │
//   │ B312    ┃ ▮▮▮▮ ┃   AN-12     ┃ ▮▮ ┃                    │
//   └─────────────────────────────────────────────────────────┘
//
// - Thin glowing cyan line at top edge
// - Slightly darker background band
// - "B312" left, "AN-12" after first segment
// - Small decorative bar segments between labels
// ═══════════════════════════════════════════════════════════════════════════════
function BottomBar() {
  return (
    <Motion.div
      className="relative px-[32px] py-[10px]"
      style={{ fontFamily: FONT_MONO }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      {/* Top edge — glowing cyan system line */}
      <div
        className="absolute top-0 inset-x-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, ${CYAN}, rgba(39,195,204,0.4) 30%, rgba(39,195,204,0.15) 70%, transparent)`,
        }}
      />
      {/* Subtle glow beneath the line */}
      <div
        className="absolute top-[1px] inset-x-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, rgba(39,195,204,0.08), transparent 50%)`,
        }}
      />

      {/* Bar content — labels + decorative segments */}
      <div className="flex items-center gap-[16px]">
        {/* B312 label */}
        <span className="text-[13px] font-medium tracking-[0.08em] opacity-50" style={{ color: WHITE }}>
          B312
        </span>

        {/* Decorative segment bars — small progress-like bars */}
        <div className="flex items-center gap-[3px]">
          {[16, 10, 6, 12].map((w, i) => (
            <div
              key={i}
              className="h-[3px] rounded-[1px]"
              style={{
                width: w,
                backgroundColor: CYAN,
                opacity: 0.15 - i * 0.02,
              }}
            />
          ))}
        </div>

        {/* Vertical divider */}
        <div className="w-[1px] h-[12px] opacity-10" style={{ backgroundColor: CYAN }} />

        {/* AN-12 label */}
        <span className="text-[13px] font-medium tracking-[0.08em] opacity-50" style={{ color: WHITE }}>
          AN-12
        </span>

        {/* More decorative segments */}
        <div className="flex items-center gap-[3px]">
          {[8, 14, 5, 10, 7].map((w, i) => (
            <div
              key={i}
              className="h-[3px] rounded-[1px]"
              style={{
                width: w,
                backgroundColor: CYAN,
                opacity: 0.1 - i * 0.015,
              }}
            />
          ))}
        </div>
      </div>
    </Motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE: SpacecraftFUIPage
//
// State machine:
//   idle → scanning → complete → idle (reset after delay)
//
// Scan sequence:
//   1. IDLE: shuttle floats, data visible, button ready
//   2. TRIGGER: click → UI dims, looping scan starts
//   3. SCAN LOOP: line sweeps top↔bottom rapidly (~1s/pass, 5 passes)
//   4. ACTIVE FEEDBACK: grid, pulsing dots, brightness overlay
//   5. COMPLETION (5s): flash, button → "SCANNED ✓", auto-reset
// ═══════════════════════════════════════════════════════════════════════════════
export function SpacecraftFUIPage() {
  const navigate = useNavigate()
  const [activeMenuIndex, setActiveMenuIndex] = useState(0)

  // ─── Scan state machine ─────────────────────────────────────────────────
  const [scanPhase, setScanPhase] = useState('idle') // idle | scanning | complete
  const isScanning = scanPhase === 'scanning'
  const isComplete = scanPhase === 'complete'
  const [showFlash, setShowFlash] = useState(false)

  // Timeout refs for cleanup
  const scanTimerRef = useRef(null)
  const resetTimerRef = useRef(null)

  const handleScan = useCallback(() => {
    if (scanPhase !== 'idle') return

    // Phase 2: TRIGGER — start looping scan
    setScanPhase('scanning')

    // ── Scan loop logic ──
    // Scan line loops autonomously via Framer Motion (repeat: Infinity).
    // After exactly 5 seconds, we stop scanning and trigger completion.
    scanTimerRef.current = setTimeout(() => {
      // Phase 5: COMPLETION
      setShowFlash(true)
      setScanPhase('complete')

      setTimeout(() => setShowFlash(false), 600)

      // Auto-reset after 3 seconds
      resetTimerRef.current = setTimeout(() => {
        setScanPhase('idle')
      }, 3000)
    }, 5000)
  }, [scanPhase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: BG_DARK }}
    >
      <DotGrid />

      {/* ── Page max-width constraint ──
           Figma frame is 1200×960. Constraining to 1100px max-width
           prevents the layout from feeling too wide on large monitors.
           Centered with mx-auto. */}
      <div className="w-full max-w-[1100px] mx-auto flex flex-col flex-1 min-h-0">

        {/* Header */}
        <Header onBack={() => navigate('/')} />

        {/* ── Top spacing: header → body ──
             Figma shows ~32px gap between header bottom and content top */}
        <div className="flex-1 flex min-h-0 px-[32px] gap-[32px] mt-[32px]">

          {/* Left sidebar — menu (Figma: 440px width) */}
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

          {/* Right content — shuttle viewport
               Increased max-width to 700px to better fill the available space
               and match Figma proportions (shuttle area ~611px + label margins). */}
          <Motion.div
            className="flex-1 flex flex-col items-center gap-[20px] min-w-0 max-w-[700px]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{
              opacity: isScanning ? 0.92 : 1,
              scale: 1,
            }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
          >
            {/* Orbit / Mission header row — Figma: 18px Oxanium Medium */}
            <div
              className="flex items-center justify-between w-full"
              style={{ fontFamily: FONT_OXANIUM }}
            >
              <span className="text-[18px] font-medium uppercase" style={{ color: WHITE }}>
                ORBIT: LEO TRANSFER
              </span>
              <span className="text-[18px] font-medium uppercase text-right" style={{ color: WHITE }}>
                MISSION ID: B01-ARTEMIS
              </span>
            </div>

            {/* Shuttle viewport */}
            <ShuttleViewport
              isScanning={isScanning}
              scanPhase={scanPhase}
              showFlash={showFlash}
            />

            {/* Scan button — centered below viewport */}
            <ScanButton
              isScanning={isScanning}
              isComplete={isComplete}
              onClick={handleScan}
            />
          </Motion.div>
        </div>

        {/* Bottom bar */}
        <BottomBar />
      </div>
    </div>
  )
}
