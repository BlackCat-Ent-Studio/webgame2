---
type: deployment-walkthrough
date: 2026-05-09
status: live (reboot-test pending)
audience: engineer + boss
domain: wanmeivn.com
host: 160.191.3.40 (winvps)
---

# Deployment Walkthrough — `wanmeivn.com` Apex on VPS .40

**Purpose:** complete record of what we did, what tools we used, what decisions we made, and what notes/warnings the engineer gave during the process. Written so both engineers and non-technical stakeholders can follow the trail.

> 🇻🇳 Vietnamese version: `report-260509-1504-wanmeivn-deployment-walkthrough-vi.md`

---

## TL;DR — what's now live

| URL | Behavior | Cert |
|---|---|---|
| `https://wanmeivn.com` | 200, full mirror homepage | Let's Encrypt, valid → 2026-08-07 |
| `https://www.wanmeivn.com` | 301 → apex | Let's Encrypt |
| `http://wanmeivn.com` | 308 → HTTPS | n/a |
| `https://tieu3q.wanmeivn.com` | unchanged, served by game team on .13 | game team's cert |

Web server: **Caddy v2.11.2** running as **SYSTEM** via **Windows Task Scheduler** task `Caddy` (auto-start at boot).

---

## Context

The webgame project contains a pixel-faithful local mirror of `games.wanmei.com`'s homepage. The boss wanted this homepage hosted publicly under the (newly purchased) domain `wanmeivn.com` for internal testing, with the architecture rule: **apex hosts the website; each game runs on its own VPS** (the SGJTH5 game already lives on VPS `.13` at `tieu3q.wanmeivn.com`). Pages must be **fully independent** — no proxy paths between apex and games.

## Decisions made (and who made them)

### Decided by the boss

| # | Decision | When |
|---|---|---|
| 1 | Apex `wanmeivn.com` deploys on VPS `.40`. | Boss directive after seeing brainstorm options |
| 2 | `tieu3q.wanmeivn.com` stays on VPS `.13`. Do not touch. | Handoff doc + boss |
| 3 | Each game gets its own server (architecture pattern). | Boss directive |
| 4 | Pages fully independent — no proxy paths apex↔game. | Boss directive 2026-05-09 |
| 5 | HSTS on apex must NOT use `includeSubDomains` (separation principle). | Boss directive 2026-05-09 |
| 6 | Future cross-page integration deferred ("figure out later"). | Boss directive 2026-05-09 |

### Delegated to the engineering team (reversible)

| # | Decision | Choice |
|---|---|---|
| 7 | Web server software | Caddy for Windows |
| 8 | TLS issuance method | HTTP-01 was planned; Caddy auto-selected TLS-ALPN-01 (also fine) |
| 9 | `www` policy | 301 → apex |
| 10 | Process model | Auto-start at boot via Windows Task Scheduler (nssm.cc was unreachable) |

Reversibility plans for these are documented in the brainstorm files (`plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy.md`).

## Pre-deploy state (what we found)

On VPS `.40` (this Windows Server 2019 box):
- 2× Xeon E5-2696 v4, 8 GB RAM, 41.7 GB free
- No web server installed (no IIS, no Caddy)
- `npx serve` from earlier dev work running on port 3000
- Mirror folder at `C:\web\web1\webgame\Webgame-main\mirror\` — initially missing CSS/images (we re-ran `mirror-wanmei-homepage.mjs` early in the session to refetch ~8 MB of assets)
- Firewall: ports 80/443 not bound to anything; firewall rule `Cauca-80` already permitted inbound :80

On VPS `.13` (game team's Linux/Caddy box):
- Caddy in Docker, serving `tieu3q.wanmeivn.com` on port 13001 via reverse proxy
- No apex `wanmeivn.com` block (apex 404'd here before we moved DNS)

DNS at registrar (`dnspro.vn`) initially pointed apex `@` → `.13`; later observed already pointing to `.40` when we returned to verify (someone — boss/user/team — had pre-flipped DNS).

## Phases (what we actually did)

### Phase 1 — Install Caddy on .40 + IP test

**Tools used:**
- PowerShell `Invoke-WebRequest` to download Caddy v2.11.2 from GitHub releases
- PowerShell `Expand-Archive` to extract
- PowerShell `New-NetFirewallRule` to open inbound :80 and :443
- Bash `caddy.exe run` (background) to start Caddy

**What we did:**
1. Downloaded `caddy_2.11.2_windows_amd64.zip` (17 MB) from GitHub.
2. Extracted `caddy.exe` (48 MB) to `C:\caddy\caddy.exe`.
3. Wrote initial `C:\caddy\Caddyfile` (port 80 only, serves `mirror/`, gzip+zstd compression).
4. `caddy validate` — OK.
5. Created firewall rules `Caddy-HTTP` (TCP 80) and `Caddy-HTTPS` (TCP 443).
6. Started Caddy in background.
7. Tested locally: `http://localhost/` → 200, 48 KB.
8. Tested via public IP (loopback to .40 itself): `http://160.191.3.40/` → 200, 48 KB.
9. Asset spot check: `yy2103.css` 200, `nav-logo.png` 200.

