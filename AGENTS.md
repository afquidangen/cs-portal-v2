<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:grading-architecture -->
## Grading Architecture Summary

### Structure
- **Scheme**: Has `components[]` and optional `labComponents[]`.  
  - Lecture-only: `components = [Class Standing (60%), Exam (40%)]`
  - Lecture w/ Lab: `components = [Lecture Class Standing (60%), Lecture Exam (40%)]`, `labComponents = [Laboratory (100%)]`, `lectureWeight`/`laboratoryWeight` for overall split.

### Formulas

**Per category:**
```
PS = Score ÷ MaxScore
Category% = PS × 100   (range 0–100)
WS = Category% × CategoryWeight   (simple contribution to class standing)
```

**Class Standing** (4 CS categories, weights sum to 100%):
```
ClassStanding = Σ(Category% × CategoryWeight)
```
Range 0–100. Internally computed via `computeClassStanding()` using min‑max normalization of WS values — algebraically equivalent to the simple weighted sum when weights sum to 100%.

**Exam Grade:**
```
ExamGrade = PS × 100   (range 0–100, a regular percentage)
```
Computed via `computeExamGrade()` — returns `(pct × 100)`.

**Lecture Grade:**
```
LectureGrade = ClassStanding × 0.60 + ExamGrade × 0.40
```

**Lab Grade:** Same simple weighted sum as Class Standing, using lab categories.

**Period Grade** (Midterm/MG or Tentative Final/FG):
```
Lecture-only:        periodGrade = lectureGrade
Lecture w/ Lab:      periodGrade = lectureGrade × lectureWeight + labGrade × labWeight
```

**Final Grade:**
```
FinalGrade = (MG + FG) / 2
```
Equivalent to `MG × 0.50 + FG × 0.50`.

### Key Rules
1. Exam is **never** part of Class Standing categories — it's a separate component with weight 40% within Lecture.
2. Exam formula is `PS × 100` (plain percentage), **not** `(PS × 50) + 50`.
3. Attendance defaults to **perfect score** (Category% = 100 → contribution = 100 × catWeight) when no grade record exists.
4. All percentage/weight values configurable via admin grading settings — not hardcoded. Defaults: CS/Exam split 60/40, lecture/lab split 60/40.
5. Category names matched via aliases in `CATEGORY_ALIASES` (e.g. "quiz" ↔ "quizzes", "lab quiz" ↔ "exercises").
6. Period naming: "Major Grade (MG)" = midterm, "Final Grading Period (FG)" = tentative final. Both use identical formulas and weights.

### Files
- `features/portal/lib/grade-engine.ts` — all pure‑function compute logic
- `app/api/portal/grades/compute/route.ts` — server‑side batch compute endpoint
- `features/portal/components/modules/grades-module.tsx` — client‑side live preview
- `scripts/seed-grading-schemes.ts` — default scheme definitions

### Percentile Column Fix
- **Problem:** Summary tab "Percentile" column read `field: "finalGrade"` from row data. Compute endpoint only writes `finalGrade` when `midtermGrade > 0`, so after computing only the final period, `finalGrade` stays undefined and the column shows blank.
- **Fix:** Changed `valueFormatter` to read from `gradeMapRef.current` (same as "Tentative Final" column), falling back to `tentativeFinalGrade` when `finalGrade` is undefined. No grade logic changed — purely a display fix.
- **File:** `features/portal/components/grades/spreadsheet-grid.tsx` line 1019-1024
<!-- END:grading-architecture -->

<!-- BEGIN:session-3 -->
## Session 3 — Logo Fix, PDF Reports, CSSO Cover Photo

### Logo Corruption Root Cause
- **Problem:** Appraisal sheet PDF logo and school title appeared "corrupted."
- **Root cause:** The base64 PNG embedded in `downloadAppraisalSheetPdf()` was truncated. The Read tool displays lines longer than 2000 chars as `(line truncated to 2000 chars)`. When this truncated display text was copied as the `oldString` in the Edit tool, the file literally stored the text `... (line truncated to 2000 chars)` instead of the full 504KB base64. The resulting `<img src="data:...` ended in `... (line truncated to 2000 chars)` → broken image.
- **Fix:** Replaced the truncated tag (length 2062) with the full tag (length 504494) from the working `downloadGradeReportPdf()` function.
- **Key lesson:** Never rely on Read tool output for long base64 strings — always verify actual bytes in file. Consider extracting shared long strings to a constant.

