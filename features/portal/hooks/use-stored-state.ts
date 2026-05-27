"use client"

import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useState,
} from "react"

export function useStoredState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key)
      if (stored) {
        setValue(JSON.parse(stored) as T)
      }
    } finally {
      setReady(true)
    }
  }, [key])

  useEffect(() => {
    if (!ready) return
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, ready, value])

  return [value, setValue]
}
