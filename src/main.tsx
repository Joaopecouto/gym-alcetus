import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { applyTheme, useSettings } from '@/stores/settings'
import { queryClient } from '@/lib/query'

applyTheme(useSettings.getState().theme)
useSettings.subscribe((state) => applyTheme(state.theme))

if (import.meta.env.PROD) {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
