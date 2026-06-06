"use client"

import { Check, RotateCcw } from "lucide-react"

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
  SendIcon,
  StatusBadge,
  Textarea,
  TicketList,
} from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function FeedbackModule({ model }: PortalModuleProps) {
  const {
    feedbackDraft,
    handleFeedbackSubmit,
    profile,
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
        <Panel title="Submission Console" eyebrow="Feedback and complaints">
          <form onSubmit={handleFeedbackSubmit} className="space-y-3">
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
              className="h-10 rounded-2xl"
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

            <Button type="submit" className="w-full rounded-2xl">
              <SendIcon />
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

  const visibleTickets =
    role === "faculty"
      ? tickets.filter((ticket) => ticket.assignedTo === profile.name)
      : tickets

  return (
    <div className="space-y-5">
      {role === "faculty" ? (
        <Panel title="Submission Console" eyebrow="Feedback and complaints">
          <form onSubmit={handleFeedbackSubmit} className="space-y-3">
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
              className="h-10 rounded-2xl"
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

            <Button type="submit" className="w-full rounded-2xl">
              <SendIcon />
              Submit Ticket
            </Button>
          </form>
        </Panel>
      ) : null}

      <Panel
        title={role === "admin" ? "Master Inbox" : "Assigned Faculty Inbox"}
        eyebrow="Ticket status management"
      >
      <div className="space-y-3">
        {visibleTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-foreground">
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
                  <p className="mt-3 rounded-2xl border border-border bg-muted p-3 text-sm text-foreground/80">
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
                  className="rounded-2xl"
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
                    className="rounded-2xl"
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

        {visibleTickets.length === 0 ? (
          <EmptyState text="No tickets are assigned here." />
        ) : null}
      </div>
    </Panel>
    </div>
  )
}