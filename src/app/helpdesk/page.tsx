"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ISSUE_LABELS, ISSUE_TYPES } from "@/lib/constants"

type UploadMeta = {
  fileName: string
  fileUrl: string
  fileMime: string
  fileSize: number
}

function HelpDeskForm() {
  const searchParams = useSearchParams()
  const deptFromQuery = searchParams.get("dept") ?? ""
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0])
  const [department, setDepartment] = useState(deptFromQuery)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [studentName, setStudentName] = useState("")
  const [studentId, setStudentId] = useState("")
  const [studentEmail, setStudentEmail] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [, setAttachments] = useState<UploadMeta[]>([])
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ ticketId: string; token: string } | null>(null)

  const stepTitle = useMemo(() => {
    return ["Issue Type", "Details", "Attachments", "Contact"]
  }, [])

  const handleUpload = async () => {
    if (!files.length) return []
    const formData = new FormData()
    files.forEach((file) => formData.append("files", file))
    const response = await fetch("/api/upload", { method: "POST", body: formData })
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error ?? "Upload failed")
    }
    const data = await response.json()
    return data.files as UploadMeta[]
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!studentName.trim() || !studentId.trim() || !studentEmail.trim()) {
        throw new Error(
          "Valid britishuniversity.krd email is required with ID name and Full name."
        )
      }
      if (!studentEmail.endsWith("@britishuniversity.krd")) {
        throw new Error(
          "Valid britishuniversity.krd email is required with ID name and Full name."
        )
      }
      const uploaded = await handleUpload()
      setAttachments(uploaded)
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          department,
          title,
          description,
          studentName: studentName || undefined,
          studentId: studentId || undefined,
          studentEmailOrPhone: studentEmail,
          attachments: uploaded,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(
          data.message ??
            "Valid britishuniversity.krd email is required with ID name and Full name."
        )
      }
      setSuccess({ ticketId: data.publicTicketId, token: data.viewToken })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Valid britishuniversity.krd email is required with ID name and Full name."
      )
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen page-gradient px-4 py-12">
        <div className="mx-auto max-w-lg">
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle>Ticket submitted 🎉</CardTitle>
              <CardDescription>Save your ticket number to track updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-white/60 bg-white/70 p-5 shadow">
                <p className="text-xs uppercase text-muted-foreground">Ticket Number</p>
                <p className="text-2xl font-semibold tracking-wide">{success.ticketId}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(success.ticketId)
                  }}
                  variant="outline"
                >
                  Copy Ticket Number
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = `/ticket/${success.ticketId}?token=${success.token}`
                  }}
                >
                  View Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen page-gradient px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-primary">BIU HelpDesk</p>
          <h1 className="text-3xl font-semibold md:text-4xl">Submit a ticket</h1>
          <p className="text-muted-foreground">
            Department: <span className="font-medium text-foreground">{department || "Not set"}</span>
          </p>
        </header>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Step {step} of 4 — {stepTitle[step - 1]}</CardTitle>
            <CardDescription>Fill in the required information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {[1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full ${index <= step ? "bg-primary" : "bg-slate-200"}`}
                />
              ))}
            </div>
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {ISSUE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`rounded-2xl border p-5 text-left transition ${
                      issueType === type
                        ? "border-primary bg-primary/10 shadow"
                        : "border-white/70 bg-white/70 hover:border-primary/40"
                    }`}
                    onClick={() => setIssueType(type)}
                  >
                    <p className="text-sm text-muted-foreground">Issue</p>
                    <p className="text-lg font-semibold">{ISSUE_LABELS[type]}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Missing attendance for week 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Explain the issue and any dates or references."
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="attachments">Upload proof (optional)</Label>
                <Input
                  id="attachments"
                  type="file"
                  multiple
                  onChange={(event) => {
                    const list = event.target.files
                    if (!list) return
                    setFiles(Array.from(list))
                  }}
                />
                <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 5MB each.</p>
                {files.length > 0 && (
                  <div className="rounded-lg bg-white/70 p-3 text-xs text-muted-foreground">
                    {files.length} file(s) selected
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Full name *</Label>
                  <Input
                    id="studentName"
                    required
                    value={studentName}
                    onChange={(event) => setStudentName(event.target.value)}
                    placeholder="Sarah Ali"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">ID name *</Label>
                  <Input
                    id="studentId"
                    required
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                    placeholder="20231234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentContact">Email (britishuniversity.krd) *</Label>
                  <Input
                    id="studentContact"
                    type="email"
                    required
                    value={studentEmail}
                    onChange={(event) => setStudentEmail(event.target.value)}
                    placeholder="name@britishuniversity.krd"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                variant="outline"
                type="button"
                disabled={step === 1}
                onClick={() => setStep((prev) => Math.max(1, prev - 1))}
              >
                Back
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={() => setStep((prev) => prev + 1)}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
          BIU HELPDESK IS BUILT BY COMPUTER SCIENCE DEPARTMENT
        </p>
      </div>
    </main>
  )
}

export default function HelpDeskPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen page-gradient px-4 py-12">
        <div className="mx-auto max-w-3xl text-center text-muted-foreground">Loading...</div>
      </main>
    }>
      <HelpDeskForm />
    </Suspense>
  )
}