### Appraisal Sheet PDF Export
- New function `downloadAppraisalSheetPdf()` in `use-portal-dashboard-model.ts`
- HTML template with legal paper size (`@page { size: legal; margin: 0.25in; }`)
- One table per year level, grouped by semester, subject code/description/units/grade/remarks
- Grade lookup: check `grades[]` first, then `gradeHistory[]`
- Image-load-aware print trigger (waits for all `<img>` onload events, 3s fallback)
- Header HTML+CSS exactly matches `downloadGradeReportPdf()` (same logo base64, institution text, CSS classes)
- No photo placeholder, no footer disclaimer
- Button added in `curriculum-module.tsx` Panel actions

### CSSO Cover Photo
- Added `coverImageUrl` and `coverImagePublicId` to `CsoInfoRecord` (lib/types/cso-info.ts) and `ICsoInfo`/Mongoose schema (lib/models/cso-info.model.ts)
- Upload: `PUT /api/portal/cso-info` route destroys existing cover image via Cloudinary before storing new one
- Display: hero section uses plain `<img>` (NOT `next/image`) with `aspect-[21/9] w-full object-cover` and overlaid "Edit Cover" button
- Form: `CsoInfoFormDialog` has a Cover Photo upload field with preview and remove button

### UI Cleanup
- **BookOpen icon removed** from instructor cards (`instructors-module.tsx`)
- **Download CSV button removed** from grades module; PDF button changed to filled blue (`bg-blue-600 text-white`)
- **Grade report footer:** font-size 12px, color #475569, disclaimer left-aligned, credit `<p>` with margin-top: 14px
- **Units column** added to grade report PDF table (right of Transmuted Grade), with `Total Units: X` below GWA

### Pre-existing Issues
- TypeScript error in `deans-list-module.tsx:22` (`SemesterRecord` not exported from `../../data/portal-data`) blocks `next build` but not our changes
- Logo base64 is duplicated (~504KB × 2) across both PDF functions — consider extracting to a shared constant

### Relevant Files
- `features/portal/hooks/use-portal-dashboard-model.ts` — both PDF export functions, logo base64
- `features/portal/components/modules/grades-module.tsx` — removed CSV, colored PDF button
- `features/portal/components/modules/curriculum-module.tsx` — appraisal sheet button
- `features/portal/components/modules/cso-module.tsx` — cover photo hero & form dialog field
- `features/portal/components/modules/instructors-module.tsx` — removed BookOpen
- `lib/types/cso-info.ts` — coverImageUrl/coverImagePublicId fields
- `lib/models/cso-info.model.ts` — schema fields
- `app/api/portal/cso-info/route.ts` — upload/destroy cover image
- `features/portal/components/modules/types.ts` — PortalModuleProps type
<!-- END:session-3 -->

<!-- BEGIN:session-4 -->
## Session 4 — Template-Based Excel Export

### Summary
Replaced the generic `XLSX.utils.aoa_to_sheet()` export with the institution's official Excel templates. The single template file (`templates/2SSY2526 CS4A IAS Class Record (gsheetv4.2).xlsx`) contains 4 sheets: `CLASS RECORD`, `GS MID`, `GS FIN`, `REPORTS OF GRADE`. All sheets are linked via cross-sheet formulas — raw scores go into `CLASS RECORD`, and the other sheets auto-populate.

### Architecture
1. **`features/portal/lib/export-template-engine.ts`** — Core engine that:
   - Loads the template via `exceljs` (preserving all formatting)
   - Populates raw input cells (individual item scores, absences, exam scores) in CLASS RECORD
   - Uses system-computed values for non-formula cells
   - Handles lecture-only subjects by hiding lab columns
   - Copies sheet to output workbook with all support sheets (CLASS RECORD, LOOKUP, PERCENTAGE)
   - Support sheets are hidden for non-CLASS RECORD exports (formulas still work)

