---
title: "Deploy wanmeivn.com apex on VPS .40 (Caddy + Let's Encrypt)"
status: pending
priority: P1
date: 2026-05-09
slug: wanmeivn-apex-deploy
source: brainstorm
brainstorm: ../reports/brainstorm-2026-05-09-wanmeivn-apex-deploy.md
brainstorm_vi: ../reports/brainstorm-2026-05-09-wanmeivn-apex-deploy-vi.md
handoff: ../../docs/handoff-260509-0308-wanmeivn-apex-to-vps40.md
blockedBy: []
blocks: []
---

# Plan: Deploy `wanmeivn.com` Apex on VPS .40

## Goal
Serve `wanmeivn.com` + `www.wanmeivn.com` from VPS `160.191.3.40` over HTTPS using Caddy for Windows + Let's Encrypt, without disturbing `tieu3q.wanmeivn.com` on `.13`.

## Stack (locked by team)
- Web server: **Caddy for Windows** (single binary, runs as Windows Service)
- TLS: **HTTP-01** via Let's Encrypt (auto by Caddy)
- `www` policy: **301 → apex**
- HSTS: **on, WITHOUT `includeSubDomains`** (separation principle per boss directive)

## Phases

| # | Phase | Status | Effort | Deps |
|---|---|---|---|---|
| 1 | [Caddy install + IP test on .40](phase-01-caddy-install-and-ip-test.md) | pending | 1h | — |
| 2 | [DNS prep (TTL drop, pre-flight checks)](phase-02-dns-prep.md) | pending | 30m | 1 |
| 3 | [DNS flip at registrar](phase-03-dns-flip.md) | pending | 15m | 2 |
| 4 | [Cert issuance + production Caddyfile](phase-04-cert-issuance.md) | pending | 30m | 3 |
| 5 | [Verification (DNS + TLS + game intact)](phase-05-verify.md) | pending | 30m | 4 |
| 6 | [Hardening (Service + cleanup)](phase-06-hardening.md) | pending | 30m | 5 |

**Total est:** ~3h 15m wall-clock (most idle waiting for DNS propagation + ACME).

## Dependencies (external)

- dnspro.vn panel access (have password)
- Game team availability for DNS flip coordination + post-flip smoke test
- Cloud provider's ACL (if any) must allow inbound :80 + :443 to .40

## Success criteria
- `https://wanmeivn.com` → 200 with valid LE cert + full styled homepage
- `https://www.wanmeivn.com` → 301 → apex
- `https://tieu3q.wanmeivn.com` continues to work (game team confirms)
- Caddy survives reboot (Windows Service auto-starts)
- All Phase 5 verification checks pass

## Rollback
DNS flip is the highest-cost rollback. With TTL=300 set in Phase 2, full rollback = revert `@` A record to `160.191.3.13`, delete new `www` A record, stop Caddy on .40, close firewall ports. Total: ~10 min + propagation. Tieu3q is never touched, so game stays online throughout.

## Open items (non-blocking)
- Windows Server 2019 **Datacenter Evaluation** edition — license question for ops/owner; not in scope here.
- Future game subdomain naming convention — deferred per boss.
