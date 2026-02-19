"use client"

import { useState } from "react"
import QRCode from "qrcode"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function AdminSettings() {
  const [department, setDepartment] = useState("ComputerScience")
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [link, setLink] = useState("")

  const generate = async () => {
    const url = `${window.location.origin}/helpdesk?dept=${encodeURIComponent(department)}`
    setLink(url)
    const dataUrl = await QRCode.toDataURL(url)
    setQrUrl(dataUrl)
  }

  return (
    <main className="min-h-screen page-gradient px-6 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Generate QR Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Button onClick={generate}>Generate</Button>
            {link && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">QR link</p>
                <Input value={link} readOnly />
                {qrUrl && (
                  <Image
                    src={qrUrl}
                    alt="QR"
                    width={160}
                    height={160}
                    className="h-40 w-40"
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}