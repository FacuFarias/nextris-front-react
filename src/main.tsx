import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppToaster } from './components/AppToaster.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { AppConfigProvider } from './context/AppConfigContext.tsx'
import { AnalyticsProvider } from './context/AnalyticsContext.tsx'
import { queryClient } from './lib/queryClient.ts'

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="nextris-theme">
      <AnalyticsProvider>
        <AuthProvider >
          <QueryClientProvider client={queryClient}>
            <AppConfigProvider>
              <AppToaster />
              <App />
            </AppConfigProvider>
          </QueryClientProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  </StrictMode>,
)
