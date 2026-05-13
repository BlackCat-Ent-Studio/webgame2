# Brainstorm — `wanmeivn.com` Apex Deployment on VPS .40

**Date:** 2026-05-09
**Status:** Brainstorm — pending approval before plan
**Context source:** Boss directive + `docs/handoff-260509-0308-wanmeivn-apex-to-vps40.md` (game ops handoff)
**Target VPS:** `160.191.3.40` (winvps, Windows Server 2019)

> 🇻🇳 Vietnamese version: `brainstorm-2026-05-09-wanmeivn-apex-deploy-vi.md`

---

## Goal

Serve `wanmeivn.com` + `www.wanmeivn.com` (apex website, currently the local homepage mirror) from VPS `160.191.3.40`, with valid HTTPS, **without impacting** the SGJTH5 game running at `tieu3q.wanmeivn.com` on VPS `160.191.3.13`.

Architecture pattern (per boss): **apex/website on .40; each game on its own VPS**, exposed via its own subdomain.

---

## What is already decided (locked — do not re-debate)

These come from the boss + handoff doc, treat as constraints:

| # | Decision | Source |
|---|---|---|
| 1 | Apex `wanmeivn.com` and `www.wanmeivn.com` are deployed on **VPS .40**. | Boss |
| 2 | `tieu3q.wanmeivn.com` stays on VPS .13. **Do not touch.** | Handoff doc, boss |
| 3 | Each game (current SGJTH5, future titles) runs on its own server. | Boss |
| 4 | DNS changes affect only `@` and `www`. `tieu3q` A record is untouched. | Handoff doc |
| 5 | Phase order: stand up site on .40 → flip DNS → issue cert → harden. | Handoff doc |
| 6 | Game team coordinates DNS flip timing. Post-flip smoke test on their side. | Handoff doc |
| 7 | **Apex has NO paths proxying into the game.** Pages are fully independent. | Boss directive 2026-05-09 |
| 8 | **HSTS at apex must NOT use `includeSubDomains`** — would violate separation. | Boss directive 2026-05-09 (implied by "keep everything separate") |
| 9 | **No premature integration design.** Future cross-page features deferred. | Boss directive 2026-05-09 |
| 10 | **Stay strictly in scope:** apex on .40. No touching .13 beyond DNS flip coordination. | Boss directive 2026-05-09 |

---

## Locked by team (delegated authority — reversible)

User delegated decision authority on these to the implementation team on 2026-05-09. Each is **reversible** — see "Fix-forward / reversibility plan" section below for cost-to-undo if boss directs differently later.

| # | Decision needed | Recommended | Alternatives | Why I recommend it |
|---|---|---|---|---|
| 1 | **Web server software** | Caddy for Windows | IIS, nginx-Windows | Single binary, automatic Let's Encrypt issuance + renewal, 1-line redirect, runs as Windows Service. IIS needs `win-acme` for cert (manual renewal scripts). nginx-Windows has no auto-HTTPS. Handoff explicitly leaves the choice to us. |
| 2 | **TLS issuance method** | HTTP-01 challenge | DNS-01 | HTTP-01 needs only DNS already pointing at .40 (which we control after flip). DNS-01 needs registrar API access at dnspro.vn (likely none). Handoff lists both, recommends sequencing for HTTP-01. |
| 3 | **`www` policy** | 301 redirect to apex | Serve same content on both | One canonical URL, simpler SEO, prevents duplicate content. Caddy: `www.wanmeivn.com { redir https://wanmeivn.com{uri} permanent }`. Handoff says "either is fine, just be consistent." |
| 4 | **HSTS** | Enable, WITHOUT `includeSubDomains` | Disabled / enabled with `includeSubDomains` | Forces HTTPS on apex (good). Excluding `includeSubDomains` prevents cascading the policy to `tieu3q.wanmeivn.com` (handoff explicitly flags this as a risk). |
| 5 | **HSTS preload submission** | **Defer** | Submit now | Preload is irreversible for ~6 months. Waste of risk for a test deploy that will be rebranded. |
| 6 | **Run as Windows Service** | Yes (Caddy native or via `nssm`) | Foreground / scheduled task | Survives reboots. Standard production pattern. |
| 7 | **DNS TTL pre-flip** | Drop `@` TTL to 300s a few hours before flip; restore after | Leave at 3600 | Fast rollback if cert/server issues. Standard practice. |
| 8 | **Stop the existing `npx serve` on :3000** | Yes, after Caddy is verified | Leave running | Redundant once Caddy serves the same content on :80/:443. |

