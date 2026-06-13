# Add Year and Section Filters to Schedules Tab

## Changes in `features/portal/components/modules/classes-module.tsx`

### Edit 1 — Add filter state (after line 177)

```tsx
  const [addScheduleYear, setAddScheduleYear] = useState("")
  const [selectedScheduleYear, setSelectedScheduleYear] = useState("All Years")
  const [selectedScheduleSection, setSelectedScheduleSection] = useState("All Sections")
```

### Edit 2 — Add derived options (after line 197, before `getCurriculumSubjects`)

```tsx
  const scheduleYearOptions = useMemo(
    () => ["All Years", ...yearSections.map((y) => y.year)],
    [yearSections]
  )
  const scheduleSectionOptions = useMemo(() => {
    if (selectedScheduleYear === "All Years")
      return ["All Sections", ...yearSections.flatMap((y) => y.sections)]
    const found = yearSections.find((y) => y.year === selectedScheduleYear)
    return ["All Sections", ...(found?.sections ?? [])]
  }, [selectedScheduleYear, yearSections])
```

### Edit 3 — Update `filteredSchedules` (lines 236-239)

Replace:
```tsx
  const filteredSchedules = useMemo(() => {
    if (!selectedSemesterId) return classSchedules
    return classSchedules.filter((s) => s.semesterId === selectedSemesterId)
  }, [classSchedules, selectedSemesterId])
```
With:
```tsx
  const filteredSchedules = useMemo(() => {
    let result = classSchedules
    if (selectedSemesterId) {
      result = result.filter((s) => s.semesterId === selectedSemesterId)
    }
    if (selectedScheduleYear !== "All Years") {
      const sectionsInYear = yearSections.find((y) => y.year === selectedScheduleYear)?.sections ?? []
      result = result.filter((s) => sectionsInYear.includes(s.section))
    }
    if (selectedScheduleSection !== "All Sections") {
      result = result.filter((s) => s.section === selectedScheduleSection)
    }
    return result
  }, [classSchedules, selectedSemesterId, selectedScheduleYear, selectedScheduleSection, yearSections])
```

### Edit 4 — Add dropdowns in filter row (after line 529, before the `Add Class` button)

After:
```tsx
              />
```
(of the semester Select, line 529)

Add:
```tsx
              <Select
                value={selectedScheduleYear}
                onChange={(v) => {
                  setSelectedScheduleYear(v)
                  setSelectedScheduleSection("All Sections")
                }}
                options={scheduleYearOptions}
                className="min-w-[120px]"
              />
              <Select
                value={selectedScheduleSection}
                onChange={setSelectedScheduleSection}
                options={scheduleSectionOptions}
                className="min-w-[140px]"
              />
```

## After applying
Run `npm run build` to verify no errors.
