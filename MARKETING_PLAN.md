# GetWelted — Reddit Cross-Post & Growth Marketing Plan

## Overview

Enable GetWelted users to cross-post their boot photos to Reddit communities seamlessly, driving organic discovery of getwelted.com through watermarked images posted from real user accounts.

---

## Phase 1: MVP — OAuth Connect + Basic Cross-Post

### 1.1 Connect Reddit Account (One-Time Setup)

**Location:** Profile Settings → "Connected Accounts" section

1. User taps **"Connect Reddit"** button
2. Redirected to Reddit OAuth consent screen — authorize GetWelted to post on their behalf
3. User clicks **"Allow"** on Reddit
4. Redirected back to GetWelted — store OAuth tokens (access + refresh) in Supabase
5. Reddit username shows as connected with green checkmark

**OAuth Scopes:** `submit` (post content), `identity` (get username) — minimal permissions only.

### 1.2 Cross-Post Flow

When creating a new post on GetWelted:

1. User fills out normal post form (image, caption, brand, model, leather, etc.)
2. If Reddit is connected, below the form they see:
   - **Toggle:** "Share to Reddit" (off by default)
   - **Auto-suggested subreddits** based on selected brand
   - **Preview** of watermarked image — their photo with subtle `getwelted.com` in the corner
   - **Reddit title** auto-generated from brand/model/leather (editable)
3. User hits **"Post"**
4. GetWelted creates the local post first, then:
   - Watermarks image server-side (Sharp on Edge Function or API route)
   - Uploads watermarked image to Reddit via user's OAuth token as native image post
   - No URL, no link post — just a photo with their title from their real account
5. Confirmation: "Posted to GetWelted + shared to r/goodyearwelt"

### 1.3 Brand → Subreddit Mapping

| Brand | Suggested Subreddits |
|-------|---------------------|
| Red Wing | r/RedWingShoes, r/goodyearwelt |
| Viberg | r/goodyearwelt |
| Nicks | r/NicksBoots, r/goodyearwelt |
| Grant Stone | r/GrantStone, r/goodyearwelt |
| White's | r/goodyearwelt |
| Wesco | r/goodyearwelt |
| Alden | r/goodyearwelt |
| Thorogood | r/goodyearwelt, r/Boots |
| Truman | r/goodyearwelt |
| Parkhurst | r/goodyearwelt |
| John Lofgren | r/goodyearwelt |
| Role Club / Clinch | r/goodyearwelt |
| Crockett & Jones | r/goodyearwelt |
| Edward Green | r/goodyearwelt |
| Carmina | r/goodyearwelt |
| Russell Moccasin | r/goodyearwelt |
| Any boot | r/Boots, r/BuyItForLife |

### 1.4 Reddit Rate Limits & Guardrails

- **API rate limit:** 100 requests/minute with OAuth
- **Per-account:** Max 1 post per subreddit per 24 hours
- **Cooldown indicator:** If already shared to a subreddit today, option grayed out — "Available in 18h"
- **Token refresh:** Reddit tokens expire after 1 hour — use refresh token silently
- **Disconnect:** User can revoke Reddit access anytime from Profile Settings
- **New accounts:** Reddit requires minimum karma + account age for some subreddits — show warning if post fails

### 1.5 What Reddit Sees

- Normal image post from a real user account (not a bot)
- Title: `Viberg Service Boot — Shinki Horsehide` (looks like normal enthusiast post)
- Image: boot photo with small `getwelted.com` watermark in bottom corner
- No links, no self-promotion text — just a great boot photo
- People who notice watermark type `getwelted.com` → organic discovery

### 1.6 Architecture

```
User's device
  → GetWelted post form (toggle "Share to Reddit")
  → GetWelted API route / Edge Function
    → Watermark image (Sharp)
    → Upload to Reddit via user's OAuth token
    → Save cross-post record in Supabase (tracking)
  → Reddit sees: native image post from real user
```

---

## Phase 2: Quality of Life

### 2.1 "Auto-Share" Default Per Brand

Instead of toggling every time, let users set a preference:
- "Always share Red Wing posts to r/RedWingShoes"
- One-time setup, then every post auto-shares unless unchecked
- Removes friction on repeat posts

### 2.2 Smart Timing

Reddit posts perform better at certain times:
- Queue the Reddit post for optimal time (weekday mornings EST for r/goodyearwelt)
- Post to GetWelted immediately, schedule the Reddit share
- Show "Will post to Reddit at 9am EST for best visibility"

### 2.3 Caption Adaptation

Auto-generate Reddit-friendly title from GetWelted caption:
- GetWelted caption: "Finally broke these in after 6 months"
- Reddit title: "Viberg Service Boot in Shinki Horsehide — 6 months of wear"
- User can edit before posting — auto-suggestion saves writing two things

