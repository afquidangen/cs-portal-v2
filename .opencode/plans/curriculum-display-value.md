# Fix: Show only curriculum code in Select trigger

## Problem
When a curriculum is selected in the Add Account dialog, the full string
`"BSIT - Bachelor of Science in Information Technology - None"` overflows
the Select trigger because the name is too long.

## Solution
Add an optional `displayValue` prop to the shared `Select` component.
When provided, Radix renders the short label in the trigger while keeping
the full value for the dropdown and onChange logic.

## Changes

### 1. `features/portal/components/shared/dashboard-ui.tsx` (lines 197-240)

**Add `displayValue` to the props:**

```tsx
export function Select({
  value,
  onChange,
  options,
  label,
  className,
  contentClassName,
  displayValue,   // ← new
}: {
  value: string
  onChange: (value: string) => void
  options: string[]
  label?: string
  className?: string
  contentClassName?: string
  displayValue?: string   // ← new
})
```

**Change the trigger from:**
```tsx
<SelectValue placeholder="Select option" />
```
**to:**
```tsx
<SelectValue placeholder="Select option">
  {displayValue || undefined}
</SelectValue>
```

When `displayValue` is provided, Radix renders it instead of the full value string.
When absent (`undefined`), it falls back to the default behavior
(showing the selected value text).

### 2. `features/portal/components/modules/users-module.tsx` (line ~811)

**Pass `displayValue` to the Curriculum select:**

```tsx
<Select
  value={newUser.curriculum}
  displayValue={newUser.curriculum.split(" - ")[0]}
  onChange={(value) => {
    const curr = curricula.find(
      (c) => `${c.id} - ${c.name} - ${c.major}` === value
    )
    setNewUser((current) => ({
      ...current,
      curriculum: value,
      curriculumId: curr?.id ?? "",
    }))
  }}
  options={curriculumOptions}
/>
```

This extracts just the curriculum code (e.g. `"BSIT"`) for the trigger display,
while keeping `"BSIT - Bachelor of Science in Information Technology - None"`
as the actual value for dropdown matching and the onChange lookup.

## Verification
- `npm run build` should pass with zero errors
- Curriculum dropdown items still show full descriptions
- Selected curriculum trigger shows only the code (e.g. `"BSIT"`)
- Lookup and onChange logic unaffected