---

## Open questions

### Resolved by boss (2026-05-09)

1. ~~Apex paths proxying into game?~~ → **NO.** Pages independent.
2. ~~HSTS with `includeSubDomains`?~~ → **NO.** Separation principle.
3. ~~Future subdomain naming convention?~~ → **Deferred.** "Figure out later."

### Still open — pre-flight technical checks (no boss decision needed)

4. **CAA records at apex** — does `wanmeivn.com` have any? If yes, must allow Let's Encrypt for both .40's issuer and .13's existing tieu3q renewal. Need to verify in dnspro.vn panel before cert issuance.
5. **MX records** — handoff warns: don't touch them unless we're moving mail too. We are not. Verify present-state MX before any DNS change to avoid accidental deletion in the panel.
6. **Windows Server 2019 Datacenter Evaluation expires** — currently installed edition is "Evaluation". If the apex is supposed to live there long-term, the license question should be raised with whoever owns infra. Out of scope for this deploy but flagged for visibility.

### ~~Still open — minor decisions~~ Now locked by team (2026-05-09)

7. ~~`www` policy~~ → **301 → apex** (locked).
8. ~~Web server / TLS method / Service install~~ → **Caddy for Windows + HTTP-01 + run as Windows Service** (all locked).

Reversal plans for each: see "Fix-forward / reversibility plan" section below.

---

## Architecture diagram (target state)

```
                         Internet
                            │
               ┌────────────┴────────────┐
               │                         │
               ▼                         ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ wanmeivn.com     │        │ tieu3q.wanmei... │
    │ www.wanmeivn.com │        │ (SGJTH5 game)    │
    └────────┬─────────┘        └────────┬─────────┘
             │                           │
             ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │ VPS .40 (winvps) │        │ VPS .13 (Linux)  │
    │ Windows Server   │        │ Caddy in Docker  │
    │ Caddy → mirror/  │        │ Caddy → game app │
    │ HTTPS (LE)       │        │ tieu3q :13001    │
    └──────────────────┘        └──────────────────┘
                                          │
                                  (other future games
                                   each on their own VPS,
                                   own subdomain)
```

---

## Six-phase implementation flow

### Phase 1 — Prep on .40 (offline-safe; no DNS/public effect yet)

1. Download Caddy for Windows (single `caddy.exe`, official build).
2. Place at `C:\caddy\caddy.exe`. Create `C:\caddy\Caddyfile`.
3. Caddyfile draft (initial, no TLS yet — temporary for IP test):
   ```
   :80 {
     root * C:\web\web1\webgame\Webgame-main\mirror
     file_server
   }
   ```
4. Open Windows Firewall inbound: TCP 80 + TCP 443.
5. Confirm any cloud-side ACL also allows 80 + 443 inbound (provider panel).
6. Run `caddy.exe run` from `C:\caddy\`. Verify locally: `http://localhost/` shows homepage.
7. Verify by IP from outside: `http://160.191.3.40/` — homepage must load.

### Phase 2 — DNS prep at registrar (you, in dnspro.vn)

1. Login to dnspro.vn.
2. Lower TTL on `@` from 3600 → 300 (allows fast rollback).
3. Verify `tieu3q` A record still points to `160.191.3.13` (sanity check).
4. Wait at least 1 h (ideally past old TTL window of 1 h) so resolvers honor new TTL.
5. Notify game team: "DNS flip happening at <time>; tieu3q untouched."

### Phase 3 — DNS flip (you, in dnspro.vn)

1. Update record `@`: `160.191.3.13` → `160.191.3.40`.
2. Add new record `www`: A → `160.191.3.40`.
3. **Leave `tieu3q` unchanged.**
4. Save changes.
5. Verify from .40 with `nslookup wanmeivn.com 8.8.8.8` after a few minutes.

### Phase 4 — Cert issuance (automatic, on .40)