### 2.4 Flair Auto-Selection

Many subreddits require post flair:
- r/goodyearwelt uses "WSAYWT", "First Impressions", "Review", etc.
- Fetch available flairs via Reddit API
- Auto-suggest based on context (new pair → "First Impressions", daily wear → "WSAYWT")
- Prevents posts from being removed for missing flair

---

## Phase 3: Growth Loop

### 3.1 Post Performance Tracking

After sharing, show stats in GetWelted profile:
- "Your Viberg post on r/goodyearwelt got 47 upvotes"
- Pull via Reddit API using stored post ID
- Gives users a reason to keep cross-posting — dopamine loop

### 3.2 Community Highlights Feed

Track which GetWelted posts get the most Reddit upvotes:
- "Trending on Reddit" section on GetWelted home feed
- Badges: "This post got 100+ upvotes on Reddit"
- Creates social proof and motivates others to cross-post

### 3.3 Referral Tracking

- Optional tiny QR code in watermark corner → links to `getwelted.com/r/[post-id]`
- Tracks which Reddit posts drive sign-ups
- Very small / subtle — doesn't feel spammy
- Standard watermark remains `getwelted.com` text

---

## Phase 4: Expansion

### 4.1 Reddit Import (Reverse Flow)

Users already post boot photos to Reddit. Let them:
- Paste a Reddit post URL into GetWelted
- Auto-import the image and pull brand/model from title
- Saves re-uploading — lowers barrier to populating their collection
- "Already posted this to Reddit? Import it to your GetWelted collection"

**This may be the most powerful early growth feature** — gives existing Reddit boot enthusiasts a reason to sign up without changing their habits.

### 4.2 Multi-Platform Cross-Post

Same pattern extends to:
- **Discord servers** (via webhooks — easiest, no OAuth needed)
  - r/goodyearwelt Discord
  - Brand-specific Discords
- **Instagram** (via API — more restricted)
- **Styleforum** (if API or email-based posting available)

### 4.3 Watermark Variants

Rotate subtle watermark styles (user picks preference in settings):
- `getwelted.com` (standard)
- `Shared from GetWelted` (more human)
- Small GetWelted logo mark (recognizable once brand is established)

---

## Target Reddit Communities

### Tier 1 — Primary (High Traffic, Boot-Focused)
| Subreddit | Subscribers | Focus |
|-----------|------------|-------|
| r/goodyearwelt | ~250K+ | Heritage footwear, reviews, WSAYWT |
| r/RedWingShoes | ~50K+ | Red Wing specific |
| r/BuyItForLife | ~1.4M+ | Durable goods (boots are popular) |
| r/malefashionadvice | ~2.2M+ | General fashion, boot recommendations |
| r/Boots | ~30K+ | All boots |

### Tier 2 — Brand-Specific
| Subreddit | Focus |
|-----------|-------|
| r/NicksBoots | Nicks Handmade Boots |
| r/GrantStone | Grant Stone |
| r/ThursdayBoot | Thursday (adjacent market) |
| r/AllenEdmonds | Allen Edmonds (adjacent market) |

### Tier 3 — Adjacent Communities
| Community | Platform | Focus |
|-----------|----------|-------|
| r/frugalmalefashion | Reddit | Deals (BST listings could be relevant) |
| r/rawdenim | Reddit | Crossover audience with heritage boots |
| r/Leathercraft | Reddit | Leather enthusiasts |
| r/EDC | Reddit | Everyday carry, lifestyle overlap |
| Styleforum | Forum | Heritage menswear deep community |
| Stitchdown | Website | Boot reviews and news |

---

## Implementation Priority

1. **Phase 1** — OAuth connect + basic cross-post with watermark (MVP)
2. **Phase 2** — Smart timing + flair auto-selection + caption adaptation
3. **Phase 3** — Performance tracking + community highlights
4. **Phase 4** — Reddit import + multi-platform expansion

**Recommended first build:** Phase 1 + Reddit Import from Phase 4 (the import gives existing Reddit users immediate value without waiting for the full cross-post flow).

---

## Technical Requirements

- Reddit OAuth app registration (reddit.com/prefs/apps)
- Supabase table: `connected_accounts` (user_id, platform, access_token, refresh_token, platform_username, expires_at)
- Supabase table: `cross_posts` (post_id, platform, platform_post_id, subreddit, status, upvotes, created_at)
- Image watermarking: Sharp library (server-side)
- Reddit API client: snoowrap or raw fetch with OAuth bearer token
- Scheduled jobs for smart timing: Supabase Edge Functions with pg_cron or Vercel Cron
