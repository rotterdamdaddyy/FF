"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"

export default function AdminLogout() {
  useEffect(() => {
    signOut({ callbackUrl: "/" })
  }, [])

  return <div className="p-10 text-center text-muted-foreground">Signing out...</div>
}