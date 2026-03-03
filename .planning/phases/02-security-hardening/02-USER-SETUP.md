# Phase 02: User Setup Required

**Generated:** 2026-03-03
**Phase:** 02-security-hardening
**Status:** Incomplete

Complete these items for Upstash Redis rate limiting to function. Claude automated everything possible; these items require human access to external dashboards/accounts.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `UPSTASH_REDIS_REST_URL` | Upstash Console → Create Database → REST API tab → UPSTASH_REDIS_REST_URL | `.env.local` |
| [ ] | `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Create Database → REST API tab → UPSTASH_REDIS_REST_TOKEN | `.env.local` |

## Account Setup

- [ ] **Create Upstash account** (if needed)
  - URL: https://console.upstash.com/
  - Skip if: Already have Upstash account

## Dashboard Configuration

- [ ] **Create a Redis database**
  - Location: https://console.upstash.com/ → Create Database
  - Region: Select region closest to Vercel deployment
  - Copy REST API URL and Token from the REST API tab

## Verification

After completing setup:

```bash
# Check env vars are set
grep UPSTASH .env.local

# Verify build passes
npm run build

# Test rate limiting (start dev server first, then send 16 rapid requests)
for i in $(seq 1 16); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"hi"}]}]}'
done
```

Expected: First 15 return 200, request 16 returns 429.

---

**Once all items complete:** Mark status as "Complete" at top of file.
