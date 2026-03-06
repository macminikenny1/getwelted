# GetWelted — Web ↔ Mobile Feature Sync Tracker

> **Last Updated:** 2026-03-05
>
> **Web App:** Next.js 16 + Supabase — `/welted/web/`
> **Mobile App:** React Native + Expo — `/Projects/Welted/`
>
> This is a living document. Update it every time a feature is added, changed, or fixed on either platform.

---

## Quick Summary

| Status | Count |
|--------|-------|
| ✅ Both platforms in sync | 22 |
| 🔧 Mobile needs backport from web | 16 |
| 🔧 Web needs backport from mobile | 2 |
| 🔄 Data consistency issues | 3 |

---

## Feature Status Matrix

### Authentication

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Login (email/password) | ✅ | ✅ | — | — | — | Both use `supabase.auth.signInWithPassword` |
| Sign Up | ✅ | ✅ | — | — | — | |
| Forgot Password | ✅ | ❌ | P1 | M | `expo-linking` for deep link redirect | Web: `/forgot-password` calls `resetPasswordForEmail` |
| Reset Password | ✅ | ❌ | P1 | M | `expo-linking` | Web: `/reset-password` handles token from email link |
| Verify Email | ✅ | ❌ | P3 | S | — | Simple "check your email" screen after signup |

### Search & Discovery

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Search users | ✅ | ✅ | — | — | — | |
| Search by display_name | ✅ | ❌ | P1 | S | — | Web uses `.or()` for username + display_name; mobile only searches username |
| Search posts | ✅ | ✅ | — | — | — | Web searches caption/brand/model/leather; mobile only caption/brand |
| Search BST listings | ✅ | ✅ | — | — | — | Web searches brand/model/description; mobile only brand/model |
| Search collection pairs | ✅ | ❌ | P1 | M | — | Web queries `pairs` with `is_public=true` across 6 fields |
| Search brands database | ✅ | ❌ | P1 | M | — | Client-side filtering of `brandDatabase.ts` |
| Result limits | 8/type | 5/type | P3 | S | — | Minor difference |

### Brand Database

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Brand directory page | ✅ | ❌ | P2 | M | — | Web: `/brands` with 20+ brands, category filtering, expandable cards |
| `brandDatabase.ts` library | ✅ | ❌ | P2 | S | — | Copy from web to mobile `src/lib/` or `src/data/` |

### Image Handling

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Photo upload | ✅ | ✅ | — | — | — | |
| Multi-photo upload (pairs) | ✅ (10 max) | ✅ (10 max) | — | — | — | |
| Upload collision fix | ✅ | ❌ **BUG** | P0 | S | — | Mobile `uploadImage.ts` line 30 uses bare `Date.now()` — add random suffix |
| Photo zoom viewer | ✅ | ❌ | P2 | M | `react-native-image-zoom-viewer` | Web: `PhotoViewer.tsx` with 5x zoom, gallery nav, keyboard shortcuts |
| Image crop on upload | ✅ | ❌ | P2 | L | `expo-image-manipulator` | Web: `CropModal.tsx` with aspect ratios, zoom, rotation |
| HEIC conversion | ✅ | N/A | — | — | — | Web uses `heic2any`; mobile always uploads as JPEG via expo |
| Photo carousel thumbnails | ✅ | ❌ | P3 | S | `ScrollView` horizontal | Web pair detail has thumbnail strip below main image |
| Set cover photo | ✅ | ✅ | — | — | — | |
| Photo management (pair edit) | ✅ | ✅ | — | — | — | Web: inline edit mode; Mobile: PhotoManager component |

### Social / Posts

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Feed | ✅ | ✅ | — | — | — | |
| Create post | ✅ | ✅ | — | — | — | |
| Post detail + comments | ✅ | ✅ | — | — | — | |
| Like / unlike | ✅ | ✅ | — | — | — | |
| Save / bookmark | ✅ | ✅ | — | — | — | |
| Bookmarks page | ✅ | ✅ | — | — | — | |
| Report post UI | ✅ | ✅ | — | — | — | Web: Dialog; Mobile: Alert.alert |
| Zoom on post images | ✅ | ❌ | P2 | M | (same as Photo Zoom above) | Web: ZoomIn icon on PostCard; opens PhotoViewer |
| Pinned post on profile | ❌ | ✅ | P3 | S | — | Mobile renders `pinned_post_id`; web has the type but doesn't display |

### Collection / Pairs

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Collection list | ✅ | ✅ | — | — | — | |
| Add pair | ✅ | ✅ | — | — | — | |
| Pair detail | ✅ | ✅ | — | — | — | |
| Edit pair | ✅ | ✅ | — | — | — | |
| Wear counter | ✅ | ✅ | — | — | — | |
| Care Advisor | ✅ | ✅ | — | — | — | Both share same care logic |
| Care Log | ✅ | ✅ | — | — | — | |
| Resole Log | ✅ | ✅ | — | — | — | |
| Patina Timeline | ✅ | ✅ | — | — | — | |
| Wishlist | ✅ | ✅ | — | — | — | |

### BST (Buy/Sell/Trade)

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Browse listings | ✅ | ✅ | — | — | — | |
| Create listing | ✅ | ✅ | — | — | — | |
| Edit listing | ✅ | ✅ | — | — | — | |
| Listing detail | ✅ | ✅ | — | — | — | |
| Leave feedback | ✅ | ✅ | — | — | — | |
| Max images | 10 | 6 | P3 | S | — | Web allows 10; mobile caps at 6 |

