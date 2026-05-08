import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { FacilityProvider } from './context/FacilityContext.tsx'
import { AnalyticsProvider } from './context/AnalyticsContext.tsx'
import { queryClient } from './lib/queryClient.ts'

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="nextris-theme">
      <AnalyticsProvider>
        <AuthProvider >
          <QueryClientProvider client={queryClient}>
            <FacilityProvider>
              <Toaster position="top-center" />
              <App />
            </FacilityProvider>
          </QueryClientProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  </StrictMode>,
)
