import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster
          position="top-right"
          gap={8}
          toastOptions={{
            classNames: {
              toast:
                "rounded-xl border border-border bg-white text-foreground shadow-lg dark:bg-neutral-950",
              title: "text-sm font-semibold",
              description: "text-sm text-muted-foreground",
              error:
                "border-red-200 dark:border-red-800/40",
              success:
                "border-emerald-200 dark:border-emerald-800/40",
              warning:
                "border-amber-200 dark:border-amber-800/40",
              info: "border-blue-200 dark:border-blue-800/40",
            },
          }}
        />
      </body>
    </html>
  )
}