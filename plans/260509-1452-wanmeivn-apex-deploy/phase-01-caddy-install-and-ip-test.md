---
phase: 1
title: "Caddy install + IP test on .40"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Caddy Install + IP Test on .40

## Overview
Install Caddy for Windows on VPS `.40`, configure it to serve the existing `mirror/` folder on port 80, open Windows Firewall, and verify the site is reachable from the public IP. **No DNS effect — pre-flight only.**

## Requirements
- Functional: Caddy responds with the mirror homepage at `http://160.191.3.40/`.
- Non-functional: Caddy binary version pinned (avoid auto-updates surprising us).
- Security: Inbound 80/443 opened only on the specific firewall rule we create — no blanket "all ports".

## Architecture
```
Public IP 160.191.3.40 :80
        │
        ▼
Windows Firewall ─── Allow TCP 80 inbound (rule: "Caddy-HTTP")
        │
        ▼
caddy.exe (foreground for now) ── Caddyfile
        │
        ▼
C:\web\web1\webgame\Webgame-main\mirror\index.html
```

## Related Code Files
- Create: `C:\caddy\caddy.exe` (download official Windows build)
- Create: `C:\caddy\Caddyfile` (initial, port-80-only config)
- Create: Windows Firewall rule "Caddy-HTTP" (inbound TCP 80, public profile)
- Modify: none
- Delete: none

## Implementation Steps

1. Download Caddy for Windows (latest stable from caddyserver.com/download — Windows amd64 build). Save to `C:\caddy\caddy.exe`.
2. Verify binary: `C:\caddy\caddy.exe version` → expect `v2.x.x`.
3. Create initial Caddyfile at `C:\caddy\Caddyfile`:
   ```
   :80 {
     root * C:\web\web1\webgame\Webgame-main\mirror
     file_server
   }
   ```
4. Open Windows Firewall inbound TCP 80:
   ```powershell
   New-NetFirewallRule -DisplayName "Caddy-HTTP" -Direction Inbound `
     -Protocol TCP -LocalPort 80 -Action Allow -Profile Any
   ```
5. Open Windows Firewall inbound TCP 443 (preemptively for Phase 4):
   ```powershell
   New-NetFirewallRule -DisplayName "Caddy-HTTPS" -Direction Inbound `
     -Protocol TCP -LocalPort 443 -Action Allow -Profile Any
   ```
6. **Stop existing `npx serve` on :3000 to avoid confusion** (keep on for now if testing in parallel; kill in Phase 6).
7. Run Caddy in foreground (NOT as service yet): `cd C:\caddy && .\caddy.exe run`.
8. Verify locally: `Invoke-WebRequest http://localhost/` → 200, ~45 KB body.
9. Verify by IP from outside: open `http://160.191.3.40/` in a browser on a non-VPS machine → must show full homepage with all CSS/images loading.
10. If Step 9 fails, check cloud provider's ACL/security-group panel — provider may block :80 inbound at their edge.

## Success Criteria
- [ ] `C:\caddy\caddy.exe version` reports a v2.x release
- [ ] `Invoke-WebRequest http://localhost/` returns 200
- [ ] `http://160.191.3.40/` opens from an external browser, full styling visible
- [ ] No errors in Caddy stdout
- [ ] Windows Firewall rules `Caddy-HTTP` and `Caddy-HTTPS` exist and enabled

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Cloud provider blocks :80 inbound at their edge | Verify in their panel; if blocked, switch TLS plan to DNS-01 (see brainstorm reversibility plan) |
| Antivirus quarantines `caddy.exe` | Whitelist `C:\caddy\` in Windows Defender / installed AV before download |
| Existing `npx serve` on :3000 confuses testing | Optional: stop it now, or leave running until Phase 6 |
| Caddy binary integrity | Verify SHA256 against caddyserver.com download page |

## Verification After Phase
Move to Phase 2 only when external `http://160.191.3.40/` test passes.
