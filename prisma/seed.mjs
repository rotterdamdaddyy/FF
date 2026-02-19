import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const isProd = process.env.NODE_ENV === "production"
  const email = process.env.ADMIN_SEED_EMAIL
  const password = process.env.ADMIN_SEED_PASSWORD
  if (isProd && (!email || !password)) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are required in production")
  }
  const finalEmail = email || "admin@university.edu"
  const finalPassword = password || "admin12345"
  const hashed = await bcrypt.hash(finalPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: finalEmail },
    update: {},
    create: {
      name: "HelpDesk Admin",
      email: finalEmail,
      password: hashed,
      role: "ADMIN",
    },
  })

  const shouldSeedSample = process.env.SEED_SAMPLE_TICKET === "true" || !isProd
  if (shouldSeedSample) {
    const ticket = await prisma.ticket.upsert({
      where: { publicTicketId: "UHD-2026-000001" },
      update: {},
      create: {
        publicTicketId: "UHD-2026-000001",
        issueType: "ATTENDANCE",
        department: "Computer Science",
        studentName: "Sara Khalid",
        studentId: "20234567",
        studentEmailOrPhone: "sara@uni.edu",
        title: "Attendance missing week 2",
        description: "My attendance for week 2 lecture is missing.",
        status: "IN_REVIEW",
        viewToken: "seed-token",
        assignedToId: admin.id,
        events: {
          create: [
            {
              type: "CREATED",
              message: "Ticket submitted",
            },
            {
              type: "STATUS_CHANGED",
              message: "Status changed to IN_REVIEW",
              fromRole: "ADMIN",
            },
          ],
        },
      },
    })
    console.log("Seeded ticket", ticket.publicTicketId)
  }

  console.log("Seeded admin", admin.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
