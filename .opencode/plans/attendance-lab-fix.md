# Fix: Attendance absences not imported for lecture-with-lab subjects

## Root Cause

`scanTemplateColumnMap` in `features/portal/lib/export-template-engine.ts` (line 214-216) distinguishes lecture vs lab attendance columns using `map.labStartCol`. But in the template, the **ATTEN section comes before** the lab categories (exercises/work attitude/project). When the scanner processes attendance, `labStartCol` is not yet set, so **both ABS columns overwrite `map.absencesCol`** and `map.labAbsencesCol` stays `null`.

## Fix

Replace the `labStartCol`-based detection with a simple **first-ABS → lecture, second-ABS → lab** approach.

### Edit 1 — `export-template-engine.ts` lines 209-224

**Before:**
```ts
if (gradeCategoryMatches("attendance", normalized) || ["atten", "attend"].includes(normalized)) {
      map.attendanceStartCol = col
      map.attendanceEndCol = regionEnd
      for (let c = col; c <= regionEnd; c++) {
        const r9 = row9Val(c)
        if (r9 === "ABS") {
          if (map.labStartCol && c >= map.labStartCol) map.labAbsencesCol = c
          else map.absencesCol = c
        } else if (r9 === "ATT") {
          if (map.labStartCol && c >= map.labStartCol) map.labAttendanceCol = c
          else map.attendanceCol = c
        }
      }
      col = regionEnd + 1
      continue
    }
```

**After:**
```ts
if (gradeCategoryMatches("attendance", normalized) || ["atten", "attend"].includes(normalized)) {
      map.attendanceStartCol = col
      map.attendanceEndCol = regionEnd
      for (let c = col; c <= regionEnd; c++) {
        const r9 = row9Val(c)
        if (r9 === "ABS") {
          if (map.absencesCol == null) map.absencesCol = c
          else map.labAbsencesCol = c
        } else if (r9 === "ATT") {
          if (map.attendanceCol == null) map.attendanceCol = c
          else map.labAttendanceCol = c
        }
      }
      col = regionEnd + 1
      continue
    }
```

### Why this works

| Scenario | First ABS | Second ABS | `labAbsencesCol` |
|---|---|---|---|
| 1 ABS col only | `absencesCol` set | — | stays null ✓ |
| 2 ABS cols (lecture-only template) | `absencesCol` = first | — (no second) | stays null ✓ |
| 2 ABS cols (lab template, ATTEN before lab section) | `absencesCol` = lec | `labAbsencesCol` = lab | set ✓ |
| 2 ABS cols (lab template, ATTEN after lab section) | `absencesCol` = lec | `labAbsencesCol` = lab | set ✓ |

Same logic applies to `ATT` → `attendanceCol` / `labAttendanceCol`.

### Files to modify
- `features/portal/lib/export-template-engine.ts` (only this file)