1. Update Caddyfile to production form:
   ```
   wanmeivn.com {
     root * C:\web\web1\webgame\Webgame-main\mirror
     file_server
     header Strict-Transport-Security "max-age=31536000"
   }

   www.wanmeivn.com {
     redir https://wanmeivn.com{uri} permanent
   }
   ```
2. Reload Caddy: `caddy.exe reload`.
3. First HTTPS request to `https://wanmeivn.com` triggers Caddy to request Let's Encrypt cert via HTTP-01.
4. Same on first `https://www.wanmeivn.com` request.
5. Caddy logs to `C:\caddy\caddy.log` (or stdout) — watch for ACME success.

### Phase 5 — Verify

| Check | Expected |
|---|---|
| `nslookup wanmeivn.com` | 160.191.3.40 |
| `nslookup www.wanmeivn.com` | 160.191.3.40 |
| `nslookup tieu3q.wanmeivn.com` | 160.191.3.13 (unchanged) |
| `curl -I https://wanmeivn.com` | HTTP/2 200, valid cert |
| `curl -I https://www.wanmeivn.com` | HTTP 301 → `https://wanmeivn.com/` |
| Browser: `https://wanmeivn.com/` | Homepage loads with full styling, all CSS/images return 200 |
| Game team check: `https://tieu3q.wanmeivn.com` | Still works, login + WS handshake OK |

### Phase 6 — Hardening

1. Restore TTL on `@` from 300 back to 3600 in dnspro.vn.
2. Install Caddy as a Windows Service:
   - `caddy.exe install` (if Caddy build supports it) or use `nssm install Caddy "C:\caddy\caddy.exe" run --config C:\caddy\Caddyfile`.
   - Set service to auto-start.
3. Stop the `npx serve` background task on :3000 (no longer needed).
4. Confirm Caddy survives a manual reboot of .40 by running `Restart-Computer` and re-verifying Phase 5 checks.

---

## Risk table

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DNS propagation slow → users see old site | Medium | Low | TTL dropped to 300 pre-flip; flip during low-traffic window |
| Let's Encrypt rate-limit hits | Low | Medium | Caddy auto-handles; if hit, wait 1h. Pre-issuance should be clean — handoff confirms .13 never tried apex cert. |
| Cloud provider blocks port 80 inbound | Low | High (cert issuance fails) | Verify in panel before flip. If blocked, switch to DNS-01 (needs registrar API). |
| `tieu3q` accidentally edited during DNS flip | Low | High (game offline) | Two-person verification of dnspro.vn diff before save |
| Caddy crashes overnight, no autostart | Medium | High | Phase 6 mandates Windows Service install + reboot test |
| HSTS misconfigured, locks users out of HTTP fallback | Low | Medium | Test apex without HSTS first (Phase 4); enable header only after Phase 5 passes |
| MX records accidentally wiped in dnspro.vn UI | Low | High (mail offline if any) | Screenshot DNS panel before any save |
| Windows Eval edition expires | Certain (eventually) | High | License question raised to ops/owner; schedule before 180-day cutoff |

---

## Fix-forward / reversibility plan

These are *delegated-authority decisions* — locked by the team, but the user explicitly asked for documented reversal paths in case boss directs differently later. Every choice below can be undone without losing DNS state, certs (or only with a clean re-issue), or downtime exceeding ~10 minutes.

### Decision 1 — `www` policy: 301 → apex

**If boss wants same-content on www instead:**
- Edit `C:\caddy\Caddyfile`. Replace the `www.wanmeivn.com { redir ... }` block with the same `root` + `file_server` body as the apex block.
- `caddy.exe reload` (~1 second; no downtime).
- DNS, cert, firewall — all unchanged.
- **Reversal time:** ~5 minutes.
- **Data loss risk:** none.

### Decision 2 — Web server: Caddy

**If boss wants IIS:**
- Install IIS Server-Manager feature (`Install-WindowsFeature -name Web-Server -IncludeManagementTools`).
- Create site pointing at `mirror/`, bind 80 + 443.
- Install `win-acme` for Let's Encrypt cert (manual flow). The Caddy-issued cert can be exported to PFX and imported into IIS to skip a re-issue, OR let win-acme issue a fresh cert (clean).
- Translate redirects: replace Caddy's `redir` with IIS URL Rewrite module rules.
- Stop Caddy service before binding IIS to :80/:443.
- **Reversal time:** 1–2 hours.
- **Data loss risk:** none if cert PFX exported first; otherwise fresh LE issuance (well within rate limit).

