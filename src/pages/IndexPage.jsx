import { Link } from 'react-router-dom'

// Registry — add new pages here as you build them
const PAGES = [
  {
    path: '/daily-streak',
    title: 'Daily Streak',
    description: 'Check-in card with flame animation, streak tracker, and bouncing circle fill.',
    status: 'done',
  },
  {
    path: '/time-commitment',
    title: 'Time Commitment Dial',
    description: 'Circular drag slider with smooth arc, knob micro-interactions, and real-time value updates.',
    status: 'done',
  },
  {
    path: '/short-escape',
    title: 'Short Escape',
    description: 'Trip detail page with staggered reveals, accordion days, dropdown, and premium CTA interactions.',
    status: 'done',
  },
  {
    path: '/system-control',
    title: 'System Control Panel',
    description: 'Sci-fi control panel with glitch save effect, CRT popup close, progress bars, and layered interactions.',
    status: 'done',
  },
  {
    path: '/spacecraft-fui',
    title: 'Spacecraft FUI',
    description: 'Cinematic spacecraft interface with 6-phase scan animation, scan line sweep, brightness reveal, and data feedback.',
    status: 'done',
  },
  {
    path: '/task-list',
    title: 'Add Task Morph',
    description: 'Pill button physically morphs into a textarea — one shell tweens width, height, radius, and shadow as a single continuous element.',
    status: 'done',
  },
]

const STATUS_STYLES = {
  done: { label: 'Done',       bg: 'bg-emerald-50',   text: 'text-emerald-600',  dot: 'bg-emerald-400' },
  wip:  { label: 'In progress', bg: 'bg-amber-50',    text: 'text-amber-600',    dot: 'bg-amber-400'   },
  todo: { label: 'Planned',    bg: 'bg-gray-100',     text: 'text-gray-500',     dot: 'bg-gray-400'    },
}

export function IndexPage() {
  return (
    <div
      className="min-h-screen bg-[#f5f5f5]"
      style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
    >
      <div className="max-w-2xl mx-auto px-8 py-16">

        {/* Header */}
        <header className="mb-10">
          <p className="text-[13px] font-medium text-[#9ca3af] uppercase tracking-[0.08em] mb-2">
            Side project
          </p>
          <h1 className="text-[32px] font-semibold leading-tight text-[#111] tracking-[-0.5px] mb-3">
            Micro-interaction<br />Learning
          </h1>
          <p className="text-[15px] text-[#6b7280] leading-relaxed max-w-md">
            A collection of hand-crafted UI interactions built with React,
            Tailwind, and Framer Motion — implemented directly from Figma.
          </p>
        </header>

        {/* Page list */}
        <ul className="flex flex-col gap-3">
          {PAGES.map(({ path, title, description, status }) => {
            const s = STATUS_STYLES[status] ?? STATUS_STYLES.todo
            return (
              <li key={path}>
                <Link
                  to={path}
                  className="group flex items-start justify-between gap-4 bg-white rounded-[12px] border border-[#e5e5e5] px-5 py-4 hover:border-[#d1d5db] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[15px] font-medium text-[#111] group-hover:text-black">
                      {title}
                    </span>
                    <span className="text-[13px] text-[#6b7280] leading-snug truncate">
                      {description}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-0.5">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                      <span className={`size-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>

                    {/* Arrow */}
                    <svg
                      className="text-[#9ca3af] group-hover:text-[#111] group-hover:translate-x-0.5 transition-all duration-150"
                      width="16" height="16" viewBox="0 0 16 16" fill="none"
                      aria-hidden="true"
                    >
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
