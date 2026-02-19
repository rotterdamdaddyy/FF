import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import crypto from "crypto"

export function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

export function safeCompare(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

export async function requireAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { token }
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")
  if (!origin || !host) {
    return null
  }
  const originHost = new URL(origin).host
  if (originHost !== host) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }
  return null
}