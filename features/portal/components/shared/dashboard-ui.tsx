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
        "overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-[0_18px_50px_rgb(15_23_42_/_0.06)] transition-all duration-200 dark:shadow-[0_18px_50px_rgb(0_0_0_/_0.22)]",
        className
      )}
    >
      <div className="edu-bg-soft-glacier flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h3>
        </div>
        {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
      </div>
      <div className="p-4 sm:p-5 lg:p-6">{children}</div>
    </section>
  )
}

const eduMetricTones = {
  abyss: {
    shell: "border-[var(--edu-border-abyss)] bg-[var(--edu-shell-abyss-bg)]",
    icon: "edu-abyss edu-ring-abyss",
    glow: "bg-[rgb(9_44_86_/_0.18)] dark:bg-[rgb(9_44_86_/_0.10)]",
  },
  lapis: {
    shell: "border-[var(--edu-border-lapis)] bg-[var(--edu-shell-lapis-bg)]",
    icon: "edu-lapis edu-ring-lapis",
    glow: "bg-[rgb(34_86_136_/_0.18)] dark:bg-[rgb(34_86_136_/_0.10)]",
  },
  slate: {
    shell: "border-[var(--edu-border-slate)] bg-[var(--edu-shell-slate-bg)]",
    icon: "edu-slate edu-ring-slate",
    glow: "bg-[rgb(102_140_169_/_0.18)] dark:bg-[rgb(102_140_169_/_0.10)]",
  },
  glacier: {
    shell: "border-[var(--edu-border-glacier)] bg-[var(--edu-shell-glacier-bg)]",
    icon: "edu-glacier edu-ring-glacier",
    glow: "bg-[rgb(169_203_224_/_0.24)] dark:bg-[rgb(169_203_224_/_0.18)]",
  },
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
  tone?: keyof typeof eduMetricTones
}) {
  const current = eduMetricTones[tone] ?? eduMetricTones.slate

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-4 shadow-[0_16px_44px_rgb(15_23_42_/_0.06)] ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_56px_rgb(15_23_42_/_0.1)] sm:p-5 dark:ring-white/5",
        current.shell
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-24 rounded-full blur-2xl opacity-55 transition-opacity duration-200 group-hover:opacity-90",
          current.glow
        )}
      />

      <div className="relative flex items-start justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <p className="break-words text-xs font-semibold uppercase leading-4 tracking-[0.08em] text-muted-foreground sm:tracking-[0.14em]">
            {label}
          </p>
          <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {value}
          </p>
        </div>

        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border shadow-sm ring-4 ring-white/50 sm:size-12 dark:ring-white/5",
            current.icon
          )}
        >
          <Icon className="size-4 sm:size-5" strokeWidth={2.1} />
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
        className="edu-topbar-highlight h-11 rounded-lg border bg-background pl-10 text-foreground shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/20"
      />
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="edu-bg-soft-glacier rounded-xl border border-dashed border-border px-6 py-12 text-center shadow-sm">
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
          "h-11 rounded-lg border bg-white text-black shadow-sm transition-all duration-200 hover:bg-slate-50 focus:ring-2 focus:ring-ring/20 dark:bg-[#0f1b2b] dark:text-white dark:hover:bg-secondary",
          className ?? "border-border"
        )}>
          <SelectValue placeholder="Select option" />
        </SelectTrigger>

        <SelectContent className={cn("border border-border bg-white text-black shadow-2xl dark:bg-[#0f1b2b] dark:text-white", contentClassName)}>
          {[...new Set(options)].filter(Boolean).map((option) => (
            <SelectItem
              key={option}
              value={option}
              className="text-black focus:bg-slate-100 focus:text-black data-[highlighted]:bg-slate-100 data-[highlighted]:text-black data-[state=checked]:bg-slate-100 data-[state=checked]:text-black dark:text-white dark:focus:bg-[#123768] dark:focus:text-white dark:data-[highlighted]:bg-[#123768] dark:data-[highlighted]:text-white dark:data-[state=checked]:bg-[#123768] dark:data-[state=checked]:text-white"
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
      {tickets.map((ticket, index) => (
        <article
          key={ticket.id}
          className={cn(
            "rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
            index % 4 === 0 && "edu-ring-glacier edu-bg-soft-glacier",
            index % 4 === 1 && "edu-ring-lapis edu-bg-soft-lapis",
            index % 4 === 2 && "edu-ring-slate edu-bg-soft-slate",
            index % 4 === 3 && "edu-ring-abyss edu-bg-soft-abyss"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-base font-semibold tracking-tight text-foreground">
                {ticket.subject}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {ticket.category} · {ticket.submittedAt}
              </p>
            </div>
            <StatusBadge value={ticket.status} />
          </div>

          <p className="mt-4 text-sm leading-7 text-foreground/85">
            {ticket.description}
          </p>

          {ticket.resolution ? (
            <div className="mt-4 rounded-lg border border-border bg-background/70 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Resolution
              </p>
              <p className="mt-2 text-sm leading-7 text-foreground/85">
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