2. **`app/api/portal/grades/export/route.ts`** — Modified to accept `templateType` param:
   - `?classId=X&templateType=class-record` — Class Record
   - `?classId=X&templateType=gs-mid` — GS Mid
   - `?classId=X&templateType=gs-fin` — GS Fin
   - `?classId=X&templateType=report-of-grades` — Report of Grades
   - Falls back to original generic export when `templateType` is omitted

3. **`features/portal/components/grades/spreadsheet-toolbar.tsx`** — Replaced single Export button with a `<Select>` dropdown offering the 4 template types

4. **`features/portal/components/grades/spreadsheet-grid.tsx`** — `handleExport()` now accepts optional `templateType`, appends `?templateType=` to the fetch URL

### Key Design Decisions
- **Library**: `exceljs` (added to package.json) — preserves formatting, formulas, merged cells, borders, fonts, colors, print settings
- **Template approach**: Only populate raw input cells in CLASS RECORD; let existing template formulas compute PS, WS, CS, grades, transmuted, remarks
- **Cross-sheet formulas**: GS MID, GS FIN, ROG reference `'CLASS RECORD'!` cells. The output workbook always includes CLASS RECORD (hidden for non-CR exports) so formulas work
- **Support sheets**: LOOKUP and PERCENTAGE sheets (used by TRANSMUTED formulas) are included as hidden sheets
- **Lecture-only**: Lab columns are hidden via `worksheet.getColumn(N).hidden = true`
- **Category matching**: Uses `gradeCategoryMatches()` from grade engine for alias-aware matching
- **Score ordering**: Columns mapped to template item slots by `order` field, up to 10 items per category

### Files Modified/Created
| File | Action |
|---|---|
| `package.json` | Added `exceljs` dependency |
| `features/portal/lib/export-template-engine.ts` | **Created** — core engine (~630 lines) |
| `app/api/portal/grades/export/route.ts` | Modified — added `templateType` param support |
| `features/portal/components/grades/spreadsheet-toolbar.tsx` | Modified — Export dropdown with 4 types |
| `features/portal/components/grades/spreadsheet-grid.tsx` | Modified — `handleExport(type)` support |

### Template Capacity
- CLASS RECORD: ~90 student rows (rows 10-99)
- GS MID: ~115 student rows (rows 9-123)
- GS FIN: ~115 student rows (rows 9-123)
- REPORTS OF GRADE: ~198 students (3-column layout, rows 12-77)
- Row duplication occurs automatically for classes exceeding template capacity, but cross-sheet formulas in GS MID/FIN/ROG won't extend beyond the original range
<!-- END:session-4 -->

<!-- BEGIN:session-5 -->
## Session 5 — Unified Single-File Export

### Summary
Replaced the per-type dropdown export (Class Record / GS Mid / GS Fin / Report of Grades as separate downloads) with a **single Export button** that outputs **one xlsx file containing all 4 sheets** (CLASS RECORD, GS MID, GS FIN, REPORTS OF GRADE) plus hidden support sheets (LOOKUP, PERCENTAGE).

### Key Changes

**Export Engine** (`export-template-engine.ts`):
- Removed `ExportType` union, `SHEET_NAMES`, `FILENAME_MAP` — no longer type-parameterized
- Changed `exportTemplate(classId)` — single params, no template type
- Resolves semester name & AY from `schedule.semesterId` → `semestersRepository.findOne()`
- Populates header info (subject, courseNo, section, semester, ay, faculty) on ALL 4 sheets
- Populates raw scores only on CLASS RECORD
- Output workbook copies all 4 sheets + LOOKUP + PERCENTAGE
- Sets `outWb.calcProperties = { fullCalcOnLoad: true }` so Excel recalculates cross-sheet formulas on open
- Fix: `section.replace()` wrapped with `String(section ?? "")` to prevent undefined errors
- Removed unused imports (`computeAllCategoryGrades`, `computeClassStanding`, `computeExamGrade`, `computeLaboratoryGrade`, `computePeriodGrade`, `computeLectureGrade`, `computeCategoryGrade`, `assessmentRepository`)

