import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { ticketCreateSchema } from "@/lib/validation"
import { generatePublicTicketId } from "@/lib/tickets"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendEmail, ticketCreatedTemplate } from "@/lib/email"
import { ZodError } from "zod"
import { getClientIp, requireSameOrigin } from "@/lib/security"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const originCheck = requireSameOrigin(request)
    if (originCheck) return originCheck

    const ip = getClientIp(request)
    const rate = await checkRateLimit(`ticket:create:${ip}`)
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rate.retryAfter },
        { status: 429 }
      )
    }

    const body = await request.json()
    const payload = ticketCreateSchema.parse(body)
    const count = await prisma.ticket.count()
    const publicTicketId = generatePublicTicketId(count + 1)
    const viewToken = crypto.randomUUID()

    const ticket = await prisma.ticket.create({
      data: {
        publicTicketId,
        viewToken,
        issueType: payload.issueType,
        department: payload.department,
        studentName: payload.studentName,
        studentId: payload.studentId,
        studentEmailOrPhone: payload.studentEmailOrPhone,
        title: payload.title,
        description: payload.description,
        status: "SUBMITTED",
        attachments: {
          create: payload.attachments?.map((file) => ({
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileMime: file.fileMime,
            fileSize: file.fileSize,
          })) ?? [],
        },
        events: {
          create: {
            type: "CREATED",
            message: "Ticket submitted",
          },
        },
      },
      include: { attachments: true },
    })

    const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin
    const viewUrl = `${baseUrl}/ticket/${ticket.publicTicketId}?token=${ticket.viewToken}`

    await sendEmail(
      payload.studentEmailOrPhone,
      `Ticket submitted: ${ticket.publicTicketId}`,
      ticketCreatedTemplate({
        name: payload.studentName,
        ticketId: ticket.publicTicketId,
        viewUrl,
      })
    )

    return NextResponse.json({
      publicTicketId: ticket.publicTicketId,
      viewToken: ticket.viewToken,
    })
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Valid britishuniversity.krd email is required with ID name and Full name."
        : error instanceof Error
          ? error.message
          : "Valid britishuniversity.krd email is required with ID name and Full name."
    return NextResponse.json({ message }, { status: 400 })
  }
}
