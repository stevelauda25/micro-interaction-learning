import { DailyStreakCard } from '../components/DailyStreakCard'
import { BackButton } from "../components/ui/BackButton";

export function DailyStreakPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-full max-w-md px-6">
        
        <BackButton to="/" />

        <div className="mt-6 flex justify-center">
          <DailyStreakCard />
        </div>

      </div>
</div>
  )
}