**API Route** (`export/route.ts`):
- Removed `templateType` query param, `VALID_TEMPLATE_TYPES`, `FILENAME_MAP`
- Always calls `exportTemplate(classId)` with no type param
- Filename: `Class Record - {section}.xlsx`

**UI** (`spreadsheet-toolbar.tsx`):
- Replaced `<Select>` dropdown with a single blue `<Button variant="default">`
- Removed `export_*` action types from `ToolbarAction`

**Grid** (`spreadsheet-grid.tsx`):
- `handleExport()` → no `templateType` parameter, no `?templateType=` URL param
- Removed `action.startsWith("export_")` dispatch block

### Files Modified

| File | Action |
|---|---|
| `features/portal/lib/export-template-engine.ts` | Rewritten — removed export types, added semester resolution, unified output |
| `app/api/portal/grades/export/route.ts` | Simplified — removed templateType handling |
| `features/portal/components/grades/spreadsheet-toolbar.tsx` | Reverted to single Export button |
| `features/portal/components/grades/spreadsheet-grid.tsx` | Simplified handleExport, removed export_ dispatch |

### Pre-existing issues (unchanged)
- TypeScript errors in `deans-list-module.tsx`, `grades-module.tsx`, `role-dashboard.tsx`, `base.repository.ts` — all predate this session
<!-- END:session-5 -->

<!-- BEGIN:session-6 -->
## Session 6 — Dynamic Template Column Scanning

### Summary
Replaced all hardcoded column indices and scheme-based matching with a dynamic template scanning approach. The export now reads the template structure directly (rows 5, 7, 9 of CLASS RECORD) to discover assessment categories, numbered columns, and their positions.

### Key Changes

**New function: `scanTemplateColumnMap(sheet, startCol, endCol)`**
- Scans row 7 labels to detect category region boundaries (merged cell regions)
- Strips percentage suffixes via `/\s*-?\s*\d+%\s*$/` to get base names
- Normalizes base names to aliases using `gradeCategoryMatches`
- Scans row 9 within each region for assessment numbers (1-10) → `itemColumns[]`
- Detects special columns: CS, EXAM, attendance (ABS/ATT), total (value "1"), MG/FG, TRANSMUTED, REMARKS
- Detects lab section start when encountering exercise/work attitude/project categories
- Returns a `TemplatePeriodMap` object with all category templates and metadata columns

**New types:** `TemplateCategory`, `TemplatePeriodMap` — replace `ClassRecordSectionMapping`, `CategorySlotMapping`

**Rewritten: `populatePeriodSection`**
- Takes `TemplatePeriodMap` instead of `ClassRecordSectionMapping`
- Groups GradeColumns by their own `.category` field
- Matches each column to a template category via `gradeCategoryMatches(cat.alias, col.category)`
- Writes each item to `itemColumns[order - 1]` (matches assessment number to template column)
- Writes exam, attendance, absences, computed values to detected columns
- All scheme parameters removed (`examCategories`, `labCategories`, `isLabSubject`)

**Rewritten: `populateHPSRow`**
- Same dynamic matching — writes `maxScore` to row 5 at item columns and exam column
- No longer needs scheme-based category parameters

**Removed:**
- `buildClassRecordMapping()` — hardcoded column map
- `ClassRecordSectionMapping`, `CategorySlotMapping` — old type definitions
- `findStandingAndExamComponents()` — scheme parsing (no longer needed)
- `gradingSchemeRepository` import, `scheme` loading, `GradingScheme`/`SchemeComponent`/`GradingCategory` type imports
- `hasLabColumns`/`subjectType`/labAliases detection — replaced by template scan

**Finals detection:**
- Scans row 3 for "FINALS" label to find the boundary between midterm and finals sections
- Falls back to `totalCols` if not found

**Lab subject detection:**
- Determined by `midtermMap.labStartCol != null` (template has exercise/work attitude/project categories)
- Lab column hiding uses scanned `labStartCol`/`labEndCol` boundaries instead of hardcoded values
- Row 6 label update uses first category column dynamically instead of hardcoded col 4