### Messaging & Trades

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Inbox | ✅ | ✅ | — | — | — | |
| Conversations | ✅ | ✅ | — | — | — | |
| Real-time messages | ✅ | ✅ | — | — | — | Both use `postgres_changes` |
| Trade offers | ✅ | ✅ | — | — | — | |
| Tracking numbers | ✅ | ❌ | P2 | M | — | Web shows carrier + tracking # on listings; mobile doesn't |
| Shipping address reveal | ✅ | ❌ | P2 | S | — | Web reveals address during active trades; mobile doesn't |
| Unread message badge | ❌ | ✅ | P3 | S | — | Mobile has `unreadBadge.ts` pub/sub; web has no badge on nav |

### Profile

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| View/edit profile | ✅ | ✅ | — | — | — | |
| Avatar upload | ✅ | ✅ | — | — | — | |
| Follow system | ✅ | ✅ | — | — | — | |
| Public profiles | ✅ | ✅ | — | — | — | |
| Payment info fields | ✅ | ❌ | P1 | S | — | Venmo, CashApp, PayPal — stored in `payment_info` JSONB (column exists) |
| Shipping address fields | ✅ | ❌ | P1 | M | Manual fields first | Stored in `shipping_address` JSONB (column exists) |
| Google Places autocomplete | ✅ | ❌ | P2 | M | `react-native-google-places-autocomplete` | Only worth adding after shipping address fields exist |

### Notifications

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Notifications list | ✅ | ✅ | — | — | — | |
| Mark all read | ✅ | ✅ | — | — | — | |

### Admin / Moderation

| Feature | Web | Mobile | Priority | Size | Mobile Library | Notes |
|---------|-----|--------|----------|------|----------------|-------|
| Reports page | ✅ | ✅ | — | — | — | |
| Moderator management | ✅ | ✅ | — | — | — | |

---

## Data Consistency Issues

| Issue | Web | Mobile | Status |
|-------|-----|--------|--------|
| `Nick's` → `Nicks` rename | ✅ Fixed | 🔄 5 files need update | Fix in BST, Post, Wishlist brand arrays |
| Grenson in brand lists | ✅ All pickers | 🔄 BST screens missing | Add to BST create/edit/filter + post + wishlist |
| Tricker's in brand lists | ✅ All pickers | 🔄 BST screens missing | Same as above |
| AddPairScreen uses "Nick's Boots" | — | 🔄 Use "Nicks" | Full company name format, should match |

---

## Mobile Backport Queue (Priority Order)

### P0 — Critical Bug Fix
1. **Upload `Date.now()` collision** — `uploadImage.ts` line 30 — add random suffix (S)

### P1 — High Impact (Backend exists, just need UI)
2. **Brand list consistency** — Nick's → Nicks, add Grenson/Tricker's to all pickers (S)
3. **Payment info on profile edit** — add Venmo/CashApp/PayPal fields (S)
4. **Shipping address on profile edit** — add address fields, save to existing JSONB column (M)
5. **Forgot/reset password flow** — create screens, handle deep link redirect (M)
6. **Expand search to 5 types** — add pairs + brands queries, search display_name (M)

### P2 — Medium Impact (New features)
7. **Photo zoom viewer** — full-screen zoom on images across all detail screens (M)
8. **Brand database page** — copy brandDatabase.ts, build screen with category filters (M)
9. **Tracking numbers in messaging** — show/enter tracking in conversation when trade active (M)
10. **Shipping address reveal** — show address during active trades (S)
11. **Image crop on upload** — expo-image-manipulator + custom crop UI (L)

### P3 — Polish
12. **Photo carousel thumbnail strip** — horizontal scroll below main image (S)
13. **Verify email screen** — simple screen after signup (S)

---

## Web Backport Queue (from Mobile)

| Feature | Priority | Size | Notes |
|---------|----------|------|-------|
| Pinned post on profile page | P3 | S | Type exists, just need to render it |
| Unread message badge on nav | P3 | S | Add badge to messages nav item |

---

## Library Mapping (Web → Mobile Equivalents)

| Web Library | Mobile Equivalent | Purpose |
|-------------|-------------------|---------|
| `react-zoom-pan-pinch` | `react-native-image-zoom-viewer` | Photo zoom/pan |
| `react-easy-crop` | `expo-image-manipulator` + custom gesture UI | Image crop |
| Google Maps Places JS API | `react-native-google-places-autocomplete` | Address autocomplete |
| Canvas API (`cropImage.ts`) | `expo-image-manipulator` `manipulateAsync` | Programmatic image crop |
| `heic2any` | Not needed | Expo handles HEIC natively |

---

## Ongoing Sync Process

### Rules for Every Change

1. **Before starting work** — check this tracker for the feature's status on both platforms
2. **After completing work on either platform** — update this tracker:
   - Set status for the platform you changed
   - If the feature is new, add a row with the other platform marked ❌ and assign priority + complexity
   - Add mobile library suggestion if applicable
   - Update the "Last Updated" date at the top
3. **When fixing bugs** — check if the same bug exists on the other platform and note it in the "Data Consistency Issues" or relevant section

### New Entry Template

```markdown
| [Feature Name] | ✅ | ❌ | P[0-3] | [S/M/L] | [library or —] | [Notes + date added] |
```

### Quarterly Review Checklist
- [ ] Re-prioritize backport queue based on user feedback
- [ ] Check for library updates/deprecations in the mapping table
- [ ] Verify data consistency (brand lists, enums, etc.)
- [ ] Review any new features added since last review
