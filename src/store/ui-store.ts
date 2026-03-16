import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface UIStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  activeWorkspaceId: string | null
  setActiveWorkspaceId: (id: string) => void

  activeIssueId: string | null
  openIssueDetail: (id: string) => void
  closeIssueDetail: () => void

  theme: Theme
  toggleTheme: () => void
}

// Read initial theme from localStorage or default to dark
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('relay-theme')
    if (stored === 'light' || stored === 'dark') return stored
  }
  return 'dark'
}

// Apply theme to document
const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('relay-theme', theme)
}

// Apply on load
const initialTheme = getInitialTheme()
applyTheme(initialTheme)

export const useUIStore = create<UIStore>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),

  activeIssueId: null,
  openIssueDetail: (id) => set({ activeIssueId: id }),
  closeIssueDetail: () => set({ activeIssueId: null }),

  theme: initialTheme,
  toggleTheme: () => set((s) => {
    const newTheme: Theme = s.theme === 'dark' ? 'light' : 'dark'
    applyTheme(newTheme)
    return { theme: newTheme }
  }),
}))
