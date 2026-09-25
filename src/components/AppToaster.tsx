import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { Toaster } from 'sonner'
import { useTheme } from '@/context/ThemeContext'
import './AppToaster.css'

export function AppToaster() {
  const { actualTheme } = useTheme()

  return (
    <Toaster
      className="nextris-toaster"
      position="top-right"
      theme={actualTheme}
      offset={{ top: 20, right: 20 }}
      mobileOffset={{ top: 'calc(4.75rem + env(safe-area-inset-top))', right: 12, left: 12 }}
      closeButton
      icons={{
        success: <CircleCheck aria-hidden="true" />,
        error: <CircleAlert aria-hidden="true" />,
        warning: <TriangleAlert aria-hidden="true" />,
        info: <Info aria-hidden="true" />,
      }}
    />
  )
}