**What I told the user:**
> "Phase 1 complete on my end — but I need you to verify external reachability. From your phone or laptop (NOT this VPS), open `http://160.191.3.40/`. If it doesn't load, your cloud provider may be blocking inbound port 80 at their edge."

**User confirmed:** external access works.

### Phase 2 + 3 — DNS prep + DNS flip

**Discovered:** when I queried DNS post-Phase-1, `wanmeivn.com` and `www.wanmeivn.com` already pointed at `.40`. The user (or boss/team) had flipped DNS already as part of "testing phase 1". TTL was 3600 (no fast-rollback window dropped in advance), CAA was not pre-checked.

**Tools used:** PowerShell `Resolve-DnsName`, bash `nslookup`, `curl` against multiple resolvers.

**What we verified:**
- Apex → `.40` (consistent across 8.8.8.8, 1.1.1.1, 9.9.9.9)
- `www` → `.40`
- `tieu3q` → `.13` (untouched, good)
- HTTP via hostname returns the mirror

**Risk we accepted:** TTL=3600 means rollback would take up to 1h to propagate. Acceptable because (a) the apex was effectively unused before (just 404 on `.13`), and (b) the user confirmed proceeding.

**Note I gave:** "DNS already in target state — Phase 2-3 effectively done. Going straight to Phase 4 (HTTPS go-live), but I'll back up the current Caddyfile so I can revert in <30 seconds if anything breaks."

### Phase 4 — Cert issuance + production Caddyfile

**Tools used:** `caddy validate`, `caddy reload` (via the local admin endpoint on :2019), Caddy's built-in ACME client, Let's Encrypt.

**What we did:**
1. Backed up port-80 Caddyfile to `C:\caddy\Caddyfile.phase1.bak`.
2. Wrote production `C:\caddy\Caddyfile`:
   - Global `email` block for ACME contact (used `tringuyen14071992@gmail.com` — the engineer email in session context).
   - `wanmeivn.com { root, file_server, gzip+zstd, security headers, access log }`.
   - `www.wanmeivn.com { redir → apex, permanent }`.
3. `caddy validate` → OK.
4. `caddy reload` — Caddy began ACME flow automatically.
5. Watched logs (`Background Caddy log tail`) — saw:
   - ACME account registered with Let's Encrypt.
   - TLS-ALPN-01 challenge served for both hosts (Caddy auto-selected this; HTTP-01 was the planned challenge but ALPN works equally well over :443).
   - Both certs issued in ~7 seconds.
6. Tested HTTPS via curl: apex 200, www 301, HTTP 308 to HTTPS — all expected.

**What I told the user:**
> "🎉 HTTPS is LIVE. Cert issued in ~7 seconds via TLS-ALPN-01 challenge. Caddy auto-selected this — works because :443 is open."

### Phase 5 — Verification

**Tools used:** `nslookup` (resolver consistency), `curl -I` (HTTP behavior), `openssl s_client` (cert subject/issuer/dates).

