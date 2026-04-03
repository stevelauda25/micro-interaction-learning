import { Link } from 'react-router-dom'
import { DailyStreakCard } from '../components/DailyStreakCard'

export function DailyStreakPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      {/* Back nav */}
      <nav className="px-8 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[#6b7280] hover:text-[#111] transition-colors"
          style={{ fontFamily: "'Geist Variable', 'Geist', system-ui, sans-serif" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All interactions
        </Link>
      </nav>

      {/* Centered card stage */}
      <div className="flex-1 flex items-center justify-center px-6 pb-16">
        <DailyStreakCard />
      </div>
    </div>
  )
}
