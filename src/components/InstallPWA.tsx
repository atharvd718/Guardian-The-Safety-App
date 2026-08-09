import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = 
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    })
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setIsInstalled(true)
    setInstallPrompt(null)
  }

  if (isInstalled || !installPrompt) return null

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 
                 bg-rose-600 text-white border-none rounded-full 
                 px-6 py-3 text-sm font-bold cursor-pointer 
                 z-50 shadow-lg flex items-center gap-2
                 whitespace-nowrap"
    >
      📲 Install Guardian App
    </button>
  )
}
