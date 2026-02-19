import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { safeCompare, getClientIp } from "@/lib/security"
import { checkRateLimit } from "@/lib/rate-limit"

export async function GET(
  request: NextRequest,
  { params }: { params: { publicTicketId: string } }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const ip = getClientIp(request)
  const rate = await checkRateLimit(`ticket:view:${params.publicTicketId}:${ip}`)
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rate.retryAfter },
      { status: 429 }
    )
  }

  const ticket = await prisma.ticket.findUnique({
    where: { publicTicketId: params.publicTicketId },
    include: {
      attachments: true,
      events: { orderBy: { createdAt: "desc" } },
      assignedTo: true,
    },
  })

  if (!ticket || !safeCompare(ticket.viewToken, token)) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  return NextResponse.json({ ticket })
}
