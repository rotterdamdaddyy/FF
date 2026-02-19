import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminReplySchema } from "@/lib/validation"
import { sendEmail, ticketUpdatedTemplate } from "@/lib/email"
import { requireAdmin, requireSameOrigin, getClientIp } from "@/lib/security"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request)
  if (admin instanceof NextResponse) return admin
  const originCheck = requireSameOrigin(request)
  if (originCheck) return originCheck

  const ip = getClientIp(request)
  const rate = await checkRateLimit(`admin:reply:${ip}`)
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rate.retryAfter },
      { status: 429 }
    )
  }
  const formData = await request.formData()
  const payload = adminReplySchema.parse({
    message: formData.get("message"),
    status: formData.get("setWaiting") ? "WAITING_STUDENT" : undefined,
  })

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: "ADMIN_REPLY",
      message: payload.message,
      fromRole: "ADMIN",
    },
  })

  let updated = ticket
  if (payload.status) {
    updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: payload.status },
    })
  }

  if (updated.studentEmailOrPhone) {
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const viewUrl = `${baseUrl}/ticket/${ticket.publicTicketId}?token=${ticket.viewToken}`
    await sendEmail(
      updated.studentEmailOrPhone,
      `Reply on ticket: ${ticket.publicTicketId}`,
      ticketUpdatedTemplate({
        name: updated.studentName,
        ticketId: ticket.publicTicketId,
        message: payload.message,
        status: payload.status,
        viewUrl,
      })
    )
  }

  return NextResponse.redirect(new URL(`/admin/tickets/${ticket.id}`, request.url))
}
