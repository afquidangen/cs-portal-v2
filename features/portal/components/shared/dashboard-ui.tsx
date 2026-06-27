"use client"

import { Mail, Search, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { statusColor } from "../../config/status"
import type { FeedbackTicket } from "../../data/portal-data"

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-[0.01em] transition-colors shadow-sm",
        statusColor[value] ?? "border-border bg-muted text-foreground"
      )}
    >
      {value}
    </span>
  )
}

export function Panel({
  title,
  eyebrow,
  actions,
  children,
  className,
}: {
  title: string
  eyebrow?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="truncate text-base font-semibold tracking-tight text-card-foreground">
            {title}
          </h3>
        </div>
        {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-card-foreground">
            {value}
          </p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-lg border-border bg-card pl-10 text-card-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
      />
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-sm">
      <p className="mx-auto max-w-md text-sm leading-7 text-muted-foreground">
        {text}
      </p>
    </div>
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
    />
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
  className,
  contentClassName,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label?: string
  className?: string
  contentClassName?: string
}) {
  return (
    <label className="grid gap-1.5 text-sm text-foreground/80">
      {label ? (
        <span className="text-sm font-medium text-foreground">{label}</span>
      ) : null}

      <UiSelect value={value} onValueChange={onChange}>
        <SelectTrigger className={cn(
          "h-11 rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:bg-muted focus:ring-2 focus:ring-ring/20",
          className ?? "border-border"
        )}>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>

        <SelectContent className={cn("border border-border bg-popover text-popover-foreground shadow-2xl", contentClassName)}>
          {[...new Set(options)].filter(Boolean).map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="text-popover-foreground focus:bg-accent focus:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[state=checked]:bg-accent data-[state=checked]:text-accent-foreground"
            >
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </UiSelect>
    </label>
  )
}

export function TicketList({
  tickets,
  empty,
}: {
  tickets: FeedbackTicket[]
  empty: string
}) {
  if (!tickets.length) return <EmptyState text={empty} />

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <article
          key={ticket.id}
          className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-base font-semibold tracking-tight text-card-foreground">
                {ticket.subject}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.category} · {ticket.submittedAt}
              </p>
            </div>
            <StatusBadge value={ticket.status} />
          </div>

          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {ticket.description}
          </p>

          {ticket.resolution ? (
            <div className="mt-4 rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resolution
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {ticket.resolution}
              </p>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

export function SendIcon() {
  return <Mail className="size-4" />
}
