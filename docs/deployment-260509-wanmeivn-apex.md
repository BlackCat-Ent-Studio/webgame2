---
type: deployment-record
date: 2026-05-09
status: live
domain: wanmeivn.com
host: 160.191.3.40 (winvps, Windows Server 2019)
related:
  - handoff-260509-0308-wanmeivn-apex-to-vps40.md
  - ../plans/260509-1452-wanmeivn-apex-deploy/plan.md
  - ../plans/reports/brainstorm-2026-05-09-wanmeivn-apex-deploy.md
---

# Deployment Record — `wanmeivn.com` Apex on VPS .40

## Live URLs
- `https://wanmeivn.com` → 200, full mirror homepage, Let's Encrypt cert
- `https://www.wanmeivn.com` → 301 → apex
- `http://wanmeivn.com` → 308 → HTTPS
- `https://tieu3q.wanmeivn.com` → unchanged (still on .13, game team's territory)

## Stack
- **Server:** Caddy v2.11.2 for Windows
- **Path:** `C:\caddy\caddy.exe`
- **Config:** `C:\caddy\Caddyfile`
- **Logs:** `C:\caddy\logs\wanmeivn-access.log` (10 MiB rotation, 5 kept)
- **Service:** Windows Task Scheduler task `Caddy`, runs as SYSTEM, trigger = at-startup
  - Inspect: `Get-ScheduledTask -TaskName Caddy` / `Get-ScheduledTaskInfo -TaskName Caddy`
  - Restart: `Stop-ScheduledTask -TaskName Caddy; Start-ScheduledTask -TaskName Caddy`
  - Stop Caddy process directly: `Get-Process caddy | Stop-Process -Force` (Task Scheduler will not auto-restart unless the process exits with non-zero)

## TLS
- **Issuer:** Let's Encrypt (E8 intermediate)
- **Subject:** CN=wanmeivn.com (with SAN for www.wanmeivn.com)
- **First issued:** 2026-05-09 07:37 UTC
- **Expires:** 2026-08-07 07:37 UTC (90 days, auto-renewed by Caddy ~30 days before expiry)
- **Challenge type:** TLS-ALPN-01 (Caddy auto-selected)
- **ACME account email:** `tringuyen14071992@gmail.com` (LE expiry warnings go here)
- **Cert storage:** `C:\Users\Administrator\AppData\Roaming\Caddy\certificates\acme-v02.api.letsencrypt.org-directory\`

## Firewall
- Inbound TCP 80 (rule `Caddy-HTTP`) — for ACME HTTP-01 challenges (currently unused, TLS-ALPN-01 used)
- Inbound TCP 443 (rule `Caddy-HTTPS`) — production HTTPS
- Pre-existing `Cauca-80` rule also allows :80; harmless.

## Security headers (HTTPS apex)
- `Strict-Transport-Security: max-age=31536000` (no `includeSubDomains` per separation principle)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## DNS (registrar: dnspro.vn / matbao.com NS)
- `@`     A → `160.191.3.40`, TTL 3600
- `www`   A → `160.191.3.40`, TTL 3600
- `tieu3q` A → `160.191.3.13`, TTL 3600 (untouched)
- MX/CAA: not modified (n/a or absent)

## Backup of pre-deploy Caddyfile
`C:\caddy\Caddyfile.phase1.bak` (port-80-only HTTP test config from initial setup)

## Cert renewal — automatic
Caddy checks expiry on every config reload + every ~12h via `tls.cache.maintenance` background loop. Renews ~30 days before expiry. No manual action needed unless renewal fails for >7 days; LE will email `tringuyen14071992@gmail.com` if so.

## How to update content
1. Edit/replace files in `C:\web\web1\webgame\Webgame-main\mirror\`.
2. No Caddy reload needed (file_server reads from disk on every request).
3. Browser cache may need bypassing (Ctrl+F5).

## How to roll back the entire deployment
1. dnspro.vn: change `@` A back to `160.191.3.13`, delete `www` A record.
2. On .40: `Stop-ScheduledTask -TaskName Caddy; Get-Process caddy | Stop-Process -Force`.
3. Optional cleanup: `Disable-NetFirewallRule -DisplayName Caddy-*` (firewall rules) and `Unregister-ScheduledTask -TaskName Caddy -Confirm:$false`.

## Reboot test — pending
At time of writing, the box has not been rebooted post-deploy. The Task Scheduler trigger is `At system startup` running as SYSTEM — should auto-start Caddy on next reboot. **Verify with first scheduled reboot or run `Restart-Computer` and re-verify HTTPS within ~3 min of boot.**

## Open / future items
- Run reboot test (see above).
- Consider replacing Task Scheduler with a real Windows Service via `nssm` if/when nssm.cc is reachable, or via `winsw`. Current Task Scheduler approach works but doesn't show up in `services.msc`.
- Windows Server 2019 is **Datacenter Evaluation** edition — schedule licensing review before 180-day cutoff.
- HSTS preload submission: deferred (irreversible 6-month commitment, not appropriate for a test/rebrand-pending site).
- Future game subdomains will live on their own VPSes per boss directive.
