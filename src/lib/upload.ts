import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"]

const UPLOAD_PROVIDER = process.env.UPLOAD_PROVIDER ?? "local"
const S3_BUCKET = process.env.S3_BUCKET
const S3_REGION = process.env.S3_REGION
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL

let s3Client: S3Client | null = null

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large (max 5MB)")
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Unsupported file type")
  }
}

function ensureS3Config() {
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error("Missing S3 configuration")
  }
}

function getS3Client() {
  ensureS3Config()
  if (!s3Client) {
    s3Client = new S3Client({
      region: S3_REGION,
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID as string,
        secretAccessKey: S3_SECRET_ACCESS_KEY as string,
      },
    })
  }
  return s3Client
}

function getS3PublicUrl(key: string) {
  ensureS3Config()
  const base =
    S3_PUBLIC_URL?.replace(/\/$/, "") ||
    `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`
  return `${base}/${key}`
}

export type UploadedFile = {
  fileName: string
  fileUrl: string
  fileMime: string
  fileSize: number
}

export async function saveLocalFile(file: File): Promise<UploadedFile> {
  validateFile(file)
  const buffer = Buffer.from(await file.arrayBuffer())
  const uploadsDir = path.join(process.cwd(), "public", "uploads")
  await fs.mkdir(uploadsDir, { recursive: true })
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const filePath = path.join(uploadsDir, key)
  await fs.writeFile(filePath, buffer)
  return {
    fileName: file.name,
    fileUrl: `/uploads/${key}`,
    fileMime: file.type,
    fileSize: file.size,
  }
}

export async function saveS3File(file: File): Promise<UploadedFile> {
  validateFile(file)
  const buffer = Buffer.from(await file.arrayBuffer())
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `uploads/${Date.now()}-${crypto.randomUUID()}-${safeName}`
  const client = getS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  )
  return {
    fileName: file.name,
    fileUrl: getS3PublicUrl(key),
    fileMime: file.type,
    fileSize: file.size,
  }
}

export async function saveUploadedFile(file: File): Promise<UploadedFile> {
  if (UPLOAD_PROVIDER === "local") return saveLocalFile(file)
  if (UPLOAD_PROVIDER === "s3") return saveS3File(file)
  throw new Error("Invalid upload provider")
}
