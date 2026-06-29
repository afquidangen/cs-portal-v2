import webpush from "web-push"

let vapidInitialized = false

function ensureVapid() {
  if (vapidInitialized) return true

  const key = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY

  if (key && priv) {
    webpush.setVapidDetails("mailto:gitlostkhopal@gmail.com", key, priv)
    vapidInitialized = true
    console.warn("[WebPush] VAPID initialized")
    return true
  }

  console.warn("[WebPush] VAPID keys not configured — VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set")
  return false
}

export type PushPayload = {
  title: string
  body: string
  icon: string
  url: string
}

export type PushResult =
  | { status: "sent" }
  | { status: "expired" }
  | { status: "error"; error: string }

export async function sendPush(
  subscription: {
    endpoint: string
    p256dhKey: string
    authKey: string
  },
  payload: PushPayload
): Promise<PushResult> {
  if (!ensureVapid()) {
    return { status: "error", error: "VAPID not configured" }
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dhKey,
          auth: subscription.authKey,
        },
      },
      JSON.stringify(payload)
    )
    console.warn("[WebPush] Sent to", subscription.endpoint.slice(0, 50) + "...")
    return { status: "sent" }
  } catch (err: unknown) {
    if (err instanceof webpush.WebPushError) {
      console.warn("[WebPush] Push error:", err.statusCode, err.message)
      if (err.statusCode === 410) {
        return { status: "expired" }
      }
      return { status: "error", error: `HTTP ${err.statusCode}: ${err.message}` }
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.warn("[WebPush] Unexpected error:", msg)
    return { status: "error", error: msg }
  }
}

type DbSubscription = {
  id: string
  userId: string
  endpoint: string
  p256dhKey: string
  authKey: string
}

export async function sendPushToSubscriptions(
  subscriptions: DbSubscription[],
  payload: PushPayload
): Promise<{ sent: number; expired: number; failed: number }> {
  if (subscriptions.length === 0) {
    console.warn("[WebPush] No subscriptions to send to")
    return { sent: 0, expired: 0, failed: 0 }
  }

  console.warn(`[WebPush] Sending push to ${subscriptions.length} subscription(s)`)

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPush(sub, payload))
  )

  let sent = 0
  let expired = 0
  let failed = 0
  const expiredIds: string[] = []

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      const r = result.value
      if (r.status === "sent") sent++
      else if (r.status === "expired") {
        expired++
        expiredIds.push(subscriptions[i].id)
      } else failed++
    } else {
      failed++
      console.warn("[WebPush] Subscription send rejected:", result.reason)
    }
  })

  console.warn(`[WebPush] Result: ${sent} sent, ${expired} expired, ${failed} failed`)

  if (expiredIds.length > 0) {
    try {
      const { PushSubscriptionModel } = await import("@/lib/models/push-subscription.model")
      await PushSubscriptionModel.deleteMany({ id: { $in: expiredIds } })
      console.warn(`[WebPush] Deleted ${expiredIds.length} expired subscription(s)`)
    } catch (delErr) {
      console.warn("[WebPush] Failed to delete expired subscriptions:", delErr)
    }
  }

  return { sent, expired, failed }
}
