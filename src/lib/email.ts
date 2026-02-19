import nodemailer from "nodemailer"

const host = process.env.SMTP_HOST
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS
const from = process.env.SMTP_FROM || "no-reply@university.edu"

let transporter: nodemailer.Transporter | null = null

export function getTransporter() {
  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP configuration")
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })
  }
  return transporter
}

export async function sendEmail(to: string, subject: string, html: string) {
  const client = getTransporter()
  await client.sendMail({
    from,
    to,
    subject,
    html,
  })
}

export function ticketCreatedTemplate({
  name,
  ticketId,
  viewUrl,
}: {
  name?: string | null
  ticketId: string
  viewUrl: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Your ticket is submitted 🎉</h2>
      <p>Hello ${name ?? "there"},</p>
      <p>Your Uni HelpDesk ticket <strong>${ticketId}</strong> has been created.</p>
      <p><a href="${viewUrl}">View ticket status</a></p>
      <p>We will notify you when there is an update.</p>
    </div>
  `
}

export function ticketUpdatedTemplate({
  name,
  ticketId,
  message,
  status,
  viewUrl,
}: {
  name?: string | null
  ticketId: string
  message: string
  status?: string
  viewUrl: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6">
      <h2>Update on ticket ${ticketId}</h2>
      <p>Hello ${name ?? "there"},</p>
      <p>${message}</p>
      ${status ? `<p>Current status: <strong>${status}</strong></p>` : ""}
      <p><a href="${viewUrl}">View ticket status</a></p>
    </div>
  `
}