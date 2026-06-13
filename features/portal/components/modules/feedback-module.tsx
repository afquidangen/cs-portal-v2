"use client"

import { Check, Inbox, LifeBuoy, MailPlus, MessageSquareText, RotateCcw, Send, TicketCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  type TicketStatus,
  ticketStatusOptions,
} from "../../data/portal-data"
import {
  EmptyState,
  Panel,
  Select,
  StatusBadge,
  Textarea,
  TicketList,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function FeedbackModule({ model }: PortalModuleProps) {
  const {
    feedbackDraft,
    handleFeedbackSubmit,
    role,
    setFeedbackDraft,
    studentTickets,
    tickets,
    undoTicketResolution,
    updateTicketStatus,
  } = model

  if (role === "student") {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Submission Console" className="[&>div:first-child]:hidden">
          <div className="mb-4 rounded-2xl border border-border bg-muted/20 px-4 py-5 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
              <MailPlus className="size-7" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Feedback and Complaints
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-foreground">
              We would like to hear from you, CStizen
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Compose your concern, suggestion, or request here. 
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="edu-bg-soft-glacier space-y-3 rounded-xl border border-[var(--edu-border-glacier)] p-4">
            <Select
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
        </Panel>

        <Panel title="Personal Ticket Tracker" eyebrow="Status updates">
          <TicketList
            tickets={studentTickets}
            empty="No submitted tickets yet."
          />
        </Panel>
      </div>
    )
  }

  if (role === "faculty") {
    return (
      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Submission Console" className="[&>div:first-child]:hidden">
          <div className="mb-4 rounded-2xl border border-border bg-muted/20 px-4 py-5 text-center shadow-sm">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
              <MailPlus className="size-7" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Feedback and Complaints
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight tracking-tight text-foreground">
              We would like to hear from you, CStizen.
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Compose your concern, suggestion, or request here.
            </p>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="edu-bg-soft-glacier space-y-3 rounded-xl border border-[var(--edu-border-glacier)] p-4">
            <Select
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
        </Panel>

        <Panel title="Personal Ticket Tracker" eyebrow="Status updates">
          <TicketList
            tickets={studentTickets}
            empty="No submitted tickets yet."
          />
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Master Inbox"
        className="[&>div:first-child]:hidden"
      >
      <div className="mb-5 rounded-2xl border border-border bg-muted/20 px-4 py-6 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-sm">
          <Inbox className="size-8" />
        </div>
        <p className="mt-4 inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
          <LifeBuoy className="size-4" />
          Ticket Status Management
        </p>
        <h3 className="mt-2 text-3xl font-black leading-tight tracking-tight text-foreground sm:text-4xl">
          Master Inbox
        </h3>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Review submitted concerns, monitor ticket progress, and keep resolutions organized in one place.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Total Tickets", value: String(tickets.length), icon: MessageSquareText },
          { label: "Open", value: String(tickets.filter((ticket) => ticket.status !== "Resolved").length), icon: Inbox },
          { label: "Resolved", value: String(tickets.filter((ticket) => ticket.status === "Resolved").length), icon: TicketCheck },
        ].map((item) => (
          <div key={item.label} className="edu-bg-soft-glacier rounded-xl border border-[var(--edu-border-glacier)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
              </div>
              <span className="edu-lapis flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm">
                <item.icon className="size-5" />
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="edu-bg-soft-lapis rounded-xl border border-[var(--edu-border-lapis)] bg-card p-4 shadow-sm transition-colors hover:shadow-md"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-sm">
                    <MessageSquareText className="size-5" />
                  </span>
                  <h4 className="text-lg font-bold tracking-tight text-foreground">
                    {ticket.subject}
                  </h4>
                  <StatusBadge value={ticket.status} />
                </div>

                <p className="mt-1 text-sm text-foreground/70">
                  {ticket.id} - {ticket.studentName} - {ticket.submittedAt}
                </p>

                <p className="mt-3 text-sm leading-6 text-foreground/80">
                  {ticket.description}
                </p>

                {ticket.resolution ? (
                  <p className="mt-3 rounded-lg border border-border bg-white p-3 text-sm text-black dark:border-primary/30 dark:bg-[#071224] dark:text-white">
                    {ticket.resolution}
                  </p>
                ) : null}
              </div>

              <div className="flex min-w-48 flex-col gap-2">
                <Select
                  value={ticket.status}
                  onChange={(value) =>
                    updateTicketStatus(ticket.id, value as TicketStatus)
                  }
                  options={ticketStatusOptions}
                />

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
        ))}

        {tickets.length === 0 ? (
          <EmptyState text="No tickets are assigned here." />
        ) : null}
      </div>
    </Panel>
    </div>
  )
}
