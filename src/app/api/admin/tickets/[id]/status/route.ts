import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { statusUpdateSchema } from "@/lib/validation"
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
  const rate = await checkRateLimit(`admin:status:${ip}`)
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rate.retryAfter },
      { status: 429 }
    )
  }
  const formData = await request.formData()
  const status = formData.get("status")
  const payload = statusUpdateSchema.parse({ status })

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  const updated = await prisma.ticket.update({
    where: { id: params.id },
    data: { status: payload.status },
  })

  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: "STATUS_CHANGED",
      message: `Status changed to ${payload.status}`,
      metaJson: JSON.stringify({ from: ticket.status, to: payload.status }),
      fromRole: "ADMIN",
    },
  })

  if (updated.studentEmailOrPhone) {
    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const viewUrl = `${baseUrl}/ticket/${ticket.publicTicketId}?token=${ticket.viewToken}`
    await sendEmail(
      updated.studentEmailOrPhone,
      `Ticket update: ${ticket.publicTicketId}`,
      ticketUpdatedTemplate({
        name: updated.studentName,
        ticketId: ticket.publicTicketId,
        message: `Your ticket status is now ${payload.status}.`,
        status: payload.status,
        viewUrl,
      })
    )
  }

  return NextResponse.redirect(new URL(`/admin/tickets/${ticket.id}`, request.url))
}
