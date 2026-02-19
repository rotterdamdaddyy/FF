"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { STATUS_LABELS } from "@/lib/constants"

type TicketEvent = {
  id: string
  type: string
  message: string
  createdAt: string
}

type Ticket = {
  publicTicketId: string
  status: keyof typeof STATUS_LABELS
  department: string
  title: string
  description: string
  attachments: { id: string; fileName: string; fileUrl: string }[]
  events: TicketEvent[]
}

export default function TicketStatusPage({ params }: { params: { publicTicketId: string } }) {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const fetchTicket = useCallback(async () => {
    if (!token) return
    setLoading(true)
    const response = await fetch(`/api/tickets/${params.publicTicketId}?token=${token}`)
    const data = await response.json()
    if (!response.ok) {
      setError(data.error ?? "Unable to load ticket")
    } else {
      setTicket(data.ticket)
    }
    setLoading(false)
  }, [params.publicTicketId, token])

  useEffect(() => {
    if (!token) return
    const timeout = setTimeout(fetchTicket, 0)
    const interval = setInterval(fetchTicket, 10000)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchTicket, token])

  const statusLabel = useMemo(() => {
    if (!ticket) return ""
    return STATUS_LABELS[ticket.status]
  }, [ticket])

  const handleNote = async () => {
    if (!token || !note.trim()) return
    const response = await fetch(`/api/tickets/${params.publicTicketId}/note?token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: note }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error ?? "Unable to send update")
      return
    }
    setNote("")
    fetchTicket()
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading ticket...</div>
  }

  if (error || !ticket) {
    return <div className="p-8 text-center text-destructive">{error ?? "Ticket not found"}</div>
  }

  return (
    <main className="min-h-screen page-gradient px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Ticket {ticket.publicTicketId}</p>
          <h1 className="text-2xl font-semibold md:text-3xl">{ticket.title}</h1>
          <Badge variant="secondary" className="w-fit">{statusLabel}</Badge>
        </div>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Ticket details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p><span className="text-muted-foreground">Department:</span> {ticket.department}</p>
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
            <CardTitle>Updates timeline</CardTitle>
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

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Add more info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
            <Button onClick={handleNote}>Send update</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}