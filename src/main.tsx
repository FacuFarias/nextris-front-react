import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext.tsx'
import { queryClient } from './lib/queryClient.ts'

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <AuthProvider >
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" />
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
)
