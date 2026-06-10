"use client"

import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react"
import type * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/50 dark:text-blue-300",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/50 dark:text-emerald-300",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/50 dark:text-amber-300",
        error:
          "border-red-200 bg-red-50 text-red-800 dark:border-red-800/40 dark:bg-red-950/50 dark:text-red-300",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const iconMap: Record<string, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
}

function Alert({
  className,
  variant = "info",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  const Icon = iconMap[variant ?? "info"]

  return (
    <div
      role="alert"
      data-variant={variant}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-1">{children}</div>
    </div>
  )
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("font-semibold leading-snug", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-sm leading-relaxed opacity-90", className)}
      {...props}
    />
  )
}

export { Alert, AlertDescription, AlertTitle }
