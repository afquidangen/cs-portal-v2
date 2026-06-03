"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "./button"

type DataErrorProps = {
  message?: string
  onRetry?: () => void
}

export function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="size-8 text-red-500" />
      <p className="text-sm text-red-700">
        {message ?? "Something went wrong while loading data."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 size-3" />
          Retry
        </Button>
      )}
    </div>
  )
}
