import NextAuth from "next-auth/next"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const forwarded = req?.headers?.["x-forwarded-for"]
        const ip =
          typeof forwarded === "string"
            ? forwarded.split(",")[0]?.trim() || "unknown"
            : "unknown"
        const rate = await checkRateLimit(`auth:login:${ip}`)
        if (!rate.ok) return null
        if (!credentials?.email || !credentials.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null
        if (user.role !== "ADMIN") return null
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/admin/login",
  },
})

export { handler as GET, handler as POST }
