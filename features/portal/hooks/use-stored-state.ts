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
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() =>
    readFromStorage(key, initialValue)
  )

  const serializedRef = useRef(safeStringify(value))
  const pendingKeyRef = useRef(key)

  useEffect(() => {
    if (key !== pendingKeyRef.current) {
      pendingKeyRef.current = key
      const stored = readFromStorage(key, initialValue)
      const serialized = safeStringify(stored)
      serializedRef.current = serialized
      setValue(stored)
    }
  }, [key, initialValue])

  useEffect(() => {
    const unsub = subscribeToKey(key, () => {
      const current = readFromStorage(key, initialValue)
      const serialized = safeStringify(current)
      if (serialized !== serializedRef.current) {
        serializedRef.current = serialized
        setValue(current)
      }
    })
    return unsub
  }, [key, initialValue])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        if (e.newValue) {
          if (e.newValue !== serializedRef.current) {
            serializedRef.current = e.newValue
            try {
              setValue(JSON.parse(e.newValue) as T)
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
  }, [key, initialValue])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        const current = readFromStorage(key, initialValue)
        const serialized = safeStringify(current)
        if (serialized !== serializedRef.current) {
          serializedRef.current = serialized
          setValue(current)
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [key, initialValue])

  useEffect(() => {
    const stop = startPolling(() => {
      const current = readFromStorage(key, initialValue)
      const serialized = safeStringify(current)
      if (serialized !== serializedRef.current) {
        serializedRef.current = serialized
        setValue(current)
      }
    })
    return stop
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
