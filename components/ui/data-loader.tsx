"use client"

import { Loader2 } from "lucide-react"

type DataLoaderProps = {
  message?: string
}

export function DataLoader({ message }: DataLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {message ?? "Loading data..."}
      </p>
    </div>
  )
}
