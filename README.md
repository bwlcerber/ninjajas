# NinjaPromo Sales Portal

> Internal sales enablement portal — authorized personnel only.  
> Built as a production-ready frontend SPA. No build step required.

---

## Quick Start

Open `index.html` in any modern browser.  
**Demo credentials: `admin` / `admin`**

No server required. All data runs in-browser via localStorage.

---

## ⚠️ Authentication — REPLACE BEFORE PRODUCTION

The current login uses hardcoded demo credentials defined in [`js/auth.js`](js/auth.js):

```js
// ⚠️ DEMO — REMOVE BEFORE PRODUCTION
const DEMO_USERNAME = 'admin';
const DEMO_PASSWORD = 'admin';
```

### To upgrade to real authentication:

1. **Replace `AUTH.login()`** with an API call:
   ```js
   async function login(username, password) {
     const res = await fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ username, password }),
       credentials: 'include' // for httpOnly cookies
     });
     const data = await res.json();
     return data.success
       ? { success: true, session: data.session }
       : { success: false, error: data.error };
   }
   ```

2. **Replace `sessionStorage`** with JWT or httpOnly cookie handling.

3. **Add backend middleware** to validate the token on every protected API call.

4. **Add rate limiting** on the `/api/auth/login` endpoint.

5. **Remove the demo credentials hint** from `index.html`.

---

## Content Model

Three content types share a unified schema and are all searchable globally.

### 1. Material
The core content record. Used in Reports, Creatives, Docs, Cases.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated (`mat-001`, etc.) |
| `title` | string | Required |
| `client_name` | string | Company name or "Internal" |
| `geo` | string | US, EU, UK, Global, etc. |
| `vertical` | string | FinTech, Web3, Trading, eCommerce, Healthcare, iGaming, Sports Betting, SaaS, Other |
| `services_provided` | string[] | SEO, PPC, PR, Social Media, etc. |
| `asset_type` | string | report, creative, case, deck, template, contract, process-doc, media-plan, training, video, image, pdf, spreadsheet-link, doc-link |
| `visibility_status` | string | `internal-only` or `client-safe` |
| `description` | string | Short description |
| `file_type` | string | pdf, image, video, doc-link, spreadsheet-link |
| `file_url` | string | URL to the file or external link |
| `thumbnail_url` | string | Optional preview image |
| `tags` | string[] | Lowercase, kebab-case |
| `related_assets` | string[] | Array of Material IDs |
| `created_at` | string | YYYY-MM-DD |

### 2. ClientReference
Lightweight external website cards shown in the Client References section.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `client_name` | string | Required |
| `website_url` | string | External site URL |
| `geo` | string | |
| `vertical` | string | |
| `ai_summary` | string | 1–2 sentences max. Keep consistent length. |
| `services_provided` | string[] | |
| `thumbnail_url` | string | Optional screenshot or image |

### 3. ClientMiniProfile
Internal-only context card for sales storytelling.

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Auto-generated |
| `client_name` | string | Required |
| `geo` | string | |
| `product_summary` | string | Context note for sales reps — company size, product, market position |
| `services_provided` | string[] | |
| `related_assets` | string[] | Array of Material IDs — enables "Open All in Tabs" |
| `website_url` | string | Optional |

---

## File Handling

| File Type | Behavior |
|-----------|----------|
| `image` | Previewed inside a modal within the portal |
| `video` | Autoplay-on-hover in Creatives; full player in modal |
| `pdf` | Opens in new tab |
| `doc-link` | Opens Google Doc in new tab |
| `spreadsheet-link` | Opens Google Sheet in new tab |

The portal **stays open in the background** while external links open in new tabs.  
Use the "Open All in Tabs" feature to pre-load multiple assets before a call.

---

## How to Add Content in Real Use

### Option A: Admin Panel (in-app)
1. Sign in and navigate to **Admin** (re-enter password)
2. Select the tab: Materials, Client References, or Mini Profiles
3. Fill in the form and click Save
4. Content is persisted to `localStorage` and immediately searchable

> In production: the save action should POST to your backend API instead of localStorage.

### Option B: Edit seed data directly
Add records to [`js/data.js`](js/data.js) in the `SEED_MATERIALS`, `SEED_CLIENT_REFS`, or `SEED_CLIENT_PROFILES` arrays.  
These load on every page refresh and cannot be deleted from the UI (only tombstoned).

---

## Architecture

```
ninjajas/
├── index.html          ← Login page (auth gate)
├── app.html            ← Main SPA shell (all pages rendered here)
├── css/
│   ├── base.css        ← Design tokens, typography, reset
│   ├── layout.css      ← Sidebar, topbar, page shell
│   ├── components.css  ← Cards, buttons, badges, modals, inputs
│   └── pages.css       ← Per-section page styles
├── js/
│   ├── data.js         ← Seed data (30 materials, 12 refs, 8 profiles)
│   ├── auth.js         ← Login / session / admin unlock
│   ├── store.js        ← Unified content store (seed + localStorage merge)
│   ├── utils.js        ← Icons, toast, modal, clipboard, renderers
│   ├── router.js       ← Hash-based SPA routing (#dashboard, #reports…)
│   └── pages/
│       ├── dashboard.js
│       ├── search.js
│       ├── reports.js
│       ├── creatives.js
│       ├── docs.js
│       ├── cases.js
│       ├── clientrefs.js
│       ├── miniprofiles.js
│       └── admin.js
└── README.md
```

### Navigation routes

| Hash | Page |
|------|------|
| `#dashboard` | Overview dashboard |
| `#search` | Global search |
| `#reports` | Reports & media plans |
| `#creatives` | Creative gallery by vertical |
| `#docs` | Documents & process docs |
| `#cases` | Case studies |
| `#clientrefs` | Client reference sites |
| `#miniprofiles` | Client mini profiles |
| `#miniprofiles/profile-001` | Direct profile detail view |
| `#admin` | Admin panel |

---

## Production Upgrade Checklist

- [ ] Replace `AUTH.login()` with a real API call
- [ ] Remove hardcoded demo credentials from `auth.js`
- [ ] Remove demo credentials hint from `index.html`
- [ ] Replace localStorage persistence with backend API calls in `store.js`
- [ ] Add proper HTTPS, CORS, and CSP headers
- [ ] Add rate limiting on login endpoint
- [ ] Consider role-based access if needed beyond single shared login
- [ ] Serve from a private URL / VPN-protected host
- [ ] Add real thumbnail screenshots (use a service like Screenshotlayer or Urlbox)

---

## Design System

Inspired by [sola.framer.media](https://sola.framer.media/) and NinjaPromo's brand.

| Token | Value |
|-------|-------|
| Background | `#060608` |
| Surface | `#111116`, `#17171d` |
| Accent green | `#3de892` |
| Text primary | `#f0f0f2` |
| Text secondary | `#8a8a9a` |
| Font UI | Inter |
| Font mono | Geist Mono |

---

*Internal use only. Do not distribute or share access credentials.*
