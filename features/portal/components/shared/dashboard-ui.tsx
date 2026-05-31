"use client"

import { Mail, Search, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { statusColor } from "../../config/status"
import type { FeedbackTicket } from "../../data/portal-data"

export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        statusColor[value] ?? "border-glacier bg-quartz text-abyss dark:border-lapis dark:bg-abyss/50 dark:text-quartz"
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
        "rounded-xl border border-glacier bg-white shadow-sm dark:border-lapis dark:bg-abyss/50",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-glacier p-5 sm:flex-row sm:items-center sm:justify-between dark:border-lapis">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-blue dark:text-glacier">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-1 text-base font-semibold text-abyss dark:text-quartz">
            {title}
          </h3>
        </div>
        {actions}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function Metric({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: "slate" | "emerald" | "amber" | "rose" | "sky"
}) {
  const colors = {
    slate: "bg-glacier text-abyss dark:bg-lapis dark:text-quartz",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  }

  return (
    <div className="rounded-xl border border-glacier bg-white p-4 shadow-sm dark:border-lapis dark:bg-abyss/50">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-blue dark:text-glacier">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-abyss dark:text-quartz">{value}</p>
        </div>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            colors[tone]
          )}
        >
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
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-blue" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg border-glacier pl-9 dark:border-lapis dark:bg-abyss/50"
      />
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-blue p-8 text-center text-sm text-slate-blue dark:border-glacier dark:text-glacier">
      {text}
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
      className="w-full resize-none rounded-lg border border-glacier bg-white px-3 py-2 text-sm outline-none transition focus:border-lapis focus:ring-2 focus:ring-lapis/20 dark:border-lapis dark:bg-abyss/50 dark:text-quartz"
    />
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label?: string
}) {
  return (
    <label className="grid gap-1 text-sm text-slate-blue dark:text-glacier">
      {label ? <span>{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-glacier bg-white px-3 text-sm outline-none transition focus:border-lapis focus:ring-2 focus:ring-lapis/20 dark:border-lapis dark:bg-abyss/50 dark:text-quartz"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
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
        <article key={ticket.id} className="rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-abyss dark:text-quartz">{ticket.subject}</h4>
              <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
                {ticket.category} - {ticket.submittedAt}
              </p>
            </div>
            <StatusBadge value={ticket.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-blue dark:text-glacier">
            {ticket.description}
          </p>
          {ticket.resolution ? (
            <p className="mt-3 rounded-lg bg-quartz p-3 text-sm text-abyss dark:bg-lapis/50 dark:text-quartz">
              {ticket.resolution}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}

export function SendIcon() {
  return <Mail className="size-4" />
}
