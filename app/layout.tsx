import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CS Portal",
  description: "Computer Science Department Student Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Added bg-background and text-foreground to sync shadcn core styling */}
      <body className="min-h-full flex flex-col bg-background text-foreground">
        
        {/* Navigation Shell */}
        <nav className="border-b px-6 py-4 bg-card">
          <h1 className="text-xl font-bold tracking-tight">
            CS Portal
          </h1>
        </nav>

        {/* Content Viewport Wrapper */}
        <main className="flex-1 p-6">
          {children}
        </main>

      </body>
    </html>
  );
}