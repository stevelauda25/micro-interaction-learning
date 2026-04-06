import { useState, useRef } from 'react'
import {
  motion as Motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion'
import clsx from 'clsx'
import { BackButton } from './ui/BackButton'

// ─── Assets ──────────────────────────────────────────────────────────────────
import heroImg from '../assets/short-escape/hero.png'
import avatar1 from '../assets/short-escape/avatar1.png'
import avatar2 from '../assets/short-escape/avatar2.png'
import activityImg1 from '../assets/short-escape/activity1.png'
import activityImg2 from '../assets/short-escape/activity2.png'
import dropdownAvatar1 from '../assets/short-escape/dropdown-avatar1.png'
import dropdownAvatar2 from '../assets/short-escape/dropdown-avatar2.png'

// ─── Animation config ────────────────────────────────────────────────────────
// Centralized so motion values are easy to tweak without hunting through JSX.

const EASE_OUT = [0.22, 1, 0.36, 1]          // smooth deceleration
const EASE_IN_OUT = [0.42, 0, 0.58, 1]       // symmetric transition

/** Page-level entrance: fade + slide up */
const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: EASE_OUT,
      // Stagger children so content reveals layer by layer
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
}

/** Shared item entrance used by stagger children */
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_OUT },
  },
}

/** Accordion expand/collapse for day content */
const accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: EASE_IN_OUT },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.35, ease: EASE_IN_OUT },
  },
}

/** Dropdown appear/disappear */
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -8,
    scale: 0.97,
    transition: { duration: 0.18, ease: EASE_OUT },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
}

// ─── Data ────────────────────────────────────────────────────────────────────
const TRAVELERS = [
  { name: 'James Miller', avatar: dropdownAvatar1 },
  { name: 'Rachel Grace', avatar: dropdownAvatar2 },
]

