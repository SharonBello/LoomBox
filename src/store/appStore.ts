import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { isRTL } from '@/i18n'
import type { User, Language, AppState } from '@/types'

// ============================================================
// App Store — Global application state via Zustand
// ============================================================

interface AppActions {
  setUser:        (user: User | null) => void
  setLanguage:    (lang: Language) => void
  toggleSidebar:  () => void
  setSidebar:     (open: boolean) => void
  setAuthLoading: (loading: boolean) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // --- Initial State ---
        user:          null,
        language:      'en',
        direction:     'ltr',
        sidebarOpen:   true,
        isAuthLoading: true,

        // --- Actions ---
        setUser: (user) => set({ user }, false, 'setUser'),

        setLanguage: (lang) => {
          const direction = isRTL(lang) ? 'rtl' : 'ltr'

          // Update DOM direction immediately
          document.documentElement.lang = lang
          document.documentElement.dir  = direction
          document.body.dir             = direction

          set({ language: lang, direction }, false, 'setLanguage')
        },

        toggleSidebar: () =>
          set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, 'toggleSidebar'),

        setSidebar: (open) =>
          set({ sidebarOpen: open }, false, 'setSidebar'),

        setAuthLoading: (loading) =>
          set({ isAuthLoading: loading }, false, 'setAuthLoading'),
      }),
      {
        name:    'loombox-app',
        partialize: (state) => ({
          language:  state.language,
          direction: state.direction,
        }),
      }
    ),
    { name: 'LoomBox' }
  )
)
