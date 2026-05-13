---
phase: 6
title: "Hardening (Service install + cleanup)"
status: pending
priority: P2
effort: "30m"
dependencies: [5]
---

# Phase 6: Hardening

## Overview
Move Caddy from foreground process to a Windows Service so it survives reboots, restore TTL on `@`, kill the now-redundant `npx serve` on :3000, and reboot-test the box.

## Requirements
- Functional: Caddy auto-starts on system boot.
- Functional: After `Restart-Computer`, Phase 5 checks still pass.
- Operational: TTL restored to 3600 (no need for fast rollback once stable).
- Operational: No stale dev processes running.

## Architecture
```
Before Phase 6:                          After Phase 6:
caddy.exe in foreground PowerShell      Windows Service "Caddy" (auto-start)
                                              │
                                        Survives reboot, runs as SYSTEM
                                              │
                                        Auto-restarts on crash (Service Recovery)
```

## Related Code Files
- Modify: Windows Services list (install Caddy service)
- Modify: dnspro.vn `@` TTL (300 → 3600)
- Stop: background bash task ID `bacya6xh8` (npx serve on :3000) if still running
- Optional create: `C:\caddy\caddy-service-install.ps1` — script for Service install/uninstall reproducibility

## Implementation Steps

### 6.1 — Install Caddy as Windows Service
Two options; pick one:

**Option A — Caddy native (preferred if Caddy build supports `caddy.exe service` subcommand):**
```powershell
cd C:\caddy
.\caddy.exe service install --config C:\caddy\Caddyfile
.\caddy.exe service start
Get-Service -Name Caddy   # verify Status=Running
```

**Option B — `nssm` wrapper (universal fallback):**
1. Download nssm from nssm.cc (Windows binary).
2. `C:\nssm\nssm.exe install Caddy "C:\caddy\caddy.exe" "run --config C:\caddy\Caddyfile"`
3. `C:\nssm\nssm.exe set Caddy AppDirectory C:\caddy`
4. `C:\nssm\nssm.exe set Caddy AppStdout C:\caddy\logs\caddy-stdout.log`
5. `C:\nssm\nssm.exe set Caddy AppStderr C:\caddy\logs\caddy-stderr.log`
6. `Start-Service Caddy`
7. `Set-Service Caddy -StartupType Automatic`

### 6.2 — Stop the foreground Caddy from Phase 1
- In the PowerShell window from Phase 1: Ctrl+C.
- Confirm only the Service-managed Caddy is now bound to :80/:443:
  ```powershell
  Get-NetTCPConnection -LocalPort 443 -State Listen | Select-Object OwningProcess
  Get-Process -Id <pid>   # verify it's the service-spawned caddy.exe, not the foreground one
  ```

### 6.3 — Stop the legacy `npx serve` on :3000
- Background task ID `bacya6xh8` is still running from earlier dev work.
- `Stop-Process -Name node -Force` — but this may kill other Node processes; targeted version:
  ```powershell
  $pid3000 = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
  if ($pid3000) { Stop-Process -Id $pid3000 -Force }
  Get-NetTCPConnection -LocalPort 3000 -State Listen   # expect empty
  ```

### 6.4 — Restore DNS TTL
1. Login dnspro.vn.
2. Edit `@` A record TTL: 300 → 3600.
3. Save. (Don't change anything else!)
4. Verify with nslookup that TTL goes back up over time.

### 6.5 — Reboot test
1. Schedule a low-traffic window or notify game team briefly.
2. `Restart-Computer -Force`.
3. After VPS comes back online (~2-5 min):
   ```powershell
   Get-Service -Name Caddy   # Status=Running
   Invoke-WebRequest https://wanmeivn.com -UseBasicParsing | Select-Object StatusCode
   ```
4. Re-run Phase 5 success criteria checklist abridged: apex 200, www 301, tieu3q 200.
5. If reboot test fails (Caddy didn't auto-start): investigate Service config; do NOT leave the box without auto-start working — that's the whole point of this phase.

### 6.6 — Documentation update
- Update `docs/handoff-260509-0308-wanmeivn-apex-to-vps40.md` status footer or add a sibling `docs/deployment-260509-wanmeivn-apex.md` recording:
  - Final Caddyfile (snapshot)
  - Service install method used (A or B)
  - Cert auto-renewal expected behavior
  - How to access logs
  - Contact for incidents

## Success Criteria
- [ ] `Get-Service Caddy` shows Status=Running, StartType=Automatic
- [ ] Phase 1 foreground Caddy terminated (only one caddy.exe bound to :80/:443)
- [ ] `npx serve` on :3000 stopped; port 3000 free
- [ ] `@` TTL restored to 3600 in dnspro.vn
- [ ] After `Restart-Computer`, `https://wanmeivn.com` responds 200 within 2 min of boot
- [ ] After reboot, `tieu3q` still works (game team confirms or we curl)
- [ ] Deployment doc written and committed (or noted in handoff doc)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Service install via Option A fails (build doesn't support `service` subcommand) | Fall back to Option B (nssm) — universal Windows service wrapper |
| Reboot test fails: Caddy didn't auto-start, site offline | Don't leave site in this state; troubleshoot Service config or fall back to Task Scheduler "At system startup" trigger |
| Stopping :3000 kills the wrong node process | Use targeted PID lookup via `Get-NetTCPConnection`; do not `Stop-Process -Name node` blindly |
| Reboot during business hours impacts users | Schedule during a maintenance window; warn game team it's a 5-min apex blip |
| TTL restoration overwrites unrelated record | Only edit TTL on `@`; verify diff before save |

## Verification After Phase
Plan complete when:
- Reboot test passed
- Phase 5 abridged checks passed post-reboot
- Deployment doc written

After completion: archive plan via `/ck:plan archive` and run `/ck:journal` for technical journal entry.
