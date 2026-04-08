import { useState, useCallback } from 'react'
import { motion as Motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { JerryCan } from '../components/fuel/JerryCan'

// ─── Reuse Figma assets from scan-shuttle (shared across spacecraft pages) ───
import headerStripesSvg from '../assets/scan-shuttle/header-stripes.svg'
import backBtnSvg from '../assets/scan-shuttle/back-btn.svg'
import settingsBtnSvg from '../assets/scan-shuttle/settings-btn.svg'
import menuActiveBgSvg from '../assets/scan-shuttle/menu-active-bg.svg'
import menuInactiveBgSvg from '../assets/scan-shuttle/menu-inactive-bg.svg'
import menuArrowActiveSvg from '../assets/scan-shuttle/menu-arrow-active.svg'
import menuArrowInactiveSvg from '../assets/scan-shuttle/menu-arrow-inactive.svg'
import rulerLeftSvg from '../assets/scan-shuttle/ruler-left.svg'
import rulerRightSvg from '../assets/scan-shuttle/ruler-right.svg'
import btnOutlineSvg from '../assets/fuel-system/btn-outline.svg'

// ─── Design tokens (from Figma) ─────────────────────────────────────────────
const CYAN = '#27C3CC'
const AMBER = '#EB9E45'
const FUEL_YELLOW = '#FCB900'
const BG_DARK = '#0A1019'
const WHITE = '#FFFFFF'
const FONT_BDO = "'BDO Grotesk', sans-serif"
const FONT_OXANIUM = "'Oxanium', sans-serif"

const EASE_OUT = [0.22, 1, 0.36, 1]

// ─── Menu items (Figma: menu 03 "Fuel System" is active) ────────────────────
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

// ─── Telemetry labels (Figma nodes 1699:51875 / 1699:51885) ─────────────────
const TELEMETRY_LEFT = [
  'FUEL CONSUMPTION',
  'ENGINE STATUS',
  'FLOW ',
  'BURN RT.',
]
const TELEMETRY_RIGHT = [
  '12.4 L/MIN',
  'STABLE /',
  '3.1 M/S',
  'IDLE',
]


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Dot grid + background circles (shared pattern)
// ═══════════════════════════════════════════════════════════════════════════════
function DotGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 0.5px, transparent 0.5px)',
          backgroundSize: '12.5px 12.5px',
        }}
      />
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
// COMPONENT: Header — Figma node 1699:51901 (same structure as spacecraft page)
// ═══════════════════════════════════════════════════════════════════════════════
function Header({ onBack }) {
  return (
    <Motion.div
      className="relative flex items-end justify-between px-[52px] py-[24px] overflow-hidden"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
    >
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ width: 1461, height: 231 }}
      >
        <img src={headerStripesSvg} alt="" className="w-full h-full" />
      </div>

      <button
        type="button"
        onClick={onBack}
        className="relative w-[40px] h-[40px] cursor-pointer shrink-0 group z-10"
        aria-label="Back to home"
      >
        <img src={backBtnSvg} alt="" className="absolute inset-0 w-full h-full transition-all duration-200 group-hover:drop-shadow-[0_0_6px_rgba(39,195,204,0.4)]" />
      </button>

      <div className="flex items-center gap-[12px] z-10" style={{ fontFamily: FONT_BDO }}>
        <span className="text-[28px] font-medium leading-[1.2]" style={{ color: CYAN }}>B-01</span>
        <span className="text-[28px] font-medium leading-[1.2]" style={{ color: WHITE }}>Artemis</span>
      </div>

      <button
        type="button"
        className="relative w-[40px] h-[40px] cursor-pointer shrink-0 group z-10"
        aria-label="Settings"
      >
        <img src={settingsBtnSvg} alt="" className="absolute inset-0 w-full h-full transition-all duration-200 group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]" />
      </button>
    </Motion.div>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Left menu (Figma: item 03 "Fuel System" active with amber bg)
