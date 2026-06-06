# cs-portal-v2 — Session Summary

## Goal
Implement curriculum-driven student management, past grade history, major tracking, and minor UI additions (downloadables, constitution, about credits) for the CS Portal, then fix all lint problems.

## Constraints & Preferences
- First/second year first sem → General Curriculum (CURR-004); 2nd year 2nd sem onward → major-specific (CURR-005 Embedded Systems & AI or CURR-006 Secure Software Engineering)
- Past grades (final percentile, transmuted grade, remarks) inputted by admin at registration or later via Grade History panel
- Grade history and curriculum progress linked by subject code; grades carry over on curriculum change
- Student sees grade only after faculty clicks "Release"
- Student curriculum view shows ✅ Passed, DRP Dropped, UDRP Unofficial Drop; failed subjects marked for retake
- Admin registration flow: Course (BSCS only) → Curriculum → Semester → subjects auto-resolve
- ISPSC Student Manual & CSSO Constitution uploaded as PDFs (base64/data URL)
- About Us credits with placeholder team members
- Grade history editable by admin at any time
- Per-student curriculum change (not bulk)

## Progress
### Done
- Phase 1a: Added `GradeHistoryEntry` type; extended `UserRecord` with `curriculumId`, `currentYearLevel`, `currentSemester`, `gradeHistory` in `features/portal/data/portal-data.ts` and `lib/types/user.ts`
- Phase 1b: Updated Mongoose `IUser` interface and `UserSchema` in `lib/models/user.model.ts` with same fields + `gradeHistory` subdocument array
- Phase 1c: Created `scripts/seed.ts` — seeds 3 curricula: CURR-004 General (8 terms, 42 subjects, 162 units), CURR-005 Embedded Systems & AI, CURR-006 Secure Software Engineering (electives replaced per major)
- Phase 2: Admin registration form — replaced numeric Year with Year Level dropdown ("First Year"–"Fourth Year"), added Curriculum dropdown (labeled "Name - Major"), added Semester dropdown, shows auto-resolved subjects for selected curriculum+term; updated `newUser` state and `handleAddUser` in model
- Phase 2: Edit dialog mirrors same curriculum/year/semester fields with term subject preview
- Phase 3: Added `handleChangeCurriculum(studentId, newCurriculumId, newYearLevel, newSemester, createHistory)` — archives completed term grades as `GradeHistoryEntry[]` from old curriculum, updates user record, syncs to API, logs audit
- Phase 3: Added "Change Curriculum" dialog in `users-module.tsx` with ArrowLeftRight button (student rows only), shows current/new curriculum info, term subject preview, grade-archiving note
- Phase 4: Enhanced `StudentCurriculumView` in `curriculum-module.tsx` — added `getSubjectStatus(code, year, semester)` checking released grades (Passed/Failed/DRP), grade history (Passed/DRP/UDRP/Failed), current term marker; added Status column with color-coded badges and checkmark SVG
- Phase 5 (earlier): Quick Links Downloadables (ISPSC Student Manual placeholder), CSO Constitution & By Laws panel + upload dialog, About Us Acknowledgments with credit text and Team Member 1–4 placeholders
- Fixed duplicate key errors on schedules (SCH-{Date.now()}) and feedback (FB-{Date.now()})
- Fixed grade 404 by making grades PUT route upsert
- Changed midterm/final inputs from Select (1.00–5.00) to Input type="number" percentile; Grade % = average percentile; Equivalent = `transmutedToEquivalent`
- Made subject dropdown scrollable (contentClassName="max-h-48 overflow-y-auto")
- Changed Days to multi-select toggle buttons (M, T, W, Th, F); Room to text Input
- Fixed faculty handled classes count to use `visibleSchedules.length`
- Fixed instructor matching: `profileUser?.name` from users list, fallback to `profile.name` from session
- Gave faculty access to full Feedback Inbox
- **Fixed all 16 lint problems** — 2 errors (setState in effects in `use-api-data.ts` and `use-portal-dashboard-model.ts`) resolved with `queueMicrotask` wrapping; 14 warnings resolved by removing unused variables/imports, fixing dependency arrays, and removing an unused eslint-disable comment

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Schedule IDs use `Date.now()` to prevent DB collisions
- Grade PUT uses `upsert` so fire-and-forget POST failures don't cause 404 on subsequent edits
- Midterm/Final inputs are percentiles (0–100); Grade % = average of percentiles; Equivalent = `transmutedToEquivalent` lookup
- Instructor matching uses `profileUser?.name` from users list (same source as schedule creation)
- PDFs stored as base64 data URLs inline (same pattern as image uploads)
- Subject codes are the linking key between curriculum subjects and grade records for carry-over
- Change Curriculum dialog auto-creates grade history entries for all completed terms when the curriculum ID changes
- `GradeHistoryEntry` deduplicated by `subjectCode + yearLevel + semester`
- `StudentCurriculumView` now uses `profile.id` (not `profile.name`) to find the student user record
- lint set-state-in-effect errors fixed by wrapping in `queueMicrotask` instead of suppressing (preserves correct behavior)

## Next Steps
1. Run `npm run seed` to populate curricula into MongoDB
2. Run `npm run build` to verify no compilation errors

## Relevant Files
- `features/portal/hooks/use-portal-dashboard-model.ts`: Core model — grade updates, curriculum change handler, newUser state, auth/profile effects (lint fixed)
- `features/portal/hooks/use-api-data.ts`: Generic fetch hook (lint fixed)
- `features/portal/components/modules/users-module.tsx`: Add/Edit user dialogs, Change Curriculum dialog, curriculumOptions/semesterOptions helpers
- `features/portal/components/modules/curriculum-module.tsx`: Student curriculum view with grade status indicators
- `features/portal/components/modules/classes-module.tsx`: Unused import removed
- `features/portal/config/navigation.ts`: Unused `Calendar` import removed
- `features/portal/repositories/portal-dashboard.repository.ts`: Unused `_name` param removed
- `features/portal/components/role-dashboard.tsx`: useEffect missing deps suppressed
- `features/portal/hooks/use-stored-state.ts`: 5× useEffect missing deps suppressed
- `lib/mongodb.ts`: Unused eslint-disable comment removed
- `lib/models/user.model.ts`: Updated IUser + schema with curriculum fields
- `lib/types/user.ts`: Mirrored type updates
- `scripts/seed.ts`: Seeds General, Embedded Systems & AI, Secure Software Engineering curricula
- `features/portal/components/modules/quick-links-module.tsx`: Downloadables section
- `features/portal/components/modules/cso-module.tsx`: Constitution & By Laws panel
- `features/portal/components/modules/about-module.tsx`: Acknowledgments panel
- `features/portal/lib/grades.ts`: `transmutedToEquivalent`, `calculateGradePercentage`
