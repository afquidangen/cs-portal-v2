"use client"

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  notifyStateChanged,
  startPolling,
  subscribeToKey,
} from "../lib/realtime-sync"

function readFromStorage<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue
  try {
    const stored = window.localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : initialValue
  } catch {
    return initialValue
  }
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ""
  }
}

export function useStoredState<T>(
  key: string,
  initialValue: T,
  isValid?: (data: T) => boolean
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = readFromStorage(key, initialValue)
    if (isValid && !isValid(stored)) return initialValue
    return stored
  })

  const serializedRef = useRef(safeStringify(value))
  const pendingKeyRef = useRef(key)

  useEffect(() => {
    if (key !== pendingKeyRef.current) {
      pendingKeyRef.current = key
      const stored = readFromStorage(key, initialValue)
      const serialized = safeStringify(stored)
      serializedRef.current = serialized
      setValue(isValid && !isValid(stored) ? initialValue : stored)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue])

  useEffect(() => {
    const unsub = subscribeToKey(key, () => {
      const current = readFromStorage(key, initialValue)
      const serialized = safeStringify(current)
      if (serialized !== serializedRef.current) {
        serializedRef.current = serialized
        setValue(isValid && !isValid(current) ? initialValue : current)
      }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        if (e.newValue) {
          if (e.newValue !== serializedRef.current) {
            serializedRef.current = e.newValue
            try {
              const parsed = JSON.parse(e.newValue) as T
              setValue(isValid && !isValid(parsed) ? initialValue : parsed)
            } catch { }
          }
        } else {
          const serialized = safeStringify(initialValue)
          serializedRef.current = serialized
          setValue(initialValue)
        }
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const current = readFromStorage(key, initialValue)
        const serialized = safeStringify(current)
        if (serialized !== serializedRef.current) {
          serializedRef.current = serialized
          setValue(isValid && !isValid(current) ? initialValue : current)
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue])

  useEffect(() => {
    const stop = startPolling(() => {
      const current = readFromStorage(key, initialValue)
      const serialized = safeStringify(current)
      if (serialized !== serializedRef.current) {
        serializedRef.current = serialized
        setValue(isValid && !isValid(current) ? initialValue : current)
      }
    })
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue])

  useEffect(() => {
    serializedRef.current = safeStringify(value)
  }, [value])

  const syncedSetValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      setValue((prev) => {
        const next =
          typeof action === "function"
            ? (action as (prev: T) => T)(prev)
            : action
        const serialized = safeStringify(next)
        serializedRef.current = serialized
        pendingKeyRef.current = key
        try {
          window.localStorage.setItem(key, serialized)
        } catch { }
        notifyStateChanged(key)
        return next
      })
    },
    [key]
  )

  return [value, syncedSetValue]
}
