import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
