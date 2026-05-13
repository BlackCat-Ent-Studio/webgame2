---
phase: 2
title: "DNS prep (TTL drop + pre-flight checks)"
status: pending
priority: P1
effort: "30m"
dependencies: [1]
---

# Phase 2: DNS Prep

## Overview
Prepare the registrar (`dnspro.vn`) for the DNS flip. Lower TTL on `@` for fast rollback, screenshot current state, verify CAA + MX won't conflict with cert issuance or break unrelated services, and notify the game team.

## Requirements
- Functional: Within ~1 hour after this phase, resolvers should honor TTL=300 on `@`.
- Non-functional: All current DNS records preserved (only TTL changed).
- Coordination: Game team aware of upcoming flip window.

## Architecture
No code change. Operations on the registrar control panel. Side effects: TTL change globally affects how fast resolvers update on flip + rollback.

## Related Code Files
- Create: none
- Modify: dnspro.vn DNS panel for `wanmeivn.com` (record TTLs only)
- Delete: none
- Add to repo (out of scope but recommended): screenshot of pre-flip DNS panel saved outside `mirror/` for audit; **must NOT be committed to git** if it contains the panel password.

## Implementation Steps

1. **Screenshot current DNS state** before any change (audit + rollback reference). Save to `C:\web\web1\webgame\picture\dns-pre-flip-2026-05-09.png` (or similar). **Do not commit; ensure `picture/` is in `.gitignore`**.
2. Login to https://dnspro.vn with stored credentials.
3. Open zone editor for `wanmeivn.com`.
4. **Pre-flight check #1 — CAA records:** check the `Display limits` panel for "Redirect & Frame" and the unfiltered record list for any CAA records. If a CAA exists restricting issuers:
   - If it allows `letsencrypt.org` → fine.
   - If it does not → either add `letsencrypt.org` to CAA, or delete CAA before cert issuance. **Do not skip — wrong CAA = ACME failure.**
5. **Pre-flight check #2 — MX records:** verify MX list. Note current state. **Do not modify.** Confirm we won't accidentally clobber them in step 8.
6. **Pre-flight check #3 — verify `tieu3q` A record** still points to `160.191.3.13`. Sanity check before any edit.
7. Lower TTL on `@` from `3600` → `300`.
   - If panel doesn't expose TTL inline, may require "Sửa" (edit) on the `@` record to find TTL field.
8. **Save changes carefully** — confirm the diff shows only TTL changed; no record values touched.
9. Verify: from external resolver, query repeatedly to see when 300s TTL takes effect:
   ```bash
   nslookup -type=A wanmeivn.com 8.8.8.8
   nslookup -type=A wanmeivn.com 1.1.1.1
   ```
   Look for TTL countdown approaching ≤300.
10. **Notify game team** (chat message): "Đổi DNS apex sang .40 lúc <giờ>. Tieu3q không động. Có thể cần verify post-flip phía bạn."
11. **Wait at least 1 hour** (past previous TTL=3600 window) before Phase 3 to ensure resolvers honor new TTL.

## Success Criteria
- [ ] Screenshot of pre-flip DNS state saved locally (not in git)
- [ ] CAA records confirmed compatible with Let's Encrypt OR adjusted
- [ ] MX records present-state recorded; not modified
- [ ] `tieu3q` A record verified at `160.191.3.13`
- [ ] `@` TTL changed from 3600 → 300, save successful
- [ ] External resolvers report TTL ≤ 300 on subsequent lookups
- [ ] Game team notified of flip window

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Accidentally edit `tieu3q` record while changing `@` | Two-pass review of diff before save; screenshot before+after |
| MX records vanish from panel due to UI quirk | Screenshot pre-state; if MX disappears, restore from screenshot |
| CAA blocks Let's Encrypt → Phase 4 fails | Pre-flight check #1 catches this before flip |
| Game team unprepared → flip during their incident | Flip only after explicit ACK from game team |
| TTL change not honored (some resolvers cache aggressively) | Wait ≥ old TTL (1h) before Phase 3 |

## Verification After Phase
Phase 3 may begin when external nslookup shows TTL ≤ 300 AND game team confirms availability.
