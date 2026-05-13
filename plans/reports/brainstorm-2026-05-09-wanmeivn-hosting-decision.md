# Brainstorm — Hosting `wanmeivn.com`: VPS .13 vs VPS .40

**Date:** 2026-05-09
**Status:** Decision needed (blocked on selection)
**Domain:** `wanmeivn.com` (registered, DNS managed via dnspro.vn)
**Site to deploy:** Local mirror of `games.wanmei.com` homepage (Stage 1, ~8 MB static files in `mirror/`)
**Audience:** Private — internal testers only. Branding/content will be replaced before any public launch.

---

## TL;DR

We have two VPSes in the same datacenter. Only one has the project files; the other already has a working web server and the domain pointing at it. We can't yet talk to both. **Three viable paths exist; pick one.**

| | Path A — Move domain to .40 | Path B — Add subdomain on .40 | Path C — Find SSH for .13, deploy there |
|---|---|---|---|
| Risk to existing .13 site | Goes offline | None | Low (we'd add a subdomain block) |
| New credentials needed | None (have DNS panel) | None (have DNS panel) | SSH user/host/key for .13 |
| Time to live | ~15 min | ~15 min | Depends on locating SSH creds |
| Recommended? | Only if .13 site is disposable | **Yes — safest, fastest** | Only if .13 must hold the root domain |

**Recommendation: Path B.** Cleanest, no risk to .13, no waiting on credentials.

> 🇻🇳 Vietnamese version: see `brainstorm-2026-05-09-wanmeivn-hosting-decision-vi.md` in this same folder.

---

## Context

User has one domain (`wanmeivn.com`) and two Vietnamese VPSes:

```
                                wanmeivn.com (DNS at dnspro.vn)
                                          │
                          ┌───────────────┴───────────────┐
                          │                               │
                          ▼                               ▼
                  VPS 160.191.3.13                VPS 160.191.3.40
                  (the "public" box)              (the "dev" box, this one)
                  Linux, runs Caddy               Windows Server 2019
                  Ports 22/80/443 open            Port 3000 only
                  HTTP→HTTPS redirect live        npx serve running here
                  DNS root @ points here          Project source lives here
                  No SSH credentials known        Full admin access
                  Currently serves something      No web server installed
```

Key probe results from .40 (this box) targeting .13:
- Ping: < 1 ms (same datacenter)
- Port 22 (SSH): open, no creds available to us
- Port 80: returns `308 → https://wanmeivn.com/` with `Server: Caddy`
- Port 443: open, valid HTTPS responding (handshake succeeds from real browsers)

**Conclusion:** .13 has been pre-configured by someone — probably hosting provider or earlier setup — but the SSH password/key was not retained.

---

## Current State Snapshot

| Item | State |
|---|---|
| Project files (`mirror/`) | On .40 only |
| Public web server | Running on .13 only |
| TLS certificate for `wanmeivn.com` | Already on .13 (auto-issued by Caddy) |
| DNS A `@` (`wanmeivn.com`) | → 160.191.3.13 |
| DNS A `tieu3q` | → 160.191.3.13 |
| Web reachable on .40 | No (only `:3000` is bound, not exposed publicly without firewall change) |
| dnspro.vn DNS panel access | We have credentials |
| .13 SSH access | None |
| .40 admin access | Yes |

---

## The Three Paths in Detail

### Path A — Move the root domain to .40

**What happens:**
1. Log into dnspro.vn, change A record `@`: `160.191.3.13 → 160.191.3.40`.
2. Install Caddy on .40 (single-binary, native Windows build).
3. Open Windows firewall ports 80 + 443 inbound.
4. Caddyfile points at `C:\web\web1\webgame\Webgame-main\mirror\`.
5. Caddy auto-issues Let's Encrypt cert for `wanmeivn.com` once DNS propagates.

**Pros:**
- Single VPS (.40) holds everything: source + live site.
- No reliance on .13 we can't fully control.
- Future updates: just rsync/copy into `mirror/`, no DNS changes.

**Cons:**
- Whatever .13 currently serves at `wanmeivn.com` **goes offline immediately** at DNS propagation. If that's a forgotten production thing, this is a footgun.
- DNS propagation can take 15 min to 1 h on TTL 3600.
- HTTPS won't work for ~5 min after switch (Caddy needs DNS-validated ACME challenge).

**When to pick:** boss confirms .13's current content is throwaway / a placeholder.

---

### Path B — Subdomain on .40, leave .13 alone (recommended)

**What happens:**
1. Log into dnspro.vn, **add** new A record (e.g.): `homepage` → `160.191.3.40`. Root `@` and `tieu3q` unchanged.
2. Install Caddy on .40.
3. Open Windows firewall ports 80 + 443 inbound on .40.
4. Caddy serves `homepage.wanmeivn.com` from `mirror/`.
5. Caddy auto-issues Let's Encrypt cert for `homepage.wanmeivn.com`.

**Pros:**
- **Zero risk** to whatever runs on .13.
- Uses only the credentials we already have (DNS panel + .40 admin).
- Reversible: delete the subdomain record any time.
- Coexists with future plans for the root domain.

**Cons:**
- Two boxes in play long-term — the team needs to remember .13 is independent.
- Site lives at a subdomain (e.g. `https://homepage.wanmeivn.com`), not the bare domain. Cosmetic.

**When to pick:** default. This is the lowest-risk option that uses only what we have.

---

### Path C — Get SSH for .13, deploy there

**What happens:**
1. User locates SSH credentials for 160.191.3.13 (provider panel, password manager, original setup notes).
2. From .40, SSH into .13.
3. Inspect existing Caddyfile and what's currently served at `wanmeivn.com`.
4. Add a new server block (likely a subdomain) pointing at a new directory.
5. `scp` or `rsync` `mirror/` from .40 → .13.
6. Reload Caddy.

**Pros:**
- Site lives where the domain already terminates — no DNS changes, no new cert provisioning.
- Existing TLS infra reused.

**Cons:**
- **Blocked on credentials we don't currently have.** Could be 5 minutes (creds in a password manager) or indefinite (if nobody remembers).
- Risk of breaking the existing .13 setup if Caddyfile is edited carelessly.
- Requires us to learn what's on .13 before we touch it.

**When to pick:** boss insists the site must live on .13, AND can produce SSH credentials.

---

## Risk Comparison

| Risk | Path A | Path B | Path C |
|---|---|---|---|
| Existing .13 site goes down | High (immediate) | None | Low (if careful) |
| Cert provisioning fails on first try | Medium | Medium | None (cert exists) |
| DNS propagation delay impacts users | Yes (~15 min–1 h) | Yes (~15 min–1 h, but new subdomain only) | No |
| Blocked on missing credentials | None | None | High |
| Future dev workflow complexity | Low (one box) | Low–medium (two boxes) | Medium (push from .40 to .13) |

---

## Cost

All three paths: **$0 incremental.** Both VPSes already exist. Caddy and Let's Encrypt are free. No CDN/cloud spend.

---

## Decision Required

Boss to choose one of:

1. **Path B (Recommended).** Proceed with subdomain on .40. No risk, fastest path with current credentials. Pick a subdomain name: `homepage` / `test` / `demo` / `staging` / other.
2. **Path A.** Move root domain to .40. Boss must confirm: *"the current site on .13 at wanmeivn.com is disposable and may go offline."*
3. **Path C.** Hold deployment until SSH credentials for .13 are produced. Boss to provide ETA and creds source.

If **Path B** chosen, also confirm:
- Subdomain name (default suggestion: `homepage.wanmeivn.com`).
- OK to install Caddy on the .40 Windows VPS as a service.
- OK to open Windows Firewall inbound ports 80 + 443.

---

## Open Questions

1. What is currently served at `https://wanmeivn.com/` on .13? (Cannot determine without SSH or a browser visit by someone with TLS-trust working — local Windows TLS handshake is broken from this box.)
2. Who set up Caddy on .13 originally? They likely have the SSH credentials.
3. Is there a longer-term plan for `wanmeivn.com` (real launch, rebrand, etc.) that might affect which box we centralize on?
4. Any compliance/legal review needed before public DNS resolves a Wanmei-cloned homepage to a Vietnam-themed name? (Flagged earlier; user stated rebrand will happen pre-launch.)

---

## Appendix — How to verify after deployment (any path)

```
# DNS resolves to expected IP
nslookup <hostname-chosen>

# HTTPS reachable, valid cert
curl -I https://<hostname-chosen>/

# Homepage loads with assets (no 404s in network tab)
# Open https://<hostname-chosen>/ in browser, check devtools Network tab
```

Success = HTTP 200 on root, all CSS/images return 200, page renders identical to the local mirror at `http://localhost:3000`.
