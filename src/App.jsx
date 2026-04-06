import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { IndexPage }          from './pages/IndexPage'
import { DailyStreakPage }    from './pages/DailyStreakPage'
import { TimeCommitmentPage } from './pages/TimeCommitmentPage'
import { ShortEscapePage }    from './pages/ShortEscapePage'

const router = createBrowserRouter([
  { path: '/',                element: <IndexPage /> },
  { path: '/daily-streak',   element: <DailyStreakPage /> },
  { path: '/time-commitment', element: <TimeCommitmentPage /> },
  { path: '/short-escape',   element: <ShortEscapePage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
