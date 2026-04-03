import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import { IndexPage }      from './pages/IndexPage'
import { DailyStreakPage } from './pages/DailyStreakPage'

const router = createBrowserRouter([
  { path: '/',              element: <IndexPage /> },
  { path: '/daily-streak',  element: <DailyStreakPage /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
