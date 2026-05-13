---
type: handoff
date: 2026-05-09
from: SGJTH5 game ops (VPS 160.191.3.13 / `backup-vps`)
to: web team (VPS 160.191.3.40 / `winvps`)
subject: wanmeivn.com apex moves to your VPS — game subdomain stays on ours
status: ready for handoff
---

# Handoff: `wanmeivn.com` apex deployment on VPS `160.191.3.40`

## TL;DR

- **You own:** `wanmeivn.com` + `www.wanmeivn.com` (apex website). Build & deploy on `160.191.3.40` (winvps).
- **We own:** `tieu3q.wanmeivn.com` (SGJTH5 game). Stays on `160.191.3.13`. **Do not touch.**
- **Required:** DNS A-record changes at the registrar (only apex + www move). No game-side config change needed.

## Current state (verified 2026-05-09)

### VPS `160.191.3.13` (ours, Linux, Caddy in Docker)

Caddy `deploy/Caddyfile` has blocks **only** for:
- `sgjth5.duckdns.org` — duckdns game route
- `tieu3q.wanmeivn.com` — wanmei game route

**No `wanmeivn.com` apex block exists.** Apex traffic currently arriving at `.13` is dropped to default 404. Nothing useful is being served from `.13` on the apex hostname.

### DNS today (registrar — needs update)

```
@         A   160.191.3.13     ← move to .40
www       A   160.191.3.13     ← move to .40 (if record exists; create if not)
tieu3q    A   160.191.3.13     ← KEEP (do not change)
```

The apex `@` record was added earlier but never had a backing handler. Moving it costs us nothing.

## Target state

```
@         A   160.191.3.40     ← winvps serves apex website
www       A   160.191.3.40     ← winvps (recommended: same site or 301 → apex)
tieu3q    A   160.191.3.13     ← unchanged, game continues
```

## Action plan

### Phase 1 — winvps team (you)
1. Stand up your webserver on `160.191.3.40` (IIS / Caddy-for-Windows / nginx — your call).
2. Open inbound `:80` and `:443` on Windows firewall + any cloud firewall.
3. Configure vhost(s) for both `wanmeivn.com` and `www.wanmeivn.com`.
4. Issue TLS certs:
   - Easiest: HTTP-01 via Let's Encrypt. **Requires DNS to already point at `.40`** for the issuance challenge → do step 5 first, then issue.
   - Alternative: DNS-01 challenge if you have registrar API access — can issue before DNS flip.
5. Coordinate with us on DNS flip timing (see Phase 2). Recommended order:
   - Bring up the site on `.40` listening on `:80` (no TLS yet) but reachable by IP.
   - Flip DNS.
   - Once propagation hits (~5–60 min), trigger HTTP-01 cert issuance.
   - Force HTTPS / add HSTS only after cert is live and verified.

### Phase 2 — DNS flip (registrar admin — ops/owner)
Update at registrar:
- `@` A → `160.191.3.40`
- `www` A → `160.191.3.40` (create if missing)
- **Leave `tieu3q` A pointing to `160.191.3.13` untouched.**

TTL: drop to 300s a few hours before flip if possible, restore afterward.

### Phase 3 — game team (us, post-flip smoke test)
- Resolve: `dig +short tieu3q.wanmeivn.com` → must still return `160.191.3.13`.
- Browser test: `https://tieu3q.wanmeivn.com` login + WS handshake.
- Caddy logs on `.13` for `tieu3q` should still show normal traffic.

## Why there is no conflict

- TLS routing on `.13` Caddy uses SNI; `tieu3q.wanmeivn.com` and `wanmeivn.com` are distinct hostnames. Cert for one does not affect the other.
- The `Strict-Transport-Security` header with `includeSubDomains` set on `tieu3q.wanmeivn.com` applies to `*.tieu3q.wanmeivn.com` only — **not to apex**. Browsers will not force HTTPS on `wanmeivn.com` because of `tieu3q`'s HSTS.
- Caddy on `.13` has never attempted to issue an apex cert (no block). No Let's Encrypt rate-limit history is carried over, so you (winvps) get a clean issuance path.

## Pitfalls / gotchas

- **HSTS preload (apex):** if you intend to enable HSTS on apex with `includeSubDomains`, coordinate first — that header WOULD cascade down to `tieu3q.wanmeivn.com` and force HTTPS for it. Game's tieu3q is already HTTPS so likely fine, but be aware.
- **CAA records:** if the domain has a CAA record at apex restricting issuers, it applies to subdomains too. Ensure Let's Encrypt is allowed for both `.40`'s issuer and the existing `tieu3q` cert renewal on `.13`.
- **www behavior:** decide upfront — serve same content, or 301 to apex. Either is fine; just be consistent.
- **Email / MX:** if MX records exist for `wanmeivn.com`, they are independent of A records — don't touch them unless you are also moving mail.
- **No port collision possible:** `.40` and `.13` are separate hosts, so apex `:443` on `.40` and tieu3q `:443` on `.13` coexist trivially.

## What stays unchanged on our side

- `deploy/Caddyfile` on `.13` — no edits.
- DNS for `tieu3q` — no edits.
- Game containers (login, game, web, php, db) — no edits.

## Verification commands (run after DNS flip propagates)

```bash
# DNS sanity
dig +short wanmeivn.com           # expect 160.191.3.40
dig +short www.wanmeivn.com       # expect 160.191.3.40
dig +short tieu3q.wanmeivn.com    # expect 160.191.3.13  (UNCHANGED)

# TLS sanity
curl -sI https://wanmeivn.com | head -5
curl -sI https://tieu3q.wanmeivn.com | head -5
```

## Contact / escalation

- Game-side issues (`tieu3q.wanmeivn.com` breaks): contact SGJTH5 ops; ssh `backup-vps`.
- Apex/website issues: web team owns; ssh `winvps` (Administrator).

## Open questions for web team

- [ ] Does `wanmeivn.com` apex need to host any path that proxies into the game (e.g. `/play`, `/download`, OAuth callbacks)? If yes, list them — we may need a CORS or redirect coordination.
- [ ] Will you enable HSTS preload at apex with `includeSubDomains`? (Affects `tieu3q` indirectly.)
- [ ] Confirm `www` policy: serve same content vs. 301 to apex.
