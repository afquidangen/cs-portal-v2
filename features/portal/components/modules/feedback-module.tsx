"use client"

import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  type TicketStatus,
  roleProfiles,
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
    role,
    setFeedbackDraft,
    studentTickets,
    tickets,
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
              className="h-9 rounded-lg"
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
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={feedbackDraft.anonymous}
                onChange={(event) =>
                  setFeedbackDraft((current) => ({
                    ...current,
                    anonymous: event.target.checked,
                  }))
                }
                className="size-4 rounded border-slate-300"
              />
              Submit anonymously
            </label>
            <Button type="submit" className="w-full">
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
      ? tickets.filter((ticket) => ticket.assignedTo === roleProfiles.faculty.name)
      : tickets

  return (
    <Panel
      title={role === "admin" ? "Master Inbox" : "Assigned Faculty Inbox"}
      eyebrow="Ticket status management"
    >
      <div className="space-y-3">
        {visibleTickets.map((ticket) => (
          <div
            key={ticket.id}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-slate-950">
                    {ticket.subject}
                  </h4>
                  <StatusBadge value={ticket.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {ticket.id} - {ticket.studentName} - {ticket.submittedAt}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {ticket.description}
                </p>
                {ticket.resolution ? (
                  <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
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
              </div>
            </div>
          </div>
        ))}
        {visibleTickets.length === 0 ? (
          <EmptyState text="No tickets are assigned here." />
        ) : null}
      </div>
    </Panel>
  )
}
