import { z } from "zod"

const s3BaseUrl =
  process.env.S3_PUBLIC_URL ||
  (process.env.S3_BUCKET && process.env.S3_REGION
    ? `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com`
    : null)

const s3BaseNormalized = s3BaseUrl ? s3BaseUrl.replace(/\/$/, "") : null

export const ticketCreateSchema = z.object({
  issueType: z.enum([
    "ATTENDANCE",
    "LETTERS",
    "ID",
    "FINANCE",
    "TIMETABLE",
    "COMPLAINTS",
  ]),
  department: z.string().min(2, "Department is required"),
  title: z.string().min(4, "Title is required"),
  description: z.string().min(10, "Description is required"),
  studentName: z.string().min(2, "Full name is required"),
  studentId: z.string().min(2, "ID name is required"),
  studentEmailOrPhone: z
    .string()
    .email("Valid britishuniversity.krd email is required")
    .refine((value) => value.endsWith("@britishuniversity.krd"), {
      message: "Valid britishuniversity.krd email is required",
    }),
  attachments: z
    .array(
      z.object({
        fileName: z.string(),
        fileUrl: z.string().refine((value) => {
          if (value.startsWith("/uploads/")) return true
          if (s3BaseNormalized && value.startsWith(`${s3BaseNormalized}/`)) return true
          return false
        }, {
          message: "Invalid file reference",
        }),
        fileMime: z.string(),
        fileSize: z.number(),
      })
    )
    .optional(),
})

export const ticketNoteSchema = z.object({
  message: z.string().min(3),
})

export const adminReplySchema = z.object({
  message: z.string().min(2),
  status: z
    .enum(["SUBMITTED", "IN_REVIEW", "WAITING_STUDENT", "RESOLVED", "REJECTED"])
    .optional(),
  internal: z.boolean().optional(),
})

export const statusUpdateSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "IN_REVIEW",
    "WAITING_STUDENT",
    "RESOLVED",
    "REJECTED",
  ]),
})
