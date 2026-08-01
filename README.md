# The Black Genius Files — companion site

Pure static site for the [@theblackgeniusfiles](https://www.youtube.com/@theblackgeniusfiles)
YouTube channel (E.A.T. Media): a hero that pulls the newest long-form video
live from YouTube, a searchable episode archive with a Shorts rail, a
historical timeline, 20 biographical dossiers, a daily cipher game and a
10-question trivia quiz (both gamified with streaks and clearance ranks), a
"declassify the field memo" progression mechanic, book promo, and a
newsletter sign-up. No build step, no backend — ready for GitHub Pages.

Compiled by hand from the Claude Design prototype in
[`design_handoff_black_genius_files/`](../../design_handoff_black_genius_files)
of the source repo (see that bundle's `README.md` for the full behavior spec).
The `.dc.html` design file and its `support.js` prototyping-tool runtime are
**not** shipped here — this is hand-authored, production HTML/CSS/JS.

## Files

| Path | Purpose |
|---|---|
| `index.html` | The whole site — one page, all sections, anchors kept stable (`#files`, `#timeline`, `#book`, `#dossiers`, `#trials`, `#evidence`, `#subscribe`, …) |
| `assets/data.js` | Content: episodes seed list, the 20 genius dossiers, timeline, trivia pool, daily ciphers, book chapters, declassified facts. Edit content here. |
| `assets/app.js` | Behavior: sync, search/filter, quizzes, modals, persistence, sharing, printing. **Config block at the very top of the file** — edit that, not the code below it. |
| `assets/` (images) | Dossier portraits, author headshot, book covers, OG card. |

## Config

Everything launch-specific lives in the `window.BGF_CONFIG` block at the top
of [`assets/app.js`](assets/app.js):

| Key | Status |
|---|---|
| `youtubeApiKey` | ✅ Restricted in Google Cloud Console to this site's origin (HTTP referrer restriction). Still visible client-side (unavoidable for a static site calling a browser-facing API), but it can't be used from anywhere except this domain. If the site moves to a new domain, add that origin to the key's restrictions too. Leave blank to fall back to the no-key RSS sync path automatically. |
| `liveSync` | `true` — polls YouTube every 10 min + on tab refocus |
| `showCountdown` | `true` — the "next file in…" widget under the hero |
| `bookStatus` | `"available"` — the book is purchasable now (Payhip + Amazon), matching the official site |
| `bookUrl` | Points at the official *What History Buried* site (`site/` in the main `ImaginariumOzone` repo), which has the full buy flow (Payhip/Amazon), free chapter, and evidence room |
| `geniusIndexUrl` | Cross-promo link to *The Genius Index* book site |
| `chapterOneFormAction` | The **same live Kit (ConvertKit) form** the official book site uses for "Read Chapter 1 Free" — one shared Recovery List, one incentive email. The "Send Chapter 1" form here does a real (non-fetch) POST to it, exactly like `site/assets/whb.js`'s `subscribe()`, so Kit's configured success redirect lands the reader on the book site's `check-your-email.html` — this is an intentional cross-link back to that site, not a bug. |
| `discordUrl` / `patreonUrl` | Empty = the Reading Room shows "DOOR SEALED — OPENING SOON" (real state, not a missing link — set these once the Discord/Patreon exist) |
| `newsletterAction` | Empty = the *Inner Circle* signup form (bottom of page, a separate list from the Chapter 1 capture) is front-end only (no POST) until a real endpoint is set |

## Sync & fallback chain

YouTube Data API (needs `youtubeApiKey`) → cached `localStorage` episodes →
RSS via public CORS proxies (no key) → the hardcoded launch slate in
`assets/data.js`. A small status label near the archive (`#ep-syncnote`)
always shows which source is live.

## Progression system (exact thresholds, don't approximate)

- **Clearance** — 16 "redacted" fragments scattered across the page
  (`[data-frag]`), tap to declassify. 0–3 INITIATE · 4–7 READER · 8–11 KEEPER
  · 12–15 ARCHIVIST · 16/16 CUSTODIAN OF THE RECORD. Unlocks: Codex symbol
  Nº 12 at KEEPER, Trial Nº 11 (bonus question) at ARCHIVIST, the Sealed
  Letter section at CUSTODIAN.
- **File Nº 021** (Season Two teaser) unlocks when ANY of: Clearance ≥
  ARCHIVIST, Trials best streak ≥ 8, or Cipher streak ≥ 5.
- **Genius Trials** — 10 random questions per run, scored as a percentage;
  best streak persists across visits.
- **Codex cipher** — one symbol a day, date-seeded so every visitor sees the
  same daily cipher; streak breaks if a day is missed.

All of this persists in `localStorage` (`bgf_frags`, `bgf_best`,
`bgf_cipher`, `bgf_sound`, `bgf_hero`, `bgf_durations`, `bgf_seen`,
`bgf_episodes`) — no account, no backend.

## Deploy

Static GitHub Pages from this repo's root (`index.html` + `assets/`). No
`CNAME` is committed yet — `theblackgeniusfiles.com` / `blackgeniusfiles.com`
appears in on-page copy as the intended eventual domain, but canonical/OG
URLs in `index.html` point at the current live Pages URL,
`https://dixon8303.github.io/black-genius-files/`, until DNS is actually
pointed at this repo. When the domain is ready: add a `CNAME` file, then
update the canonical/OG/JSON-LD URLs in `index.html` to match.
