import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "BIU HelpDesk",
  description: "QR to ticket and status tracking for students and admins.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
