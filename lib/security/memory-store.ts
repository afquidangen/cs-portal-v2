import type { RateLimitStore } from "./rate-limit-store"

interface RateLimitEntry {
  count: number
  expiresAt: number
}

export class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>()
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  async increment(key: string, windowMs: number): Promise<{ count: number; expiresAt: number }> {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || now > entry.expiresAt) {
      const newEntry: RateLimitEntry = { count: 1, expiresAt: now + windowMs }
      this.store.set(key, newEntry)
      return { count: 1, expiresAt: newEntry.expiresAt }
    }

    entry.count++
    return { count: entry.count, expiresAt: entry.expiresAt }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  startCleanup(intervalMs = 60_000): void {
    if (this.cleanupTimer) return
    this.cleanupTimer = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of Array.from(this.store.entries())) {
        if (now > entry.expiresAt) this.store.delete(key)
      }
    }, intervalMs)
    if (this.cleanupTimer?.unref) this.cleanupTimer.unref()
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }
}
