export const ISSUE_TYPES = [
  "ATTENDANCE",
  "LETTERS",
  "ID",
  "FINANCE",
  "TIMETABLE",
  "COMPLAINTS",
] as const

export const ISSUE_LABELS: Record<(typeof ISSUE_TYPES)[number], string> = {
  ATTENDANCE: "Attendance",
  LETTERS: "Letters",
  ID: "ID",
  FINANCE: "Finance",
  TIMETABLE: "Timetable",
  COMPLAINTS: "Complaints",
}

export const TICKET_STATUSES = [
  "SUBMITTED",
  "IN_REVIEW",
  "WAITING_STUDENT",
  "RESOLVED",
  "REJECTED",
] as const

export const STATUS_LABELS: Record<(typeof TICKET_STATUSES)[number], string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  WAITING_STUDENT: "Waiting Student",
  RESOLVED: "Resolved",
  REJECTED: "Rejected",
}