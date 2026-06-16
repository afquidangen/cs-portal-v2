"use client"

import { useCallback, useRef, useState } from "react"

export type SaveStatus = "idle" | "saving" | "saved" | "failed"

export function useAutoSave(saveFn: (data: unknown) => Promise<void>, delay = 800) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<unknown | null>(null)
  const savingRef = useRef(false)

  const flush = useCallback(async () => {
    const data = pendingRef.current
    if (data === null) return
    pendingRef.current = null
    savingRef.current = true
    setStatus("saving")
    try {
      await saveFn(data)
      setStatus("saved")
      setLastSaved(new Date().toLocaleTimeString())
    } catch {
      setStatus("failed")
    } finally {
      savingRef.current = false
    }
  }, [saveFn])

  const schedule = useCallback(
    (data: unknown) => {
      pendingRef.current = data
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void flush()
      }, delay)
    },
    [delay, flush]
  )

  const saveNow = useCallback(
    async (data: unknown) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      pendingRef.current = data
      await flush()
    },
    [flush]
  )

  return { status, lastSaved, schedule, saveNow }
}
