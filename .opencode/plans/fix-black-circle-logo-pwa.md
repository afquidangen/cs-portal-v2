# Fix Black Circle Around Logo in PWA

## Problem
When opening the PWA, there's a black circular background appearing around the logo, even though the PNG icons have proper transparency (only 0.24% dark pixels).

## Root Cause Analysis
1. The PNG icons have proper alpha channels and transparency
2. The manifest already has `background_color: "#ffffff"`
3. The issue is likely caused by:
   - Browser caching of old icon versions
   - PWA splash screen rendering with dark background
   - Icon purpose set to "maskable" which may apply backgrounds

## Solution Plan

### Step 1: Create Icons with Explicit White Backgrounds
**Files to create:**
- `public/icons/icon-192-whitebg.png` (already created)
- `public/icons/icon-512-whitebg.png` (already created)

**Command used:**
```bash
node -e "const sharp = require('sharp'); sharp('public/icons/icon-192.png').flatten({ background: { r: 255, g: 255, b: 255 } }).toFile('public/icons/icon-192-whitebg.png')"
node -e "const sharp = require('sharp'); sharp('public/icons/icon-512.png').flatten({ background: { r: 255, g: 255, b: 255 } }).toFile('public/icons/icon-512-whitebg.png')"
```

### Step 2: Update manifest.json
**File:** `public/manifest.json`

**Changes:**
1. Update icon references to use white background versions
2. Change `purpose` from `"any maskable"` to `"any"` to prevent maskable icon processing

**Before:**
```json
"icons": [
  {
    "src": "/icons/icon-192.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any maskable"
  },
  {
    "src": "/icons/icon-512.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any maskable"
  }
]
```

**After:**
```json
"icons": [
  {
    "src": "/icons/icon-192-whitebg.png",
    "sizes": "192x192",
    "type": "image/png",
    "purpose": "any"
  },
  {
    "src": "/icons/icon-512-whitebg.png",
    "sizes": "512x512",
    "type": "image/png",
    "purpose": "any"
  }
]
```

### Step 3: Add Apple Touch Icon with White Background
**File:** `public/icons/apple-touch-icon-whitebg.png`

**Command:**
```bash
node -e "const sharp = require('sharp'); sharp('public/icons/apple-touch-icon.png').flatten({ background: { r: 255, g: 255, b: 255 } }).toFile('public/icons/apple-touch-icon-whitebg.png')"
```

### Step 4: Update layout.tsx
**File:** `app/layout.tsx`

**Changes:**
Update the apple-touch-icon reference to use the white background version.

**Before:**
```tsx
icons: {
  icon: "/logo-source.svg",
  apple: "/icons/apple-touch-icon.png",
},
```

**After:**
```tsx
icons: {
  icon: "/logo-source.svg",
  apple: "/icons/apple-touch-icon-whitebg.png",
},
```

### Step 5: Clear Cache and Reinstall PWA
**User action required:**
1. Clear browser cache completely
2. Uninstall the PWA from home screen
3. Reinstall the PWA

## Expected Result
- Logo will appear with white background instead of black circle
- No transparency issues in PWA splash screen
- Consistent appearance across all platforms

## Alternative Solution (if above doesn't work)
If the issue persists, we can:
1. Create a custom splash screen image with white background
2. Add `splash_screens` to manifest.json (if supported)
3. Use a different icon format (ICO instead of PNG)

## Files Modified/Created
- `public/icons/icon-192-whitebg.png` (created)
- `public/icons/icon-512-whitebg.png` (created)
- `public/icons/apple-touch-icon-whitebg.png` (to be created)
- `public/manifest.json` (to be updated)
- `app/layout.tsx` (to be updated)
