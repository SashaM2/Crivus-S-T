"use client"

import { useEffect, useState } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()
  const [mounted, setMounted] = useState(false)

  // Only render on client to avoid hydration mismatches from browser extensions
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div suppressHydrationWarning>
      <ToastProvider>
        {toasts.map(function ({ id, title, description, action, ...props }) {
          return (
            <Toast key={id} {...props} suppressHydrationWarning>
              <div className="grid gap-1" suppressHydrationWarning>
                {title && <ToastTitle suppressHydrationWarning>{title}</ToastTitle>}
                {description && (
                  <ToastDescription suppressHydrationWarning>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose suppressHydrationWarning />
            </Toast>
          )
        })}
        <ToastViewport suppressHydrationWarning />
      </ToastProvider>
    </div>
  )
}

