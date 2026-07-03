# My Classes Sync Fix Plan

## Problem
`visibleSchedules` (used by My Classes) replicated complex filtering logic from `visibleGrades` but failed for auto-enrolled subjects because their grade records lack `semesterId` and `classId`. The `gradeActive` check in the supplement code blocked them entirely.

## Solution
**Move `visibleSchedules` after `visibleGrades`** so it can directly reference `visibleGrades` as the source of truth. No more duplicated filtering logic.

## Steps

### Step 1: Remove current `visibleSchedules` (lines 504-670)
Delete the full block including the broken supplement code.

### Step 2: Insert new `visibleSchedules` after `visibleGrades` (after line 945)
New code:
- Filter `classSchedules` (same section/passed/active logic) → `matched`
- Build `Set` of subject codes from `matched`
- For each entry in `visibleGrades`:
  - If its subject code is NOT in the schedule set → push a synthetic `ScheduleItem` with `day: ""`, `time: ""`, `room: "—"`, `instructor: "—"` using the grade's `subject`, `section`, and `semesterId`

### Step 3: Update dependencies
`visibleSchedules` now depends on `visibleGrades` + its existing deps.

## Guarantees
- **100% sync** — same subject list as Overview
- **Adapts automatically** — any change to `visibleGrades` (enrollment, unenrollment, completion, advancement, irregular subjects) instantly reflected
- **No duplicated logic** — single source of truth
- **All student types handled** — regular, irregular, advanced, back subjects, retakes
