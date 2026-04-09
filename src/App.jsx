import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { IndexPage }          from './pages/IndexPage'
import { DailyStreakPage }    from './pages/DailyStreakPage'
import { TimeCommitmentPage } from './pages/TimeCommitmentPage'
import { ShortEscapePage }    from './pages/ShortEscapePage'
import { SystemControlPanelPage } from './pages/SystemControlPanelPage'
import { SpacecraftFUIPage } from './pages/SpacecraftFUIPage'
import { TaskListPage } from './pages/TaskListPage'

const router = createBrowserRouter([
  { path: '/',                    element: <IndexPage /> },
  { path: '/daily-streak',       element: <DailyStreakPage /> },
  { path: '/time-commitment',    element: <TimeCommitmentPage /> },
  { path: '/short-escape',       element: <ShortEscapePage /> },
  { path: '/system-control',     element: <SystemControlPanelPage /> },
  { path: '/spacecraft-fui',     element: <SpacecraftFUIPage /> },
  { path: '/task-list',          element: <TaskListPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
