"use client"

import { Panel } from "../shared/dashboard-ui"
import type { PortalModuleProps } from "./types"

export function GradeHistoryModule({ model }: PortalModuleProps) {
  const studentUser = model.users.find((u) => u.id === model.profile.id)
  const history = studentUser?.gradeHistory ?? []

  return (
    <Panel title="Past Grades" eyebrow="Grade History">
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No past grade records yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-xs font-semibold text-muted-foreground">
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2 text-center">Final %</th>
                <th className="px-3 py-2 text-center">Trans. Grade</th>
                <th className="px-3 py-2">Remarks</th>
                <th className="px-3 py-2">Year &mdash; Semester</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{entry.subjectCode}</td>
                  <td className="px-3 py-2 text-foreground/80">{entry.subjectName}</td>
                  <td className="px-3 py-2 text-center text-foreground">{entry.finalPercentile}</td>
                  <td className="px-3 py-2 text-center text-foreground">{entry.transmutedGrade}</td>
                  <td className="px-3 py-2 text-foreground/80">{entry.remarks}</td>
                  <td className="px-3 py-2 text-foreground/60 text-xs">{entry.yearLevel} &mdash; {entry.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
