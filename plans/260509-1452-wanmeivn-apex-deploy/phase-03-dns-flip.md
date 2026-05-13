---
phase: 3
title: "DNS flip at registrar"
status: pending
priority: P1
effort: "15m"
dependencies: [2]
---

# Phase 3: DNS Flip at Registrar

## Overview
At the registrar (`dnspro.vn`), point the apex `@` record to `.40` and create the `www` record. **The `tieu3q` record is never touched.** This is the highest-blast-radius operation in the plan.

## Requirements
- Functional: After save, `wanmeivn.com` and `www.wanmeivn.com` resolve to `160.191.3.40`.
- Non-functional: `tieu3q.wanmeivn.com` resolution unchanged (`160.191.3.13`).
- MX, NS, CAA records unchanged.

## Architecture
DNS state transition only:

```
Before:                              After:
@      A  160.191.3.13               @       A  160.191.3.40
                                     www     A  160.191.3.40   (NEW)
tieu3q A  160.191.3.13                tieu3q A  160.191.3.13   (UNCHANGED)
MX     ...                            MX      ...              (UNCHANGED)
CAA    ... (if any)                   CAA     ...              (UNCHANGED)
```

## Related Code Files
- Modify: dnspro.vn zone records for `wanmeivn.com`
- No file system changes

## Implementation Steps

1. Confirm pre-conditions:
   - Phase 1 verified `http://160.191.3.40/` works publicly.
   - Phase 2 verified TTL=300 honored, CAA OK, game team ACK'd.
2. Login to dnspro.vn.
3. Open zone editor for `wanmeivn.com`.
4. **Edit `@` A record:** value `160.191.3.13` → `160.191.3.40`. Do NOT change TTL again, do NOT change name. Save.
5. **Add new `www` A record:** name `www`, type `A`, value `160.191.3.40`, TTL `300`. Save.
6. Re-open zone editor. Verify the diff is exactly:
   - `@` A → `160.191.3.40`
   - `www` A → `160.191.3.40` (new)
   - **`tieu3q` A → `160.191.3.13`** (unchanged — verify by sight!)
   - MX/NS/CAA → unchanged
7. Take a post-flip screenshot for audit (`picture/dns-post-flip-2026-05-09.png`).
8. Watch propagation:
   ```bash
   # Run repeatedly, every 30s, until both return .40:
   nslookup wanmeivn.com 8.8.8.8
   nslookup www.wanmeivn.com 8.8.8.8

   # And confirm tieu3q never changes:
   nslookup tieu3q.wanmeivn.com 8.8.8.8   # MUST stay 160.191.3.13
   ```
9. Wait until at least two public resolvers (8.8.8.8 + 1.1.1.1) report `.40` for apex AND `www`. Typical: 5–30 min with TTL=300.

## Success Criteria
- [ ] `nslookup wanmeivn.com 8.8.8.8` → `160.191.3.40`
- [ ] `nslookup www.wanmeivn.com 8.8.8.8` → `160.191.3.40`
- [ ] `nslookup tieu3q.wanmeivn.com 8.8.8.8` → `160.191.3.13` (unchanged!)
- [ ] `nslookup wanmeivn.com 1.1.1.1` → `160.191.3.40`
- [ ] Pre/post DNS panel screenshots taken
- [ ] No MX/NS/CAA accidentally modified

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `tieu3q` accidentally pointed at `.40` → game offline for users | Mandatory step-6 verification before walking away; screenshot diff |
| Save partially fails, only `@` changes | Re-check via nslookup; if `www` missing, just re-add it |
| Resolver caching causes mixed traffic for ~30 min | Expected with DNS; Phase 4 starts only after both resolvers report `.40` |
| Cloud provider DDoS / RBL blocks new IP after change | Unlikely; have rollback ready (revert `@` to `.13` in dnspro.vn) |
| User accidentally hits "Xóa" (delete) on tieu3q row | Use only the "Sửa" (edit) button on `@` |

## Rollback (mid-flip)
If Step 6 verification fails or anything looks wrong, immediately:
1. Edit `@` back to `160.191.3.13`.
2. Delete the newly created `www` A record.
3. Re-verify with nslookup.
4. Ping game team to verify `tieu3q` traffic OK.

## Verification After Phase
Move to Phase 4 only when nslookup against `8.8.8.8` AND `1.1.1.1` both report `160.191.3.40` for apex + www, AND `tieu3q` still resolves to `.13`.