**Added:**
- `labTotalCol` to `TemplatePeriodMap` — lab section total column detected from second "1" in row 7
- Lab total grade writing (`midtermLaboratoryGrade`/`finalLaboratoryGrade`) restored

### Files
- `features/portal/lib/export-template-engine.ts` — all changes (534 lines, down from 580)

### Pre-existing issues (unchanged)
- TypeScript errors in `deans-list-module.tsx`, `grades-module.tsx`, `role-dashboard.tsx`, `base.repository.ts`
<!-- END:session-6 -->

<!-- BEGIN:session-7 -->
## Session 7 — Import Auto-Create Grade Records from Roster

### Summary
When a class has no grade records but has enrolled students in the roster (`ClassStudent`), the import preview was previously blocked by "No grades found" or silently skipped all students. Fixed by auto-creating Grade records from the roster during the preview phase, matching the same logic as `handleCreateSchedule` in the frontend hook.

### Root Cause
Grade records are NOT automatically created from enrollment. There is no server-side cascade from `ClassStudent` → `Grade`. Records are created only when:
- A schedule/class is created (trigger A: `handleCreateSchedule`)
- A student account is created (trigger B: `handleCreateUser`)
- A student is manually added in the spreadsheet (trigger C: `handleAddStudentToSubject`)

The import only works with Grade records — if none exist, there's nothing to match against.

### Fix
In `app/api/portal/grades/import/preview/route.ts`: when `grades.length === 0`, fetch the schedule and roster, then create missing Grade records for each enrolled student:

1. Fetch `ScheduleModel.findOne({ id: classId })` — gets section, subject, semesterId
2. Derive `code` from subject string (split on " - ") — same logic as hook
3. Fetch `ClassStudentModel.find({ section, enrolled: true, deletedAt: null })`
4. For each roster student, check if Grade exists; if not, create via `gradesRepository.create()`
5. Re-fetch grades and proceed with normal import

### Key Design
- Only creates records for roster-enrolled students — no file-to-DB injection
- Students in file but NOT in roster → skipped with warning (matching logic unchanged)
- Students in roster but NOT in file → empty grade record exists (no scores)
- Matching remains name-based (Session 6 fix) after records exist

### Files Modified
| File | Changes |
|---|---|
| `app/api/portal/grades/import/preview/route.ts` | Added ScheduleModel/ClassStudentModel imports, auto-create block when grades empty, changed `const grades` → `let grades` |

### Relevant Files
- `lib/models/grade.model.ts` — Grade schema with unique index on `(studentId, code, semesterId)`
- `lib/models/schedule.model.ts` — Schedule (class) schema
- `lib/models/class-student.model.ts` — Roster (enrollment) schema
- `features/portal/hooks/use-portal-dashboard-model.ts` — Reference implementation of grade record creation in `handleCreateSchedule`
<!-- END:session-7 -->

<!-- BEGIN:session-8 -->
## Session 8 — Import Attendance Key Fix & Diagnostic Visibility