**If boss wants nginx for Windows:**
- Download nginx-Windows build.
- Write `nginx.conf` translating Caddyfile rules. Note: nginx-Windows has no auto-HTTPS — install `win-acme` separately for cert + scheduled-task renewal.
- Stop Caddy service before binding nginx to :80/:443.
- **Reversal time:** 30–60 minutes.
- **Data loss risk:** as above.

**Cert-portability note:** Caddy stores its Let's Encrypt account + private keys at `C:\Users\Administrator\AppData\Roaming\Caddy\` — back this folder up before any swap to preserve continuity.

### Decision 3 — TLS method: HTTP-01

**If HTTP-01 fails (cloud blocks port 80) or boss wants DNS-01:**
- Caddy supports DNS-01 via plugins. dnspro.vn is unlikely to have an official Caddy DNS plugin — must verify.
- If no plugin: easiest fix is migrate DNS hosting to Cloudflare (free, has Caddy plugin). Nameserver change at registrar; DNS records re-created in Cloudflare panel.
- Caddyfile change: add `tls { dns cloudflare {env.CF_API_TOKEN} }` block.
- **Reversal time:** 30 min if dnspro plugin exists; ~1 day if Cloudflare migration required (most of which is propagation wait).
- **Data loss risk:** none (DNS records re-created from screenshots; current cert keeps working until renewal).

### Decision 4 — Process model: Windows Service

**If service install causes issues (rare, but Windows can be quirky):**
- `nssm stop Caddy && nssm remove Caddy confirm` (or `caddy.exe stop` + remove service).
- Replace with Task Scheduler task: trigger "At system startup", run as SYSTEM, action = `caddy.exe run --config C:\caddy\Caddyfile`.
- Or simply run foreground in a tmux/screen-equivalent (PowerShell window with `Start-Process -WindowStyle Hidden`).
- **Reversal time:** 5–10 minutes.
- **Data loss risk:** none.

### Cross-cutting reversibility note

**The DNS flip itself is the highest-cost-to-reverse action**, not any of the four locked decisions above. Rollback for the DNS flip is documented separately below ("Rollback plan"). If the team needs to undo *everything* and return to pre-deploy state, the path is: revert DNS at dnspro.vn → stop Caddy on .40 → close firewall ports 80/443. Total: ~10 minutes plus DNS propagation (5 min with TTL=300).

---

## Rollback plan (if anything breaks during/after flip)

1. **DNS rollback:** in dnspro.vn, change `@` back from `160.191.3.40` → `160.191.3.13`. Delete the new `www` A record. With TTL=300, propagation = 5 min.
2. Game team verifies `tieu3q.wanmeivn.com` still works (it should — never changed).
3. Apex returns to its pre-deploy state (default 404 from .13's Caddy).
4. Investigate root cause on .40 without time pressure.

---

## Caddyfile (final reference)

```caddyfile
{
    # Optional global block
    email ops@wanmeivn.com   # placeholder — substitute real ops contact for ACME
}

wanmeivn.com {
    root * C:\web\web1\webgame\Webgame-main\mirror
    file_server
    encode gzip zstd
    header {
        Strict-Transport-Security "max-age=31536000"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
    log {
        output file C:\caddy\logs\wanmeivn.log
    }
}

www.wanmeivn.com {
    redir https://wanmeivn.com{uri} permanent
}
```

---

## Success criteria

- `https://wanmeivn.com` returns HTTP 200 with valid Let's Encrypt cert and full styled homepage.
- `https://www.wanmeivn.com` returns 301 to apex.
- `https://tieu3q.wanmeivn.com` continues to work without any change observable to game team.
- Caddy on .40 survives a reboot (Windows Service active, auto-starts).
- All 8 firewall + DNS + cert checks in Phase 5 pass.
- Rollback plan tested (at minimum mentally — not necessarily executed).

---

## Next step (after this brainstorm is approved)

Generate plan MD: `plans/{date}-wanmeivn-apex-deploy/plan.md` plus phase files following project's plan structure (one phase file per phase 1–6 above).

Plan creation will be triggered by `/ck:plan` once boss/owner has signed off on the open recommendations in the "For discussion" section.
