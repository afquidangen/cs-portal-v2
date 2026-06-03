const CHANNEL_NAME = "comsite-portal-sync"
const POLL_INTERVAL = 1500

type SyncMessage = {
  type: "STATE_CHANGED"
  key: string
  timestamp: number
}

let channel: BroadcastChannel | null = null
const listeners = new Map<string, Set<() => void>>()
let pollTimer: ReturnType<typeof setInterval> | null = null

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null
  if (!channel) {
    try {
      channel = new BroadcastChannel(CHANNEL_NAME)
      channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        const msg = event.data
        if (msg?.type === "STATE_CHANGED") {
          const keyListeners = listeners.get(msg.key)
          if (keyListeners) {
            keyListeners.forEach((fn) => fn())
          }
        }
      }
    } catch {
      return null
    }
  }
  return channel
}

export function notifyStateChanged(key: string) {
  const ch = getChannel()
  if (ch) {
    try {
      ch.postMessage({ type: "STATE_CHANGED", key, timestamp: Date.now() })
    } catch { }
  }
}

export function subscribeToKey(key: string, onNotify: () => void) {
  if (!listeners.has(key)) {
    listeners.set(key, new Set())
  }
  listeners.get(key)!.add(onNotify)
  return () => {
    const set = listeners.get(key)
    if (set) {
      set.delete(onNotify)
      if (set.size === 0) listeners.delete(key)
    }
  }
}

export function startPolling(callback: () => void) {
  if (pollTimer) return () => stopPolling()
  pollTimer = setInterval(callback, POLL_INTERVAL)
  return () => stopPolling()
}

export function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

export function destroyChannel() {
  stopPolling()
  listeners.clear()
  if (channel) {
    channel.close()
    channel = null
  }
}
