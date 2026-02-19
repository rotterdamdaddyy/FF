import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen page-gradient px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <header className="space-y-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-primary shadow">
            BIU HelpDesk • QR → Ticket → Status
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
            Help desk.
          </h1>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="shadow">
              <Link href="/helpdesk?dept=">Open student form</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/70">
              <Link href="/admin/login">Admin login</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Student-first",
              copy: "Mobile-friendly flow with prefilled department from QR links.",
            },
            {
              title: "Live status",
              copy: "Track tickets with secure tokens, updates, and a clear timeline.",
            },
            {
              title: "Admin dashboard",
              copy: "Filter, respond, change statuses, and keep internal notes.",
            },
          ].map((card) => (
            <Card key={card.title} className="glass-panel">
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {card.copy}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}