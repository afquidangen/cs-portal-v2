# Fix faculty announcement scope

## Goal
- Admin sees only global announcements (no `classSection`)
- Faculty picks ONE section from their assigned sections (no "All Users")
- Faculty announcements visible only to that section's students + the faculty
- Students see global + announcements matching their section

## File 1: `announcements-panel.tsx`

### Edit A — Destructure `profileSection`

**Line 59-60**, change:
```tsx
    facultyClassSections,
  } = model
```
To:
```tsx
    facultyClassSections,
    profileSection,
  } = model
```

### Edit B — Update filter logic

**Lines 61-66**, replace:
```tsx
  const filtered = role === "admin"
    ? announcements
    : announcements.filter((a) => {
        if (role === "student") return a.audience === "All Users" || a.audience === "Students"
        return a.audience === "All Users" || a.audience === "Faculty" || (a.classSection && facultyClassSections.includes(a.classSection))
      })
```
With:
```tsx
  const filtered = announcements.filter((a) => {
    if (role === "admin") return !a.classSection
    if (role === "student") return a.audience === "All Users" || a.audience === "Students" || (a.classSection && a.classSection === profileSection)
    return a.audience === "All Users" || a.audience === "Faculty" || (a.classSection && facultyClassSections.includes(a.classSection))
  })
```

## File 2: `announcement-manager-module.tsx`

### Edit A — Update description text

**Line 46**, change:
```tsx
                Publish a new announcement visible to all users
```
To:
```tsx
                {role === "faculty" ? "Send an announcement to your class section" : "Publish a new announcement visible to all users"}
```

### Edit B — Update audience dropdown for faculty

**Lines 77-80**, change:
```tsx
                  <Select
                    value={announcementDraft.audience}
                    onChange={(value) =>
                      setAnnouncementDraft((current) => ({
                        ...current,
                        audience: value,
                        classSection: role === "faculty" && value !== "All Users" ? value : "",
                      }))
                    }
                    options={role === "faculty" ? ["All Users", ...facultyClassSections] : ["All Users", "Students", "Faculty"]}
                  />
```
To:
```tsx
                  {role === "faculty" ? (
                    <Select
                      value={announcementDraft.audience}
                      onChange={(value) =>
                        setAnnouncementDraft((current) => ({
                          ...current,
                          audience: value,
                          classSection: value,
                        }))
                      }
                      options={facultyClassSections}
                    />
                  ) : (
                    <Select
                      value={announcementDraft.audience}
                      onChange={(value) =>
                        setAnnouncementDraft((current) => ({
                          ...current,
                          audience: value,
                        }))
                      }
                      options={["All Users", "Students", "Faculty"]}
                    />
                  )}
```

## Build
After applying, run `npm run build` to verify no errors.
