import { Inter } from "next/font/google"
import type { Metadata } from "next"

import { ThemeProvider } from "@/components/providers/theme-provider"
import { PortalHeader } from "@/components/portal/header"
import { PortalFooter } from "@/components/portal/footer"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "ComSite Student Portal",
  description: "ISPSC Computing Studies Unit - Code Innovation, Connect Education, Conquer Excellence.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <PortalHeader />
          <main className="flex-1">{children}</main>
          <PortalFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
