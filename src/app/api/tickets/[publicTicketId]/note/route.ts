import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ticketNoteSchema } from "@/lib/validation"
import { safeCompare, getClientIp, requireSameOrigin } from "@/lib/security"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(
  request: NextRequest,
  { params }: { params: { publicTicketId: string } }
) {
  const originCheck = requireSameOrigin(request)
  if (originCheck) return originCheck
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { publicTicketId: params.publicTicketId },
  })
  if (!ticket || !safeCompare(ticket.viewToken, token)) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  const ip = getClientIp(request)
  const rate = await checkRateLimit(`ticket:note:${ticket.id}:${ip}`)
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rate.retryAfter },
      { status: 429 }
    )
  }

  const payload = ticketNoteSchema.parse(await request.json())
  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: "STUDENT_NOTE",
      message: payload.message,
    },
  })

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
