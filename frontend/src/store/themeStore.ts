import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'light' || saved === 'dark') return saved
  return 'dark' // Premium dark theme is the default
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
      return { theme: nextTheme }
    })
  },
}))

export const initializeTheme = () => {
  const theme = getInitialTheme()
  document.documentElement.setAttribute('data-theme', theme)
}