### Summary
Fixed two import issues:
1. Attendance absences written to wrong scores key (wouldn't display in grid)
2. Diagnostic preview didn't show exam scores when no system GradeColumn existed for the finals period

### Attendance Key Fix
**Root cause:** `readPeriodScores` wrote absences to `scores[`${period}_absences_lecture`]`, but the grid reads from `scores[`${activeTab}_absences_${absenceCatKey}`]` where `absenceCatKey` = normalized grading scheme category name (e.g., `"attendance"` for "Attendance" category). No matching GradeColumn exists for attendance — it's a virtual column derived from the grading scheme.

**Fix:** Removed `findAttendanceCol()` (searched for GradeColumn — none exists). Changed fallback keys:
- `lecture` → `attendance` (grid key for "Attendance" scheme category)
- `lab` → `labattendance` (grid key for "Lab Attendance" scheme category)

### Diagnostic Exam Scores Fix
**Root cause:** When no system GradeColumn matches the finals period's exam category, `readPeriodScores` puts the exam score in `newColScores` (not `scores`). The diagnostic only captured `fin.scores`, so the preview dialog showed no exam entry for finals.

**Fix:** Merged `newColScores` entries into diagnostic `midScores`/`finScores` arrays alongside regular `scores` entries. Now the preview shows `final_exam_1=XX` when no existing column is found.

### Bonus Fix
- `spreadsheet-grid.tsx` — `importPreview` state was missing `gradeCount`, `rosterSection`, `rosterCount` fields required by `ImportPreviewData` type, causing TS build error. Added them.

### Files Modified
| File | Changes |
|---|---|
| `features/portal/lib/import-template-engine.ts` | Removed `findAttendanceCol()`, changed attendance keys to grid-compatible format, added `newColScores` to diagnostic |
| `features/portal/components/grades/spreadsheet-grid.tsx` | Added missing fields to `importPreview` state type |

### Relevant Context
- Grid attendance: virtual column at `spreadsheet-grid.tsx:1412` reads `scores[`${period}_absences_${absenceCatKey}`]`
- Attendance category key normalized from scheme category name (e.g., "Attendance" → "attendance")
- No GradeColumn record exists for attendance — entirely grading-scheme-derived
<!-- END:session-8 -->

<!-- BEGIN:session-9 -->
## Session 9 — Import Formula Cells, Lab Attendance Detection, Upsert Race Condition

### Summary
Three fixes:
1. `getEffectiveValue` didn't handle Excel formula cells (returned `{ formula, result }` object → `Number()` = `NaN`)
2. Lab attendance columns weren't detected in `scanTemplateColumnMap` because `labStartCol` wasn't set when ATTEN was processed
3. `upsert` in `base.repository.ts` used `$set: { id, ... }` causing race condition on duplicate `id` key

### Formula Cell Fix
**Root cause:** `getEffectiveValue` returned raw ExcelJS formula objects (`{ formula: "CD10", result: 45 }`) as-is. `Number(object)` = `NaN` → score skipped.

**Fix:** Added `result` property extraction before returning:
```ts
if ("result" in (value as any) && (value as any).result !== undefined) {
  return (value as any).result
}
```
Handles both `{ formula, result }` and `{ sharedFormula, result }` objects.

### Lab Attendance Detection Fix
**Root cause:** `scanTemplateColumnMap` used `map.labStartCol` to distinguish lecture vs lab ABS/ATT columns. In the template, ATTEN section comes BEFORE lab categories (exercises/work attitude/project), so `labStartCol` wasn't set yet. Both ABS columns overwrote `map.absencesCol` and `labAbsencesCol` stayed null.

**Fix:** Changed to first-ABS/second-ABS detection:
- First ABS → `map.absencesCol` (lecture)
- Second ABS → `map.labAbsencesCol` (lab)
Same logic for ATT → `attendanceCol` / `labAttendanceCol`.

### Upsert Race Condition Fix
**Root cause:** `base.repository.ts:upsert` used `$set: data` where `data` included `id`. If two saves raced (e.g., auto-save during import refresh), the second `findOneAndUpdate` with `upsert: true` could try to insert a doc with conflicting `id`.

**Fix:** Separated `id` into `$setOnInsert`:
```ts
const { id, ...setData } = data
this.model.findOneAndUpdate(filter, { $set: setData, $setOnInsert: { id } }, { upsert: true })
```

### Files Modified
| File | Changes |
|---|---|
| `features/portal/lib/export-template-engine.ts` | `getEffectiveValue` handles formula objects (`result` property); `scanTemplateColumnMap` uses first-/second-found for ABS/ATT instead of `labStartCol` |
| `features/portal/repositories/base.repository.ts` | `upsert` uses `$setOnInsert` for `id` |
| `app/api/portal/grades/import/execute/route.ts` | Removed temporary diagnostic logs |
| `features/portal/components/grades/spreadsheet-grid.tsx` | Removed temporary diagnostic logs |
| `features/portal/lib/import-template-engine.ts` | Removed temporary diagnostic logs |
<!-- END:session-9 -->
