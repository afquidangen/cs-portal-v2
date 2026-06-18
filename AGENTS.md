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
<!-- END:grading-architecture -->
