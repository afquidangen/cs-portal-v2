"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
}>({
  theme: "light",
  toggleTheme: () => {},
})

const DashboardProfileContext = createContext<{
  name: string
  role: string
  setProfile: (name: string, role: string) => void
}>({
  name: "",
  role: "",
  setProfile: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("comsite-theme")
      return (stored === "light" || stored === "dark") ? stored : "light"
    }
    return "light"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.document.documentElement.classList.toggle("dark", theme === "dark")
      window.localStorage.setItem("comsite-theme", theme)
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <DashboardProfileProvider>
        {children}
      </DashboardProfileProvider>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

export function useDashboardProfile() {
  return useContext(DashboardProfileContext)
}

function DashboardProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState({ name: "", role: "" })

  const setter = useCallback((name: string, role: string) => {
    setProfile({ name, role })
  }, [])

  return (
    <DashboardProfileContext.Provider value={{ ...profile, setProfile: setter }}>
      {children}
    </DashboardProfileContext.Provider>
  )
}
