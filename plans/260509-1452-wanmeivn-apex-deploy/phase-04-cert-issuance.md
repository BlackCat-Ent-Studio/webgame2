---
phase: 4
title: "Cert issuance + production Caddyfile"
status: pending
priority: P1
effort: "30m"
dependencies: [3]
---

# Phase 4: Cert Issuance + Production Caddyfile

## Overview
Replace the bare-`:80` Caddyfile with a production config that defines `wanmeivn.com` and `www.wanmeivn.com` as named sites. Caddy will automatically request Let's Encrypt certs via HTTP-01 challenge and start serving HTTPS.

## Requirements
- Functional: `https://wanmeivn.com` → 200 with valid LE cert.
- Functional: `https://www.wanmeivn.com` → 301 → `https://wanmeivn.com/`.
- Non-functional: HSTS header set, **WITHOUT** `includeSubDomains` (per boss directive).
- Non-functional: gzip + zstd compression enabled.
- Logging: per-vhost access log to file for later inspection.

## Architecture
```
Browser → :80 wanmeivn.com  ──────┐
                                  ├─→ Caddy auto-redirects to :443
Browser → :443 wanmeivn.com  ──→ Caddy ──→ static files (mirror/)
                                              │
Browser → :443 www.wanmeivn.com  → Caddy ──┘ → 301 → apex
                                              │
                                  ACME (HTTP-01) ──→ Let's Encrypt
                                              │
                                  Cert stored: %AppData%\Roaming\Caddy\
```

## Related Code Files
- Modify: `C:\caddy\Caddyfile` (replace Phase-1 minimal config with production config below)
- Create: `C:\caddy\logs\` directory (for access logs)
- Cert files (auto-managed by Caddy): `C:\Users\Administrator\AppData\Roaming\Caddy\certificates\`

## Production Caddyfile

```caddyfile
{
    email ops@wanmeivn.com
    # If we hit LE issues, uncomment to use staging endpoint for debugging:
    # acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
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
        output file C:\caddy\logs\wanmeivn-access.log {
            roll_size 10MiB
            roll_keep 5
        }
    }
}

www.wanmeivn.com {
    redir https://wanmeivn.com{uri} permanent
}
```

## Implementation Steps

1. Create log directory: `New-Item -Path C:\caddy\logs -ItemType Directory -Force`.
2. Replace `C:\caddy\Caddyfile` with the production config above.
3. **Confirm `email` value** is a real address you can monitor — Let's Encrypt sends expiry warnings here. Replace placeholder if needed.
4. Validate config syntax: `cd C:\caddy && .\caddy.exe validate`.
5. Reload (or start) Caddy with the new config:
   - If foreground from Phase 1 still running: in that terminal, hit Ctrl+C, then `.\caddy.exe run`.
   - Or `.\caddy.exe reload` if running.
6. Watch stdout for ACME progress:
   - Expect log lines: `obtain certificate` → `solving challenge` → `got renewal info` → `certificate obtained successfully`.
   - Repeat for `www.wanmeivn.com`.
7. If issuance fails:
   - Check error message — most common: CAA mismatch, port 80 blocked, DNS not propagated.
   - Refer to brainstorm reversibility plan if HTTP-01 must be replaced with DNS-01.
   - Use ACME staging (uncomment line in Caddyfile global block) for debugging without rate-limit risk.
8. Verify HTTPS reachable from external:
   ```bash
   curl -I https://wanmeivn.com
   # Expect: HTTP/2 200, valid LE cert, Server: Caddy
   curl -I https://www.wanmeivn.com
   # Expect: HTTP/2 301, Location: https://wanmeivn.com/
   ```

## Success Criteria
- [ ] `caddy.exe validate` passes
- [ ] Caddy logs show successful ACME issuance for both `wanmeivn.com` and `www.wanmeivn.com`
- [ ] `curl -I https://wanmeivn.com` → HTTP/2 200 with `Strict-Transport-Security` header
- [ ] `curl -I https://www.wanmeivn.com` → HTTP/2 301 → apex
- [ ] Cert files exist under `%AppData%\Roaming\Caddy\certificates\acme-v02.api.letsencrypt.org-directory\`
- [ ] No errors in `C:\caddy\logs\wanmeivn-access.log` after a test request

## Risk Assessment

| Risk | Mitigation |
|---|---|
| LE rate limit hit (50/week per domain) | Use staging endpoint for first attempts; production should succeed first try if Phase 2 CAA check was clean |
| ACME challenge fails — port 80 blocked | Phase 1 already verified; if newly blocked, see brainstorm reversibility plan (DNS-01) |
| HSTS misconfigured (browser locks out HTTP) | Header is `max-age=31536000` only; if needed, can be removed in 1 line |
| Caddy crash during issuance leaves partial state | Caddy retries automatically; safe to restart |
| Cert renewal failures later (silent) | Phase 6 schedules log rotation + LE email contact monitors expiry |

## Verification After Phase
Move to Phase 5 only when both `https://` URLs respond with the expected status and the cert is verifiable in a browser ("Connection is secure" with no warnings).
