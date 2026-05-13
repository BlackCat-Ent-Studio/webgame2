---
phase: 5
title: "Verify deploy + game intact"
status: pending
priority: P1
effort: "30m"
dependencies: [4]
---

# Phase 5: Verify Deploy + Game Intact

## Overview
End-to-end verification that the apex deploy succeeded AND the SGJTH5 game on `.13` is unaffected. Coordinated with the game team for the post-flip smoke test.

## Requirements
- Functional: Full happy-path test for `wanmeivn.com`, `www.wanmeivn.com`, and `tieu3q.wanmeivn.com`.
- Non-functional: All asset 200s on apex (no broken images/CSS like the early-session bug).
- Coordination: Game team independently confirms tieu3q.

## Architecture
No changes — pure verification.

## Related Code Files
- None modified.
- Reads: `C:\caddy\logs\wanmeivn-access.log` for traffic confirmation.

## Implementation Steps

### DNS sanity (re-run from external)
```bash
nslookup wanmeivn.com 8.8.8.8           # → 160.191.3.40
nslookup www.wanmeivn.com 8.8.8.8       # → 160.191.3.40
nslookup tieu3q.wanmeivn.com 8.8.8.8    # → 160.191.3.13  (UNCHANGED!)
nslookup wanmeivn.com 1.1.1.1           # → 160.191.3.40
```

### TLS + HTTP behavior
```bash
curl -I https://wanmeivn.com            # 200 + cert subject = wanmeivn.com
curl -I https://www.wanmeivn.com        # 301 → https://wanmeivn.com/
curl -I http://wanmeivn.com             # 308 → https
curl -I http://www.wanmeivn.com         # 308 → https://www then 301 → apex
curl -I https://tieu3q.wanmeivn.com     # 200 (game team's existing cert)
```

### Apex content load
- Open `https://wanmeivn.com` in a real browser (Chrome/Firefox).
- Open DevTools → Network tab → reload.
- **All requests must return 200**, including:
  - HTML
  - CSS files (`yy2103.css`, `index2104_2209.css`, `index230418.css`, `swiper-4.5.0.min.css`, `animate.min.css`)
  - Image files (`nav-logo.png`, all `popup-yy-*.png`, etc.)
  - Any JS files referenced
- Visual: page should look identical to local `http://localhost:3000/` from earlier dev sessions.

### Game intact (game team to perform)
Send to game team with explicit asks:
- [ ] `https://tieu3q.wanmeivn.com` loads as expected.
- [ ] Game login flow works (their standard smoke test).
- [ ] WebSocket handshake completes.
- [ ] Caddy logs on `.13` for `tieu3q` show normal request rate, no spike of errors.

### HTTPS cert validation
- Browser: padlock icon, "Connection is secure", issued by Let's Encrypt R10 (or current LE intermediate).
- `openssl s_client -connect wanmeivn.com:443 -servername wanmeivn.com 2>/dev/null | openssl x509 -noout -dates -subject -issuer`
  - Subject CN = `wanmeivn.com`
  - Issuer = `Let's Encrypt`
  - NotAfter ~3 months out

### Negative tests
- `curl -I https://wanmeivn.com:80` → expect connection refused or redirect (not 200 — would indicate misconfig).
- `curl --resolve wanmeivn.com:443:160.191.3.13 https://wanmeivn.com/` → expect cert mismatch / not-served (verifies the apex is NOT being served from .13 anymore).

## Success Criteria
- [ ] All 4 nslookup checks return expected IPs
- [ ] All 5 curl HTTP/HTTPS checks return expected status codes
- [ ] Browser DevTools shows zero 4xx/5xx in Network tab on `https://wanmeivn.com`
- [ ] Browser displays page identical to local mirror, with full styling
- [ ] Cert subject = `wanmeivn.com`, issuer = Let's Encrypt
- [ ] Game team confirms tieu3q OK in writing (chat ack)
- [ ] No error spikes in Caddy log on .40 or game's Caddy log on .13

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Mixed-content warnings (HTTP assets on HTTPS page) | Audit `mirror/index.html` for `http://` URLs; rewrite to `https://` or relative |
| Some image returns 404 (legacy `index2103` removed upstream) | Already known from initial deploy — three legacy images. Document as expected, not a regression. |
| Game team finds tieu3q broken AT THIS STEP | Halt; investigate. Most likely DNS confusion (cached old IP) — check from multiple resolvers. If real, rollback (Phase 3 rollback). |
| Cert valid but browser warns "weak cipher" | Caddy ships modern defaults; should not happen. If it does, check Windows Server 2019 cipher suite list. |

## Verification After Phase
Move to Phase 6 only when ALL success criteria pass AND game team has acknowledged tieu3q is healthy.