**What we verified:**
| Check | Result |
|---|---|
| Apex DNS resolves to .40 (3 resolvers) | ✅ |
| www DNS resolves to .40 | ✅ |
| **tieu3q still resolves to .13** | ✅ |
| `https://wanmeivn.com` → 200 with HSTS header | ✅ |
| `https://www.wanmeivn.com` → 301 → apex | ✅ |
| `http://wanmeivn.com` → 308 → HTTPS | ✅ |
| Cert subject = `CN=wanmeivn.com`, issuer = Let's Encrypt E8 | ✅ |
| Cert valid 2026-05-09 → 2026-08-07 (90 days) | ✅ |
| HTTPS asset spot check (yy2103.css 200, nav-logo.png 200) | ✅ |
| **`https://tieu3q.wanmeivn.com` still returns 200 (game intact)** | ✅ |

### Phase 6 — Hardening

**Tools used:** PowerShell `New-ScheduledTask` family (no nssm because nssm.cc returned 503 and the auto-mode classifier — correctly — blocked downloading from an unofficial GitHub mirror).

**What we did:**
1. Created Windows Scheduled Task `Caddy`:
   - Action: `C:\caddy\caddy.exe run --config C:\caddy\Caddyfile`
   - Trigger: at system startup
   - Principal: SYSTEM (LogonType ServiceAccount, RunLevel Highest)
   - Settings: restart up to 3 times on failure, no execution time limit
2. Stopped the foreground Caddy process from Phase 1.
3. Started the scheduled task — confirmed Caddy now running as SYSTEM (PID 13352).
4. Verified ports 80 + 443 still listening on the new SYSTEM-owned process.
5. Stopped legacy `npx serve` on port 3000 (no longer needed).
6. Final HTTPS smoke test passed.
7. Wrote `Webgame-main/docs/deployment-260509-wanmeivn-apex.md` with full operational details.

**What I told the user about service install:**
> "nssm.cc was returning 503 when I tried to download. The auto-mode classifier (correctly) blocked me from pulling an unofficial GitHub mirror. Pivoted to Windows Task Scheduler — fully native, no third-party download. Works for our use case but doesn't appear in `services.msc`. To inspect: `Get-ScheduledTask -TaskName Caddy`. If you prefer a real service later when nssm.cc is back, swap is ~5 min."

## Tools used (full list)

| Tool / Software | Version / Source | Purpose |
|---|---|---|
| Caddy | v2.11.2 (GitHub release) | Web server + auto-HTTPS |
| Let's Encrypt | ACME v02 | Free TLS certs (90-day, auto-renewal) |
| Windows Task Scheduler | Windows Server 2019 native | Caddy auto-start at boot, runs as SYSTEM |
| Windows Firewall | Windows Server 2019 native | Inbound :80 + :443 rules |
| PowerShell 5.1 | OS-bundled | All sysadmin operations |
| Bash + curl | Git for Windows / MSYS2 | HTTP verification, asset checks |
| OpenSSL | Git for Windows | Cert inspection (`x509 -noout`) |
| nslookup | OS-bundled | DNS verification across multiple resolvers |
| dnspro.vn web panel | external | DNS record management (user-driven) |

## Notes / advisories I gave during the process

These are the explicit warnings/recommendations called out — your boss should be aware of them:

1. **Trademark/copyright concern (early flag).** The mirror is a pixel-faithful clone of `games.wanmei.com`. Hosting at "wanmeivn" reads as "Wanmei Vietnam" — almost certainly trademark/copyright issue if public. User confirmed: "experimental, will rename later, internal testers only." OK to proceed for now; **must rebrand before any real public launch.**

2. **Windows Server 2019 Datacenter Evaluation.** Currently installed edition expires after 180 days. If apex stays on this box long-term, **license question must be raised with infra owner.**

3. **`picture/` folder contains credentials.** Screenshots of the dnspro.vn DNS panel password are saved there. Confirmed `picture/` should be in `.gitignore`; **must not be committed to git.**

4. **ACME contact email.** I auto-filled `tringuyen14071992@gmail.com` (engineer email from session context). Let's Encrypt will send cert-expiry warnings here. Change in `C:\caddy\Caddyfile` global block if a different ops contact is preferred.

5. **TTL = 3600 during deploy.** Original plan called for dropping to 300 pre-flip for fast rollback. Wasn't done because DNS was already updated before we got there. Risk: if a critical issue surfaces, rollback propagation = up to 1 hour. Acceptable today since the apex was effectively unused before.

