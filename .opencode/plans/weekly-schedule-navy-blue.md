# Change Weekly Schedule Color from Green to Navy Blue

## Overview
Change the class block accent color in the weekly schedule from emerald/green to navy blue.

## Files to Modify

### 1. `features/portal/components/modules/my-classes-module.tsx`

**Line 206** (Mobile view):
```tsx
// FROM:
<div key={item.id} className="rounded-lg border border-slate-200 border-l-emerald-500 bg-emerald-50/40 px-3 py-2.5">

// TO:
<div key={item.id} className="rounded-lg border border-slate-200 border-l-blue-900 bg-blue-50/40 px-3 py-2.5">
```

**Line 243** (Desktop view):
```tsx
// FROM:
<div key={item.id} className="rounded-lg border border-slate-200 border-l-emerald-500 bg-emerald-50/40 px-3 py-2.5">

// TO:
<div key={item.id} className="rounded-lg border border-slate-200 border-l-blue-900 bg-blue-50/40 px-3 py-2.5">
```

## Color Choices

- **Left border**: `border-l-blue-900` (navy blue: #1e3a8a)
- **Background**: `bg-blue-50/40` (very light blue tint with 40% opacity: #eff6ff)

These colors will:
- Provide a professional navy blue accent
- Maintain good contrast in both light and dark modes
- The existing dark mode overrides in `globals.css` for blue colors will automatically handle dark mode styling

## Dark Mode Handling

No changes needed to `globals.css`. The existing blue color overrides will automatically apply:
- `.dark .bg-blue-50` → `rgb(59 130 246 / 0.12)`
- `.dark .border-blue-*` → appropriate dark mode blue tones

## Testing Checklist

- [ ] Verify mobile view shows navy blue left border
- [ ] Verify desktop view shows navy blue left border
- [ ] Verify light mode displays correctly
- [ ] Verify dark mode displays correctly
- [ ] Check that the color is distinctly navy blue (not just regular blue)

## Notes

- The emerald/green color overrides in `globals.css` will remain (they're used in other parts of the app)
- Navy blue (blue-900) is darker and more professional than the previous blue-500
- The light blue background (blue-50/40) provides subtle visual distinction without being overwhelming
