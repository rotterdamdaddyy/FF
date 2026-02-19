import { NextRequest, NextResponse } from "next/server"
import { saveUploadedFile } from "@/lib/upload"
import { getClientIp, requireSameOrigin } from "@/lib/security"
import { checkRateLimit } from "@/lib/rate-limit"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const originCheck = requireSameOrigin(request)
    if (originCheck) return originCheck
    const ip = getClientIp(request)
    const rate = await checkRateLimit(`upload:${ip}`)
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: rate.retryAfter },
        { status: 429 }
      )
    }
    const formData = await request.formData()
    const files = formData.getAll("files")
    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    const uploads = []
    for (const file of files) {
      if (!(file instanceof File)) continue
      const saved = await saveUploadedFile(file)
      uploads.push(saved)
    }

    return NextResponse.json({ files: uploads })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
