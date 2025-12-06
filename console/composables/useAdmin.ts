// @ts-nocheck

// Direct localStorage access (safe for both server and client context)
function getAdminFromStorage(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem('admin-mode') === 'true'
  } catch {
    return false
  }
}

function getTokenFromStorage(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem('admin-token') || ''
  } catch {
    return ''
  }
}

function saveAdminToStorage(value: boolean) {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      localStorage.setItem('admin-mode', 'true')
    } else {
      localStorage.removeItem('admin-mode')
    }
  } catch {
    console.warn('Failed to save admin mode to localStorage')
  }
}

function saveTokenToStorage(value: string) {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      localStorage.setItem('admin-token', value)
    } else {
      localStorage.removeItem('admin-token')
    }
  } catch {
    console.warn('Failed to save admin token to localStorage')
  }
}

export const useAdmin = () => {
  // Use useState but don't rely on initializer for client-side persistence
  // The initializer runs during SSR, so it will return false/''
  const admin = useState('admin-mode', () => false)
  const token = useState('admin-token', () => '')

  // On client-side only, restore from localStorage immediately when composable is first used
  if (process.client) {
    // Check if we're in hydration phase (initial load from server)
    const isHydrated = useNuxtApp().$nuxt?.isHydrating === false || true
    
    // Always attempt to restore from localStorage on client
    const storedAdmin = getAdminFromStorage()
    const storedToken = getTokenFromStorage()
    
    if (storedAdmin && !admin.value) {
      admin.value = true
    }
    if (storedToken && !token.value) {
      token.value = storedToken
    }

    // Watch for changes and persist to localStorage
    watch(
      () => admin.value,
      (newVal) => saveAdminToStorage(newVal),
      { immediate: false }
    )

    watch(
      () => token.value,
      (newVal) => saveTokenToStorage(newVal),
      { immediate: false }
    )

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin-mode') {
        admin.value = e.newValue === 'true'
      } else if (e.key === 'admin-token') {
        token.value = e.newValue || ''
      }
    }

    window.addEventListener('storage', handleStorageChange)
  }

  const enable = (t?: string) => {
    admin.value = true
    token.value = t || ''
    // Always ensure localStorage is updated
    saveAdminToStorage(true)
    saveTokenToStorage(t || '')
  }

  const disable = () => {
    admin.value = false
    token.value = ''
    // Always ensure localStorage is cleared
    saveAdminToStorage(false)
    saveTokenToStorage('')
  }

  return { admin, token, enable, disable }
}
