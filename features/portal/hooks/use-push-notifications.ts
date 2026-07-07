"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const SW_URL = "/sw.js"

export function usePushNotifications(userId?: string) {
  const swRegistered = useRef(false)
  const subscribed = useRef(false)
  const [pushEnabled, setPushEnabled] = useState(true)

  const ensureServiceWorker = useCallback(async () => {
    if (typeof window === "undefined") return null
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[PushNotifications] Browser does not support push")
      return null
    }
    if (swRegistered.current) {
      return navigator.serviceWorker.ready
    }
    try {
      const registration = await navigator.serviceWorker.register(SW_URL, {
        scope: "/",
      })
      swRegistered.current = true
      console.warn("[PushNotifications] SW registered")
      return registration
    } catch (err) {
      console.warn("[PushNotifications] SW registration failed:", err)
      return null
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Notification.permission === "granted") return true
    if (Notification.permission === "denied") {
      console.warn("[PushNotifications] Permission previously denied")
      return false
    }
    console.warn("[PushNotifications] Requesting permission...")
    const result = await Notification.requestPermission()
    console.warn("[PushNotifications] Permission result:", result)
    return result === "granted"
  }, [])

  const subscribe = useCallback(async () => {
    if (subscribed.current) return
    if (!userId) {
      console.warn("[PushNotifications] No userId yet, skipping subscribe")
      return
    }

    const registration = await ensureServiceWorker()
    if (!registration) return

    const hasPermission = await requestPermission()
    if (!hasPermission) return

    try {
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        console.warn("[PushNotifications] Creating push subscription...")
        const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!key) {
          console.warn("[PushNotifications] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set")
          return
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
        })
      }

      const subJson = subscription.toJSON()
      if (!subJson.endpoint || !subJson.keys) {
        console.warn("[PushNotifications] Invalid subscription object")
        return
      }

      // Fetch preference state
      try {
        const prefRes = await fetch("/api/portal/push-subscriptions")
        if (prefRes.ok) {
          const prefJson = await prefRes.json()
          setPushEnabled(prefJson.data?.pushNotificationsEnabled ?? true)
        }
      } catch {
        // silent
      }

      console.warn("[PushNotifications] Saving subscription to server...")
      const res = await fetch("/api/portal/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dhKey: subJson.keys.p256dh,
          authKey: subJson.keys.auth,
        }),
      })
      if (res.ok) {
        subscribed.current = true
        console.warn("[PushNotifications] Subscription saved")
      }
    } catch (err) {
      console.warn("[PushNotifications] Setup failed:", err)
    }
  }, [userId, ensureServiceWorker, requestPermission])

  useEffect(() => {
    subscribe()
  }, [subscribe])

  const togglePushNotifications = useCallback(async () => {
    const newState = !pushEnabled
    try {
      const res = await fetch("/api/portal/push-subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newState }),
      })
      if (res.ok) {
        setPushEnabled(newState)
        return { success: true, enabled: newState }
      }
    } catch {
      // silent
    }
    return { success: false, enabled: pushEnabled }
  }, [pushEnabled])

  const unsubscribe = useCallback(async () => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) return

      const endpoint = subscription.endpoint
      await subscription.unsubscribe()

      await fetch(
        `/api/portal/push-subscriptions?endpoint=${encodeURIComponent(endpoint)}`,
        { method: "DELETE" }
      )
      subscribed.current = false
    } catch {
      // silent fail
    }
  }, [])

  return { pushEnabled, togglePushNotifications, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
