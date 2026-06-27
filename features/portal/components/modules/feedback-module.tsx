"use client"

import { ArrowDownUp, Check, ChevronDown, Inbox, LifeBuoy, MailPlus, MessageSquareText, RotateCcw, Send, TicketCheck } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  type TicketStatus,
  ticketStatusOptions,
} from "../../data/portal-data"
import {
  EmptyState,
  Select as ThemedSelect,
  StatusBadge,
  Textarea,
  TicketList,
} from "../shared/dashboard-ui"
import { cn } from "@/lib/utils"
import type { PortalModuleProps } from "./types"

export function FeedbackModule({ model }: PortalModuleProps) {
  const {
    feedbackDraft,
    handleFeedbackSubmit,
    filteredTickets,
    role,
    setFeedbackDraft,
    studentTickets,
    tickets,
    undoTicketResolution,
    updateTicketStatus,
  } = model

  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "resolved">("all")

  const sorted = useMemo(() =>
    [...filteredTickets].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    ),
  [filteredTickets])

  const unresolved = useMemo(
    () => sorted.filter((t) => t.status !== "Resolved"),
    [sorted]
  )

  const resolved = useMemo(() => {
    if (statusFilter === "open") return []
    return sorted.filter((t) => t.status === "Resolved")
  }, [sorted, statusFilter])

  if (role === "student") {
    return (
      <div className="space-y-5">
        <div className="pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Feedback</h1>
          <p className="mt-2 text-sm text-slate-600">We would like to hear from you, CStizen. Submit your concern, suggestion, or request.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 px-5 py-4">
              <CardTitle className="text-base font-semibold text-slate-950">Submission Console</CardTitle>
              <p className="text-xs font-medium text-blue-600">Feedback and Complaints</p>
            </CardHeader>
            <CardContent className="p-5">
          <form onSubmit={handleFeedbackSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <ThemedSelect
              value={feedbackDraft.category}
              onChange={(value) =>
                setFeedbackDraft((current) => ({
                  ...current,
                  category: value,
                }))
              }
              options={["Academic", "Facilities", "Portal", "Faculty", "Other"]}
              label="Category"
            />

            <Input
              value={feedbackDraft.subject}
              onChange={(event) =>
                setFeedbackDraft((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              placeholder="Subject"
              className="h-10 rounded-lg"
            />

            <Textarea
              value={feedbackDraft.description}
              onChange={(value) =>
                setFeedbackDraft((current) => ({
                  ...current,
                  description: value,
                }))
              }
              placeholder="Describe the concern or suggestion"
            />

            <Button type="submit" className="w-full rounded-lg">
              <Send className="size-4" />
              Submit Ticket
            </Button>
          </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 px-5 py-4">
              <CardTitle className="text-base font-semibold text-slate-950">Personal Ticket Tracker</CardTitle>
              <p className="text-xs font-medium text-blue-600">Status updates</p>
            </CardHeader>
            <CardContent className="p-5">
          <TicketList
            tickets={studentTickets}
            empty="No submitted tickets yet."
          />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (role === "faculty") {
    return (
      <div className="space-y-5">
        <div className="pt-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Feedback</h1>
          <p className="mt-2 text-sm text-slate-600">We would like to hear from you, CStizen. Submit your concern, suggestion, or request.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 px-5 py-4">
              <CardTitle className="text-base font-semibold text-slate-950">Submission Console</CardTitle>
              <p className="text-xs font-medium text-blue-600">Feedback and Complaints</p>
            </CardHeader>
            <CardContent className="p-5">
          <form onSubmit={handleFeedbackSubmit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <ThemedSelect
              value={feedbackDraft.category}
              onChange={(value) =>
                setFeedbackDraft((current) => ({
                  ...current,
                  category: value,
                }))
              }
              options={["Academic", "Facilities", "Portal", "Faculty", "Other"]}
              label="Category"
            />

            <Input
              value={feedbackDraft.subject}
              onChange={(event) =>
                setFeedbackDraft((current) => ({
                  ...current,
                  subject: event.target.value,
                }))
              }
              placeholder="Subject"
              className="h-10 rounded-lg"
            />

            <Textarea
              value={feedbackDraft.description}
              onChange={(value) =>
                setFeedbackDraft((current) => ({
                  ...current,
                  description: value,
                }))
              }
              placeholder="Describe the concern or suggestion"
            />

            <Button type="submit" className="w-full rounded-lg">
              <Send className="size-4" />
              Submit Ticket
            </Button>
          </form>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardHeader className="border-b border-slate-200 px-5 py-4">
              <CardTitle className="text-base font-semibold text-slate-950">Personal Ticket Tracker</CardTitle>
              <p className="text-xs font-medium text-blue-600">Status updates</p>
            </CardHeader>
            <CardContent className="p-5">
          <TicketList
            tickets={studentTickets}
            empty="No submitted tickets yet."
          />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Master Inbox</h1>
        <p className="mt-2 text-sm text-slate-600">Review submitted concerns, monitor ticket progress, and keep resolutions organized in one place.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Total Tickets", value: String(tickets.length), icon: MessageSquareText },
          { label: "Open", value: String(tickets.filter((ticket) => ticket.status !== "Resolved").length), icon: Inbox },
          { label: "Resolved", value: String(tickets.filter((ticket) => ticket.status === "Resolved").length), icon: TicketCheck },
        ].map((item) => {
          const Icon = item.icon
          return (
          <Card key={item.label} className="rounded-lg border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-600">{item.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{item.value}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                <Icon className="size-5" />
              </span>
            </div>
            </CardContent>
          </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ArrowDownUp className="size-4 text-slate-400" />
        {(["all", "open", "resolved"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => setStatusFilter(opt)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === opt
                ? "bg-blue-100 text-blue-700"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            {opt === "all" ? "All" : opt === "open" ? "Open" : "Resolved"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {unresolved.length === 0 && resolved.length === 0 ? (
          <EmptyState text="No tickets match your filters." />
        ) : null}

        {unresolved.length > 0 ? (
          <div>
            {unresolved.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                updateTicketStatus={updateTicketStatus}
                undoTicketResolution={undoTicketResolution}
              />
            ))}
          </div>
        ) : null}

        {resolved.length > 0 ? (
          <details className="group rounded-lg border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 [&::-webkit-details-marker]:hidden">
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              <TicketCheck className="size-4" />
              Resolved Tickets ({resolved.length})
            </summary>
            <div className="space-y-2 border-t border-slate-200 px-4 py-3">
              {resolved.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  updateTicketStatus={updateTicketStatus}
                  undoTicketResolution={undoTicketResolution}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  )
}

function TicketCard({
  ticket,
  updateTicketStatus,
  undoTicketResolution,
}: {
  ticket: any
  updateTicketStatus: (id: string, status: TicketStatus, resolution?: string) => void
  undoTicketResolution: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 shadow-sm">
              <MessageSquareText className="size-5" />
            </span>
            <h4 className="text-lg font-bold tracking-tight text-slate-950">
              {ticket.subject}
            </h4>
            <StatusBadge value={ticket.status} />
          </div>

          <p className="mt-1 text-sm text-slate-500">
            {ticket.id} - {ticket.studentName} - {ticket.submittedAt}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-700">
            {ticket.description}
          </p>

          {ticket.resolution ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {ticket.resolution}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-48 flex-col gap-2">
          <Select
            value={ticket.status}
            onValueChange={(value) =>
              updateTicketStatus(ticket.id, value as TicketStatus)
            }
          >
            <SelectTrigger className="h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ticketStatusOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            onClick={() =>
              updateTicketStatus(
                ticket.id,
                "Resolved",
                "Reviewed and marked as resolved by the portal user."
              )
            }
          >
            <Check className="size-4" />
            Resolve
          </Button>

          {ticket.status === "Resolved" ? (
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg"
              onClick={() => undoTicketResolution(ticket.id)}
            >
              <RotateCcw className="size-4" />
              Undo Resolve
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
