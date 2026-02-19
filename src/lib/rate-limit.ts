import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const windowMs = 60_000
const maxRequests = 5
const windowSeconds = Math.ceil(windowMs / 1000)

type Entry = { count: number; start: number }

const store = new Map<string, Entry>()

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

const redis =
  upstashUrl && upstashToken
    ? new Redis({ url: upstashUrl, token: upstashToken })
    : null

const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: true,
      prefix: "unhelpdesk",
    })
  : null

export async function checkRateLimit(key: string) {
  if (ratelimit) {
    const result = await ratelimit.limit(key)
    if (result.success) {
      return { ok: true }
    }
    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    return { ok: false, retryAfter }
  }

  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now - entry.start > windowMs) {
    store.set(key, { count: 1, start: now })
    return { ok: true }
  }
  if (entry.count >= maxRequests) {
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - entry.start)) / 1000) }
  }
  entry.count += 1
  return { ok: true }
}
