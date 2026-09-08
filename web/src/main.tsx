import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import App from './App'
import './styles/global.css'

// Force service worker update on load
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration: ServiceWorkerRegistration & { update(): void }) => {
        // Trigger immediate SW update check
        if (registration.update) registration.update()
        // If a new SW is waiting, force page reload to activate it
        if (registration.waiting) {
          window.location.reload()
        }
        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (installing) {
            installing.addEventListener('statechange', () => {
              if (installing.state === 'installed' && navigator.serviceWorker.controller) {
                if (registration.waiting) {
                  window.location.reload()
                }
              }
            })
          }
        })
      })

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
