export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; expiresAt: number }>
  reset(key: string): Promise<void>
}
