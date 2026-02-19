import { IssueType } from "@prisma/client"

export function generatePublicTicketId(sequence: number) {
  const year = new Date().getFullYear()
  const padded = String(sequence).padStart(6, "0")
  return `UHD-${year}-${padded}`
}

export const issueTypeOptions: { value: IssueType; label: string }[] = [
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "LETTERS", label: "Letters" },
  { value: "ID", label: "ID" },
  { value: "FINANCE", label: "Finance" },
  { value: "TIMETABLE", label: "Timetable" },
  { value: "COMPLAINTS", label: "Complaints" },
]