const DAYS = [
  {
    label: 'Day 1',
    activities: [
      { time: '6 AM', title: 'Sunrise Landmark', subtitle: 'Iconic viewpoint', image: activityImg1 },
      { time: '1 PM', title: 'Cultural Complex', subtitle: 'Historic architecture', image: activityImg2 },
    ],
  },
  { label: 'Day 2', activities: [] },
  { label: 'Day 3', activities: [] },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function HeroImage() {
  return (
    <Motion.div
      variants={itemVariants}
      className={clsx(
        'relative size-[140px] rounded-[20px] overflow-hidden',
        'border border-black/10',
        'shadow-[0px_1px_2px_0px_rgba(0,0,0,0.04),0px_1px_32px_0px_rgba(0,0,0,0.2)]',
      )}
    >
      {/* White underlay for image transparency */}
      <div className="absolute inset-0 bg-white" aria-hidden="true" />
      <img
        src={heroImg}
        alt="Short Escape trip preview"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Inner shadow overlay — matches Figma's glass-like depth */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[20px] shadow-[inset_0px_-1px_1px_rgba(0,0,0,0.12),inset_0px_1px_1px_rgba(255,255,255,0.25)]"
        aria-hidden="true"
      />
    </Motion.div>
  )
}

function TripInfo({ onToggleTravelers }) {
  return (
    <Motion.div
      variants={itemVariants}
      className="flex items-center gap-3"
    >
      {/* Overlapping avatars */}
      <button
        onClick={onToggleTravelers}
        className={clsx(
          'flex items-center cursor-pointer bg-transparent border-0 p-0',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/20 rounded-full',
        )}
        aria-label="Show travelers"
      >
        <div className="relative size-[52px] z-[1]">
          <img
            src={avatar1}
            alt="Traveler 1"
            className="size-full rounded-full object-cover"
          />
        </div>
        <div className="relative size-[52px] -ml-5">
          <img
            src={avatar2}
            alt="Traveler 2"
            className="size-full rounded-full object-cover"
          />
        </div>
      </button>

      {/* Dot separator */}
      <div className="size-2 rounded-full bg-black/20" aria-hidden="true" />

      <span className="text-[16px] leading-[1.5] text-[#5f6268] whitespace-nowrap">
        3-Days
      </span>
    </Motion.div>
  )
}

function CtaButtons() {
  return (
    <Motion.div variants={itemVariants} className="flex gap-3 items-start">
      {/* Primary CTA — "Start Trip" */}
      <Motion.button
        whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={clsx(
          'relative flex items-center justify-center gap-2 px-5 py-2 rounded-full',
          'border border-white/10 overflow-hidden cursor-pointer',
          'text-[15px] font-medium leading-[1.5] text-white whitespace-nowrap',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40',
        )}
        style={{
          background: '#000',
          textShadow: '0px 2.583px 3.874px rgba(0,0,0,0.05)',
        }}
      >
        Start Trip
        {/* Inset shadow for depth — matches Figma */}
        <div
          className="absolute inset-0 pointer-events-none rounded-full shadow-[inset_0px_2px_1px_rgba(255,255,255,0.04),inset_0px_1.2px_1.2px_rgba(255,255,255,0.08),inset_0px_0px_1.5px_2px_rgba(0,0,0,0.1)]"
          aria-hidden="true"
        />
      </Motion.button>

      {/* Secondary CTA — "Add Another Destination" */}
      <Motion.button
        whileHover={{ y: -1, borderColor: 'rgba(0,0,0,0.2)' }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        className={clsx(
          'flex items-center justify-center gap-2 px-5 py-2 rounded-full',
          'border border-black/10 bg-transparent cursor-pointer',
          'text-[15px] leading-[1.5] text-[#575757] whitespace-nowrap',
          'transition-colors duration-150',
          'hover:bg-black/[0.02]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/20',
        )}
      >
        Add Another Destination
      </Motion.button>
    </Motion.div>
  )
}

function ActivityRow({ time, title, subtitle, image }) {
  return (
    <Motion.div
      variants={itemVariants}
      className="flex items-center gap-5 w-full group"
    >
      {/* Time label */}
      <div className="w-[52px] shrink-0">
        <p className="text-[16px] leading-[1.5] text-[#5f6268] whitespace-nowrap">
          {time}
        </p>
      </div>

      {/* Activity image — subtle hover lift */}
      <Motion.div
        whileHover={{ scale: 1.04, rotate: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={clsx(
          'relative size-[72px] shrink-0 rounded-[12px] overflow-hidden',
          'border-2 border-white',
          'shadow-[0px_0.514px_1.029px_rgba(0,0,0,0.04),0px_0.514px_16.457px_rgba(0,0,0,0.2)]',
        )}
      >
        <div className="absolute inset-0 bg-white" aria-hidden="true" />
        <img
          src={image}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-[12px] shadow-[inset_0px_-0.514px_0.514px_rgba(0,0,0,0.12),inset_0px_0.514px_0.514px_rgba(255,255,255,0.25)]"
          aria-hidden="true"
        />
      </Motion.div>

      {/* Text */}
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <p className="font-medium text-[18px] leading-normal text-black whitespace-nowrap">
          {title}
        </p>
        <p className="text-[16px] leading-[1.5] text-[#5f6268]">
          {subtitle}
        </p>
      </div>
    </Motion.div>
  )
}

function DaySection({ day, index, isExpanded, onToggle }) {
  return (
    <Motion.div variants={itemVariants} className="flex flex-col items-start w-full">
      {/* Day header row — clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className={clsx(
          'flex items-center gap-5 w-full bg-transparent border-0 p-0 cursor-pointer',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/20 rounded-lg',
          'group',
        )}
        aria-expanded={isExpanded}
        aria-controls={`day-content-${index}`}
      >
        <div className="w-[52px] shrink-0">
          <p className="text-[16px] leading-[1.5] text-[#5f6268] whitespace-nowrap text-left">
            {day.label}
          </p>
        </div>

        {/* Dashed line */}
        <div className="flex-1 h-px min-w-0">
          <div className="w-full border-t border-dashed border-black/10" />
        </div>

        {/* Chevron — rotates on expand */}
        <Motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: EASE_IN_OUT }}
          className="size-6 shrink-0 flex items-center justify-center text-[#5f6268] group-hover:text-black/60 transition-colors duration-150"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Motion.div>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {isExpanded && day.activities.length > 0 && (
          <Motion.div
            id={`day-content-${index}`}
            key="content"
            variants={accordionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden w-full"
          >
            <Motion.div
              className="flex flex-col gap-5 pt-5 w-full"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.1, delayChildren: 0.05 },
                },
              }}
            >
              {day.activities.map((activity, i) => (
                <ActivityRow key={i} {...activity} />
              ))}
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Motion.div>
  )
}

function TravelersDropdown({ isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Motion.div
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={clsx(
            'absolute left-0 top-full mt-2 w-[250px] z-20',
            'rounded-[24px] border border-black/10 overflow-hidden p-2',
            'shadow-[0px_1px_2px_rgba(0,0,0,0.04),0px_1px_2px_rgba(0,0,0,0.04)]',
          )}
        >
          {/* White background */}
          <div className="absolute inset-0 bg-white rounded-[24px]" aria-hidden="true" />
          {/* Inset shadow */}
          <div
            className="absolute inset-0 pointer-events-none rounded-[24px] shadow-[inset_0px_-1px_1px_rgba(0,0,0,0.12),inset_0px_1px_1px_rgba(255,255,255,0.25)]"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-1">
            {TRAVELERS.map((person, i) => (
              <Motion.div
                key={person.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.2, ease: EASE_OUT }}
                className={clsx(
                  'flex items-center gap-2 p-1 rounded-[16px] cursor-pointer',
                  'transition-colors duration-150',
                  // Highlight only on hover — no item pre-selected on open
                  'hover:bg-[#f6f6f6]',
                )}
              >
                <div className="size-[36px] shrink-0 rounded-[12px] overflow-hidden">
                  <img
                    src={person.avatar}
                    alt={person.name}
                    className="size-full object-cover"
                  />
                </div>
                <span className="text-[16px] leading-normal text-black whitespace-nowrap">
                  {person.name}
                </span>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function ShortEscape() {
  const [expandedDay, setExpandedDay] = useState(0)  // Day 1 expanded by default
  const [showTravelers, setShowTravelers] = useState(false)
  const dropdownRef = useRef(null)
  const prefersReducedMotion = useReducedMotion()

  // Close dropdown when clicking outside
  function handlePageClick(e) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setShowTravelers(false)
    }
  }

  return (
    <div
      className="bg-[#f5f5f5] min-h-screen flex items-start justify-center"
      style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
      onClick={handlePageClick}
    >
      <Motion.div
        className="w-[400px] pt-8 pb-12 flex flex-col gap-6"
        variants={prefersReducedMotion ? {} : pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Back navigation — top of page, inherits parent padding via w-[400px] container */}
        <BackButton to="/" />

        {/* ── Content Container ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <HeroImage />

          {/* ── Details ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Title + Description */}
            <Motion.div variants={itemVariants} className="flex flex-col gap-1">
              <h1 className="font-semibold text-[32px] leading-normal text-black">
                Short Escape
              </h1>
              <p className="text-[15px] leading-[1.5] text-[#5f6268]">
                A thoughtfully crafted 3-day journey designed around your pace
                and preferences. Explore a mix of experiences, with just the
                right balance between activity and downtime.
              </p>
            </Motion.div>

            {/* Trip info (avatars + duration) with dropdown */}
            <div className="relative" ref={dropdownRef}>
              <TripInfo
                onToggleTravelers={() => setShowTravelers((v) => !v)}
              />
              <TravelersDropdown isOpen={showTravelers} />
            </div>

            {/* CTA Buttons */}
            <CtaButtons />
          </div>
        </div>

        {/* ── Days Container ──────────────────────────────────────────────── */}
        <Motion.div
          variants={itemVariants}
          className="flex flex-col gap-6 w-full"
        >
          {DAYS.map((day, i) => (
            <DaySection
              key={day.label}
              day={day}
              index={i}
              isExpanded={expandedDay === i}
              onToggle={() =>
                setExpandedDay((prev) => (prev === i ? -1 : i))
              }
            />
          ))}
        </Motion.div>
      </Motion.div>
    </div>
  )
}
