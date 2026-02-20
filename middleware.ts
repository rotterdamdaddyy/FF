import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { applySecurityHeaders } from "@/middleware/headers"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  applySecurityHeaders(request, response)

  const pathname = request.nextUrl.pathname

  // Skip auth check for login page, logout page, and auth API routes
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/logout" ||
    pathname.startsWith("/api/auth")
  ) {
    return response
  }

  if (pathname.startsWith("/admin")) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
    if (!token || token.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
