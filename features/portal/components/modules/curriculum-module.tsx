"use client"

import { useState } from "react"

import { curriculumSeed } from "../../data/portal-data"
import { Panel, Select } from "../shared/dashboard-ui"

export function CurriculumModule() {
  const [selectedCurriculum, setSelectedCurriculum] = useState(curriculumSeed[0].id)

  const curriculum = curriculumSeed.find((c) => c.id === selectedCurriculum) || curriculumSeed[0]

  const majors = curriculumSeed
    .filter((c) => c.major)
    .map((c) => ({ id: c.id, major: c.major || "" }))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedCurriculum}
          onChange={setSelectedCurriculum}
          options={curriculumSeed.map((c) => c.id)}
        />
        <span className="text-sm text-slate-blue dark:text-glacier">
          {curriculum.name}
          {curriculum.major ? ` - ${curriculum.major}` : ""}
        </span>
      </div>

      <div className="space-y-6">
        {curriculum.terms.map((term) => (
          <Panel
            key={`${term.year}-${term.term}`}
            title={`${term.year}${term.term ? ` - ${term.term}` : ""}`}
            eyebrow={`${term.subjects.reduce((sum, s) => sum + s.totalUnits, 0)} total units`}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead className="border-b border-glacier text-xs uppercase text-slate-blue dark:border-lapis">
                  <tr>
                    <th className="py-2 pr-4">Subject Code</th>
                    <th className="py-2 pr-4">Subject Name</th>
                    <th className="py-2 pr-4">LEC Units</th>
                    <th className="py-2 pr-4">LAB Units</th>
                    <th className="py-2">Total Units</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glacier dark:divide-lapis">
                  {term.subjects.map((subject) => (
                    <tr key={subject.code}>
                      <td className="py-3 pr-4 font-medium text-abyss dark:text-quartz">
                        {subject.code}
                      </td>
                      <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                        {subject.name}
                      </td>
                      <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                        {subject.lecUnits}
                      </td>
                      <td className="py-3 pr-4 text-slate-blue dark:text-glacier">
                        {subject.labUnits}
                      </td>
                      <td className="py-3 font-semibold text-abyss dark:text-quartz">
                        {subject.totalUnits}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
