import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ISSUE_LABELS, STATUS_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; department?: string }
}) {
  const { status, type, department } = searchParams
  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status ? { status: status as "SUBMITTED" | "IN_REVIEW" | "WAITING_STUDENT" | "RESOLVED" | "REJECTED" } : {}),
      ...(type ? { issueType: type as "ATTENDANCE" | "LETTERS" | "ID" | "FINANCE" | "TIMETABLE" | "COMPLAINTS" } : {}),
      ...(department ? { department: { contains: department, mode: "insensitive" } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { assignedTo: true },
  })

  const stats = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status !== "RESOLVED" && ticket.status !== "REJECTED").length,
    waiting: tickets.filter((ticket) => ticket.status === "WAITING_STUDENT").length,
  }

  return (
    <main className="min-h-screen page-gradient px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back =K</p>
            <h1 className="text-2xl font-semibold md:text-3xl">HelpDesk inbox</h1>
            <p className="text-sm text-muted-foreground">Track, respond, and close student requests.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="bg-white/70">
              <Link href="/admin/settings">Generate QR</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/70">
              <Link href="/admin/logout">Log out</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            { label: "Total tickets", value: stats.total },
            { label: "Open tickets", value: stats.open },
            { label: "Waiting on student", value: stats.waiting },
          ].map((card) => (
            <Card key={card.label} className="glass-panel">
              <CardContent className="py-4">
                <p className="text-xs uppercase text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>All tickets</CardTitle>
            <p className="text-sm text-muted-foreground">Tap a ticket to review details.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Ticket ID</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-white/50 hover:bg-white/40">
                      <td className="py-3">
                        <Link className="text-primary underline" href={`/admin/tickets/${ticket.id}`}>
                          {ticket.publicTicketId}
                        </Link>
                      </td>
                      <td>{ISSUE_LABELS[ticket.issueType]}</td>
                      <td>{ticket.department}</td>
                      <td>
                        <Badge variant="secondary">{STATUS_LABELS[ticket.status]}</Badge>
                      </td>
                      <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                      <td>{ticket.assignedTo?.name ?? "Unassigned"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}