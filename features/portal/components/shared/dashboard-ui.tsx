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
        statusColor[value] ?? "border-slate-200 bg-slate-50 text-slate-700"
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
        "rounded-lg border border-slate-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-1 text-base font-semibold text-slate-950">
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
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
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
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-lg pl-9"
      />
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
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
      className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
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
    <label className="grid gap-1 text-sm text-slate-600">
      {label ? <span>{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
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
        <article key={ticket.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-950">{ticket.subject}</h4>
              <p className="mt-1 text-sm text-slate-500">
                {ticket.category} - {ticket.submittedAt}
              </p>
            </div>
            <StatusBadge value={ticket.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {ticket.description}
          </p>
          {ticket.resolution ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
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
