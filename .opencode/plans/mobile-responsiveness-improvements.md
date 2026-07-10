# Mobile Responsiveness Improvements Plan

## Issues Identified

### 1. Grades Registry Mobile View
**Current State:**
- Lines 575-645 in `grades-module.tsx`: Mobile card view exists
- User reports it's "just scrolling" - needs better mobile layout

**Proposed Solution:**
- Improve card layout to be more compact and readable on mobile
- Ensure proper spacing and typography for small screens
- Make grade information more scannable

### 2. Instructor Info Email Display
**Current State:**
- Lines 261-266 in `instructors-module.tsx`: Email has `truncate` class
- Email addresses are being cut off on some mobile devices

**Proposed Solution:**
- Remove `truncate` class on mobile to show full email
- Use `break-all` or `break-words` to allow email wrapping
- Ensure email is fully visible on all screen sizes

---

## Implementation Plan

### File 1: `features/portal/components/modules/grades-module.tsx`

#### Changes to Mobile Card View (Lines 575-645)

**Current Issues:**
- Cards might be too tall/verbose on mobile
- Need better visual hierarchy
- Spacing could be optimized

**Proposed Changes:**

1. **Optimize Card Layout:**
   ```tsx
   // Make cards more compact
   <div key={grade.id} className="rounded-lg border border-border bg-card p-3 shadow-sm">
   ```

2. **Improve Header Section:**
   ```tsx
   <div className="mb-2 pb-2 border-b border-border">
     <p className="font-semibold text-foreground text-sm">{grade.subject}</p>
     <p className="text-xs text-foreground/70">{grade.code} • {grade.units} units</p>
   </div>
   ```

3. **Streamline Grade Display:**
   - Group related information together
   - Use more compact spacing
   - Ensure proper alignment

4. **Responsive Typography:**
   - Adjust font sizes for mobile
   - Ensure readability on small screens

### File 2: `features/portal/components/modules/instructors-module.tsx`

#### Changes to Email Display (Lines 261-266)

**Current Code:**
```tsx
<div className="space-y-1.5 text-sm text-foreground/80">
  <p className="flex items-center gap-2">
    <Mail className="size-4 shrink-0 text-muted-foreground" />
    <span className="min-w-0 truncate">{member.email}</span>
  </p>
</div>
```

**Proposed Changes:**

1. **Remove Truncate on Mobile:**
   ```tsx
   <span className="min-w-0 break-all sm:truncate">{member.email}</span>
   ```
   - `break-all`: Allows email to wrap on mobile
   - `sm:truncate`: Keeps truncation on larger screens if needed

2. **Alternative - Full Display:**
   ```tsx
   <span className="min-w-0 break-words">{member.email}</span>
   ```
   - `break-words`: Wraps at word boundaries (better for emails)

3. **Ensure Proper Flex Layout:**
   ```tsx
   <p className="flex items-start gap-2">
     <Mail className="size-4 shrink-0 text-muted-foreground mt-0.5" />
     <span className="min-w-0 break-words text-sm">{member.email}</span>
   </p>
   ```

---

## Testing Checklist

### Grades Registry Mobile
- [ ] Test on iPhone SE (375px width)
- [ ] Test on iPhone 12/13 (390px width)
- [ ] Test on iPhone 14 Pro Max (430px width)
- [ ] Test on Android devices (various sizes)
- [ ] Verify all grade information is visible
- [ ] Ensure cards are not too tall
- [ ] Check readability of text
- [ ] Verify proper spacing

### Instructor Info Mobile
- [ ] Test with short email addresses
- [ ] Test with long email addresses
- [ ] Test with very long email addresses
- [ ] Verify email wraps properly on mobile
- [ ] Ensure email icon aligns correctly
- [ ] Check on various screen sizes
- [ ] Verify no horizontal scrolling

---

## Files to Modify

1. `features/portal/components/modules/grades-module.tsx`
   - Lines 575-645: Mobile card view optimization

2. `features/portal/components/modules/instructors-module.tsx`
   - Lines 261-266: Email display fix

---

## Expected Results

### Grades Registry
- More compact and readable cards on mobile
- Better visual hierarchy
- Easier to scan grade information
- No unnecessary scrolling

### Instructor Info
- Full email addresses visible on all mobile devices
- Proper wrapping for long emails
- No truncation issues
- Consistent display across all screen sizes