// ═══════════════════════════════════════════════════════════════════════════════
function MenuItem({ item, isActive, index }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Motion.div
      className="relative w-full h-[56px] flex items-center justify-between px-[24px] py-[10px] select-none shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * index, ease: EASE_OUT }}
    >
      <img
        src={isActive ? menuActiveBgSvg : menuInactiveBgSvg}
        alt=""
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[56px] w-[440px]"
        style={{ maxWidth: '100%' }}
      />

      {/* Hover shine */}
      <AnimatePresence>
        {isHovered && !isActive && (
          <Motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Motion.div
              className="absolute top-0 left-0 h-full w-[60%]"
              style={{ background: 'linear-gradient(110deg, transparent 20%, rgba(39,195,204,0.08) 45%, rgba(39,195,204,0.14) 50%, rgba(39,195,204,0.08) 55%, transparent 80%)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '280%' }}
              transition={{ duration: 1.5, ease: 'linear', repeat: Infinity, repeatDelay: 0.2 }}
            />
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center gap-[12px]" style={{ fontFamily: FONT_BDO }}>
        <span className="text-[22px] font-medium leading-[1.2]" style={{ color: isActive ? 'black' : CYAN }}>
          {item.code}
        </span>
        <span className="text-[22px] font-medium leading-[1.2]" style={{ color: isActive ? 'black' : WHITE }}>
          {item.label}
        </span>
      </div>

      <div className="relative w-[24px] h-[24px] shrink-0">
        <img src={isActive ? menuArrowActiveSvg : menuArrowInactiveSvg} alt="" className="w-full h-full" />
      </div>
    </Motion.div>
  )
}

function LeftMenu() {
  return (
    <nav className="flex flex-col justify-between h-full" aria-label="System modules">
      {MENU_ITEMS.map((item, i) => (
        <MenuItem key={item.code} item={item} isActive={i === 2} index={i} />
      ))}
    </nav>
  )
}


// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: "ADD MORE FUEL" button — Figma node 1697:51713
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
            ? `0 0 20px rgba(252,185,0,0.3), inset 0 0 10px rgba(252,185,0,0.05)`
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
// COMPONENT: Footer — same exact structure as spacecraft page
// ═══════════════════════════════════════════════════════════════════════════════
function BottomBar() {
  return (
    <Motion.div
      className="relative flex items-end px-[52px] py-[24px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex flex-1 gap-[12px] items-end">
        <div className="flex flex-col gap-[4px] items-start flex-1">
          <p className="text-[18px] font-medium uppercase w-full" style={{ fontFamily: FONT_OXANIUM, color: WHITE }}>B312</p>
          <div className="w-full h-[6px]" style={{ backgroundColor: 'rgba(39,195,204,0.3)' }} />
        </div>
        <div className="flex-1 h-[6px]" style={{ backgroundColor: 'rgba(39,195,204,0.09)' }} />
        <div className="flex flex-col gap-[4px] items-start flex-1">
          <p className="text-[18px] font-medium uppercase w-full" style={{ fontFamily: FONT_OXANIUM, color: WHITE }}>AN-12</p>
          <div className="w-full h-[6px]" style={{ backgroundColor: 'rgba(39,195,204,0.3)' }} />
        </div>
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
// MAIN PAGE: FuelSystemPage
//
// Layout from Figma node 1697:51469:
//   - flex gap-[32px] px-[52px] py-[32px]
//   - Left: menu 440px, justify-between
//   - Right: 614px content column, gap-[20px]
//     - orbit/mission header
//     - 650px viewport with rulers, jerry can, telemetry labels
//     - fuel percentage text
//     - "ADD MORE FUEL" button
//
// State:
//   fuelLevel: 0–100 (current fuel amount)
//   isFilling: true during fill animation
// ═══════════════════════════════════════════════════════════════════════════════
export function FuelSystemPage() {
  const navigate = useNavigate()
  const [fuelLevel, setFuelLevel] = useState(42)
  const [isFilling, setIsFilling] = useState(false)
  const [, setIsDragging] = useState(false)

  const isComplete = fuelLevel >= 100

  const handleAddFuel = useCallback(() => {
    if (isFilling || isComplete) return
    setIsFilling(true)
    // Fill to 100% — JerryCan animates the level smoothly
    setFuelLevel(100)
    // Mark fill complete after animation duration
    setTimeout(() => setIsFilling(false), 1600)
  }, [isFilling, isComplete])

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ backgroundColor: BG_DARK }}
    >
      <DotGrid />

      <div className="w-full max-w-[1100px] mx-auto flex flex-col flex-1 min-h-0">
        <Header onBack={() => navigate('/')} />

        {/* Figma: gap-[32px] px-[52px], mt-[24px] */}
        <div className="flex-1 flex min-h-0 px-[52px] gap-[32px] mt-[24px]">

          {/* Left sidebar — menu (Figma: 440px, items justify-between full height) */}
          <Motion.div
            className="w-[440px] shrink-0 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <LeftMenu />
          </Motion.div>

          {/* Right content — Figma node 1697:51534: w-[614px] gap-[20px] */}
          <Motion.div
            className="flex-1 flex flex-col items-center gap-[20px] min-w-0 max-w-[700px]"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
          >
            {/* Orbit / Mission header row */}
            <div className="flex items-center justify-between w-full" style={{ fontFamily: FONT_OXANIUM }}>
              <span className="text-[18px] font-medium uppercase" style={{ color: WHITE }}>ORBIT: LEO TRANSFER</span>
              <span className="text-[18px] font-medium uppercase text-right" style={{ color: WHITE }}>MISSION ID: B01-ARTEMIS</span>
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

              {/* Telemetry labels — Figma: left-[52px] top-0 gap-[16px] */}
              <div className="absolute left-[52px] top-0 flex flex-col gap-[16px] opacity-70">
                {TELEMETRY_LEFT.map((label) => (
                  <p key={label} className="text-[15px] font-medium uppercase" style={{ fontFamily: FONT_OXANIUM, color: CYAN }}>
                    {label}
                  </p>
                ))}
              </div>

              {/* Right values — Figma: left-[486px] top-0 w-[76px] gap-[16px] */}
              <div className="absolute left-[486px] top-0 flex flex-col gap-[16px] items-end opacity-70 w-[76px]">
                {TELEMETRY_RIGHT.map((val, i) => (
                  <p key={i} className="text-[15px] font-medium uppercase text-right w-full" style={{ fontFamily: FONT_OXANIUM, color: CYAN }}>
                    {val}
                  </p>
                ))}
              </div>

              {/* Jerry Can — centered, Figma: left-50% top-calc(50%-7px) w-300 h-428 */}
              <div className="absolute left-1/2 top-[calc(50%-7px)] -translate-x-1/2 -translate-y-1/2">
                <JerryCan
                  fuelLevel={fuelLevel}
                  isFilling={isFilling}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                />
              </div>

              {/* Fuel percentage — Figma: Oxanium SemiBold 24px, centered at y=560 */}
              <p
                className="absolute left-1/2 -translate-x-1/2 top-[560px] text-[24px] font-semibold uppercase"
                style={{ fontFamily: FONT_OXANIUM, color: WHITE }}
              >
                {fuelLevel}% / 100%
              </p>

              {/* "ADD MORE FUEL" button — Figma: centered at bottom, 206×36 */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0">
                <FuelButton
                  onClick={handleAddFuel}
                  isFilling={isFilling}
                  isComplete={isComplete}
                />
              </div>
            </div>
          </Motion.div>
        </div>

        <BottomBar />
      </div>
    </div>
  )
}
