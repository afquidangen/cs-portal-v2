import type { RateLimitStore } from "./rate-limit-store"
import { MemoryStore } from "./memory-store"

export interface RateLimitConfig {
  key: string
  limit: number
  windowMs: number
  message: string
}

export const RATE_LIMITS = {
  LOGIN: {
    key: "login",
    limit: 5,
    windowMs: 60_000,
    message: "Too many login attempts. Please try again in 1 minute.",
  },
  OTP_VERIFY: {
    key: "otp_verify",
    limit: 5,
    windowMs: 600_000,
    message: "Too many verification attempts. Please try again later.",
  },
  RESEND_OTP: {
    key: "resend_otp",
    limit: 5,
    windowMs: 600_000,
    message: "Too many verification attempts. Please try again later.",
  },
  FORGOT_PASSWORD: {
    key: "forgot_password",
    limit: 3,
    windowMs: 3_600_000,
    message: "Too many password reset requests. Please try again later.",
  },
  FILE_UPLOAD: {
    key: "file_upload",
    limit: 10,
    windowMs: 60_000,
    message: "Too many uploads. Please try again later.",
  },
  ADMIN_SENSITIVE: {
    key: "admin_sensitive",
    limit: 20,
    windowMs: 60_000,
    message: "Too many requests. Please slow down.",
  },
} as const satisfies Record<string, RateLimitConfig>

const STORE_KEY = "__comscite_rate_limit_store"

function getOrCreateStore(): MemoryStore {
  if ((process as any)[STORE_KEY]) return (process as any)[STORE_KEY] as MemoryStore
  const store = new MemoryStore()
  store.startCleanup()
  ;(process as any)[STORE_KEY] = store
  return store
}

export const store: RateLimitStore = getOrCreateStore()
