import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// CSS Studio — dev only, never shipped to end users.
if (import.meta.env.DEV) {
  import('cssstudio').then(({ startStudio }) => startStudio())
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
