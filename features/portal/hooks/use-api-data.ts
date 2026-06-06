"use client"

import { useEffect, useState, useCallback, useRef } from "react"

type Status = "idle" | "loading" | "success" | "error"

export function useApiData<T>(
  url: string | null,
  options?: {
    initialData?: T
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
  }
) {
  const [data, setData] = useState<T | undefined>(options?.initialData)
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!url) return

    setStatus("loading")
    setError(null)

    try {
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Request failed with status ${res.status}`)
      }
      const json = await res.json()
      if (!mountedRef.current) return

      setData(json.data)
      setStatus("success")
      options?.onSuccess?.(json.data)
    } catch (err) {
      if (!mountedRef.current) return
      const e = err instanceof Error ? err : new Error("An unexpected error occurred")
      setError(e)
      setStatus("error")
      options?.onError?.(e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, options?.onSuccess, options?.onError])

  useEffect(() => {
    mountedRef.current = true
    queueMicrotask(() => void fetchData())
    return () => {
      mountedRef.current = false
    }
  }, [fetchData])

  const isLoading = status === "idle" || status === "loading"
  const isError = status === "error"
  const isSuccess = status === "success"

  const mutate = useCallback(
    async (
      method: "POST" | "PUT" | "DELETE",
      body?: unknown
    ): Promise<T | undefined> => {
      if (!url) return

      try {
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
        })
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          throw new Error(errBody.error ?? `Request failed with status ${res.status}`)
        }
        const json = await res.json()
        setData(json.data)
        setStatus("success")
        return json.data as T
      } catch (err) {
        const e = err instanceof Error ? err : new Error("An unexpected error occurred")
        setError(e)
        setStatus("error")
        throw e
      }
    },
    [url]
  )

  return {
    data,
    status,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch: fetchData,
    mutate,
  } as const
}
