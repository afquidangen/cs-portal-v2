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
