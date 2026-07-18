import type { RateLimitConfig } from "./constants"
import { store } from "./constants"

export async function checkRateLimit(
  request: Request,
  config: RateLimitConfig,
  identifier: string
): Promise<Response | null> {
  const storageKey = `${config.key}:${identifier}`
  const { count, expiresAt } = await store.increment(storageKey, config.windowMs)

  if (count > config.limit) {
    const retryAfter = Math.ceil((expiresAt - Date.now()) / 1000)
    return Response.json(
      { success: false, message: config.message },
      {
        status: 429,
        headers: {
          "RateLimit-Limit": String(config.limit),
          "RateLimit-Remaining": "0",
          "RateLimit-Reset": String(Math.ceil(expiresAt / 1000)),
          "Retry-After": String(Math.max(retryAfter, 1)),
        },
      }
    )
  }

  return null
}