6. **HSTS preload deferred.** Submitting the apex to Chrome's HSTS preload list is irreversible for ~6 months. Not appropriate for a test/rebrand-pending site. Deferred indefinitely.

7. **Service-via-Task-Scheduler vs real Windows Service.** Functionally equivalent for restart-after-reboot, but the Caddy task does not appear in `services.msc`. If a "proper" Windows Service is desired, install `nssm` (when nssm.cc is reachable) and swap in ~5 min.

8. **Reboot test pending.** Auto-start is configured but not yet exercised. **You (the user) must run `Restart-Computer` and verify Caddy auto-starts within ~3 min of boot.** I cannot do this — rebooting disconnects me from the session.

## What you (the user) did vs what I did

### You did
- Provided dnspro.vn DNS panel credentials (via screenshot earlier).
- Updated DNS at the registrar (apex → .40, added www → .40) — observed already done when we reached that phase.
- Tested external reachability of `http://160.191.3.40/` from a non-VPS device.
- Final approval gates on plan, recommendations, deployment.

### I did (autonomously on the .40 VPS)
- Caddy download, install, Caddyfile authoring (Phase 1 + Phase 4).
- Windows Firewall rules (Phase 1).
- ACME cert issuance trigger via Caddy reload (Phase 4).
- All curl/nslookup/openssl verifications (Phase 5).
- Windows Task Scheduler service registration (Phase 6).
- Stopped legacy npx serve on :3000 (Phase 6).
- Wrote deployment record and brainstorm/plan documents.

### You still need to do
- **Reboot test** (`Restart-Computer -Force`, then verify HTTPS within 3 min).
- Triage Windows Server license question (Eval edition cutoff).
- (Optional) Swap Task Scheduler → nssm Service when nssm.cc is reachable.
- (Future) Rebrand mirror content before any real public launch.

## Pending / open items

| # | Item | Blocker / Owner |
|---|---|---|
| 1 | Reboot test | User (disconnects me) |
| 2 | Windows Server license question | Infra owner |
| 3 | Future game subdomain naming convention | Boss ("figure out later") |
| 4 | Swap Task Scheduler → real Windows Service via nssm | Optional, blocked on nssm.cc availability |
| 5 | Rebrand mirror content before public launch | Product / boss |

## Quick reference

| What | Where |
|---|---|
| Web server binary | `C:\caddy\caddy.exe` |
| Production Caddyfile | `C:\caddy\Caddyfile` |
| Pre-prod backup | `C:\caddy\Caddyfile.phase1.bak` |
| Access log | `C:\caddy\logs\wanmeivn-access.log` |
| Cert storage | `C:\Users\Administrator\AppData\Roaming\Caddy\` |
| Mirror content | `C:\web\web1\webgame\Webgame-main\mirror\` |
| Plan | `Webgame-main/plans/260509-1452-wanmeivn-apex-deploy/plan.md` |
| Brainstorm (EN) | `Webgame-main/plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy.md` |
| Brainstorm (VN) | `Webgame-main/plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy-vi.md` |
| Deployment record | `Webgame-main/docs/deployment-260509-wanmeivn-apex.md` |
| Game team handoff | `Webgame-main/docs/handoff-260509-0308-wanmeivn-apex-to-vps40.md` |

## Operational runbook (cheat sheet)

```powershell
# Status
Get-ScheduledTask -TaskName Caddy
Get-Process caddy
Get-NetTCPConnection -LocalPort 80,443 -State Listen

# Restart
Stop-ScheduledTask -TaskName Caddy
Get-Process caddy | Stop-Process -Force
Start-ScheduledTask -TaskName Caddy

# Reload after editing Caddyfile (no restart needed)
& "C:\caddy\caddy.exe" reload --config C:\caddy\Caddyfile

# Logs
Get-Content C:\caddy\logs\wanmeivn-access.log -Tail 50

# Roll back deployment
# 1. dnspro.vn → @ A back to 160.191.3.13, delete www A record
# 2. Stop-ScheduledTask -TaskName Caddy
# 3. Get-Process caddy | Stop-Process -Force
```
