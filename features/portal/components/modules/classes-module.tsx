"use client"

import { useState } from "react"
import { ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { scheduleSeed } from "../../data/portal-data"
import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

const yearOrder = ["First Year", "Second Year", "Third Year", "Fourth Year"]

export function ClassesModule({ model }: PortalModuleProps) {
  const { role, roster, setRoster, sections, addSection, selectModule } = model

  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [newSectionName, setNewSectionName] = useState("")
  const [showAddSection, setShowAddSection] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  if (role === "faculty") {
    const facultySections = ["BSCS 3A", "BSCS 3B"]

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {facultySections.map((section) => (
            <Button
              key={section}
              variant={activeSection === section ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection(activeSection === section ? null : section)}
            >
              {section}
            </Button>
          ))}
        </div>

        {activeSection ? (
          <Panel title={`Manage Class - ${activeSection}`} eyebrow="Student roster">
            <div className="space-y-3">
              {roster
                .filter((s) => s.section === activeSection)
                .map((student) => (
                  <label
                    key={student.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-glacier bg-white p-4 dark:border-lapis dark:bg-abyss/50"
                  >
                    <div>
                      <p className="font-medium text-abyss dark:text-quartz">{student.name}</p>
                      <p className="text-sm text-slate-blue dark:text-glacier">
                        {student.id} - {student.section}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={student.enrolled}
                      onChange={(event) =>
                        setRoster((current) =>
                          current.map((item) =>
                            item.id === student.id
                              ? { ...item, enrolled: event.target.checked }
                              : item
                          )
                        )
                      }
                      className="size-5 rounded border-slate-blue"
                    />
                  </label>
                ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Classes Management" eyebrow="Facult schedule">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-glacier text-xs uppercase text-slate-blue dark:border-lapis">
                  <tr>
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Subject</th>
                    <th className="py-2 pr-4">Instructor</th>
                    <th className="py-2 pr-4">Schedule</th>
                    <th className="py-2">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glacier dark:divide-lapis">
                  {scheduleSeed.filter((s) => facultySections.includes(s.section)).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 font-medium text-abyss dark:text-quartz">{item.section}</td>
                      <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{item.subject}</td>
                      <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{item.instructor}</td>
                      <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{item.day}, {item.time}</td>
                      <td className="py-3 text-slate-blue dark:text-glacier">{item.room}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}
      </div>
    )
  }

  if (selectedSection) {
    return (
      <div className="space-y-5">
        <Button variant="outline" size="sm" onClick={() => { setSelectedSection(null); setSelectedYear(null) }}>
          <ChevronRight className="size-4 rotate-180" />
          Back
        </Button>
        <Panel title={`Schedule - ${selectedSection}`} eyebrow="Class schedule">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-glacier text-xs uppercase text-slate-blue dark:border-lapis">
                <tr>
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Instructor</th>
                  <th className="py-2">Room</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glacier dark:divide-lapis">
                {scheduleSeed.filter((s) => s.section === selectedSection).map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 font-medium text-abyss dark:text-quartz">{item.day}</td>
                    <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{item.time}</td>
                    <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{item.subject}</td>
                    <td className="py-3 pr-4 text-slate-blue dark:text-glacier">{item.instructor}</td>
                    <td className="py-3 text-slate-blue dark:text-glacier">{item.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    )
  }

  if (selectedYear) {
    return (
      <div className="space-y-5">
        <Button variant="outline" size="sm" onClick={() => setSelectedYear(null)}>
          <ChevronRight className="size-4 rotate-180" />
          Back
        </Button>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(sections[selectedYear] || []).map((section) => (
            <button
              key={section}
              type="button"
              onClick={() => setSelectedSection(section)}
              className="rounded-xl border border-glacier bg-white p-6 text-left shadow-sm transition hover:border-lapis hover:shadow-md dark:border-lapis dark:bg-abyss/50 dark:hover:border-glacier"
            >
              <h3 className="text-lg font-semibold text-abyss dark:text-quartz">{section}</h3>
              <p className="mt-1 text-sm text-slate-blue dark:text-glacier">Click to view schedule</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {yearOrder.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          {showAddSection ? (
            <div className="flex items-center gap-2">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name (e.g., BSCS 1E)"
                className="h-9 rounded-lg w-48"
              />
              <Button size="sm" onClick={() => {
                if (newSectionName.trim() && selectedYear) {
                  addSection(selectedYear, newSectionName.trim())
                  setNewSectionName("")
                  setShowAddSection(false)
                }
              }}>
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddSection(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setShowAddSection(true)}>
              <Plus className="size-4" />
              Add Section
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Object.entries(sections).map(([year, yearSections]) => (
          <button
            key={year}
            type="button"
            onClick={() => setSelectedYear(year)}
            className="rounded-xl border border-glacier bg-white p-6 text-left shadow-sm transition hover:border-lapis hover:shadow-md dark:border-lapis dark:bg-abyss/50 dark:hover:border-glacier"
          >
            <h3 className="text-lg font-semibold text-abyss dark:text-quartz">{year}</h3>
            <p className="mt-1 text-sm text-slate-blue dark:text-glacier">
              {yearSections.length} section{yearSections.length !== 1 ? "s" : ""}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
