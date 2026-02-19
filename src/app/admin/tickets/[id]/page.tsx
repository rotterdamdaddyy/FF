import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_LABELS, TICKET_STATUSES } from "@/lib/constants"
import Link from "next/link"

export default async function AdminTicketDetail({ params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      attachments: true,
      events: { orderBy: { createdAt: "desc" } },
      assignedTo: true,
    },
  })

  if (!ticket) {
    return <div className="p-8">Ticket not found</div>
  }

  return (
    <main className="min-h-screen page-gradient px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ticket {ticket.publicTicketId}</p>
            <h1 className="text-2xl font-semibold md:text-3xl">{ticket.title}</h1>
          </div>
          <Button asChild variant="outline" className="bg-white/70">
            <Link href="/admin">Back to dashboard</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Ticket overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm">
                <p><span className="text-muted-foreground">Department:</span> {ticket.department}</p>
                <p><span className="text-muted-foreground">Status:</span> <Badge variant="secondary">{STATUS_LABELS[ticket.status]}</Badge></p>
                <p><span className="text-muted-foreground">Student:</span> {ticket.studentName ?? "-"}</p>
                <p><span className="text-muted-foreground">Contact:</span> {ticket.studentEmailOrPhone ?? "-"}</p>
              </div>
              <p className="text-muted-foreground">Description</p>
              <p>{ticket.description}</p>
              {ticket.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Attachments</p>
                  <ul className="space-y-1 text-sm">
                    {ticket.attachments.map((file) => (
                      <li key={file.id}>
                        <a className="text-primary underline" href={file.fileUrl} target="_blank">
                          {file.fileName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">Most recent updates appear first.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.events.map((event) => (
                <div key={event.id} className="rounded-xl border border-white/70 bg-white/70 p-4 shadow">
                  <p className="text-sm font-medium">{event.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <form className="grid gap-4 lg:grid-cols-[1fr_1fr]" action={`/api/admin/tickets/${ticket.id}/status`} method="post">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Update status</CardTitle>
              <p className="text-sm text-muted-foreground">Keep the student informed automatically.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                name="status"
                defaultValue={ticket.status}
                className="h-10 w-full rounded-md border border-input bg-white/70 px-3 text-sm"
              >
                {TICKET_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <Button type="submit">Update status</Button>
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Reply to student</CardTitle>
              <p className="text-sm text-muted-foreground">A copy will be emailed to the student.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea name="message" placeholder="Write an update for the student..." required />
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Mark as Waiting Student</label>
                <Input type="checkbox" name="setWaiting" className="h-4 w-4" />
              </div>
              <Button formAction={`/api/admin/tickets/${ticket.id}/reply`} type="submit">Send reply</Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  )
}