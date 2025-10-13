# Lap Time Data Updates Overview

This document summarizes the recent changes to lap-time handling and their impact on data reliability and performance.

## Node-only curl fallback
- `ergast-api.js` now detects network-unreachable errors (`ENETUNREACH`, `EHOSTUNREACH`) when `fetch` fails in Node runtimes.
- When such an error is caught, the client reruns the request through `curl`, reusing the existing caching layer by wrapping the response in a `Response` object.
- Browser bundles are unaffected because the fallback only initializes when `process.versions.node` is available.

## Paginated lap aggregation
- Lap requests now load race-wide lap snapshots (up to 2000 timing entries per page) and split them into per-driver arrays locally.
- Partial responses are cached only after a successful page fetch so repeated verification runs avoid redundant network trips.
- Errors per page are logged and break the loop to prevent infinite retries while still returning any laps that were already retrieved.

## Rate limiting & retries
- A 750ms minimum interval between requests protects against rate limiting bursts.
- Automatic exponential backoff retries handle HTTP 429/503/504 responses and other transient fetch failures.

## Verification script
- `scripts/verify-lap-times.js` enumerates each completed round in the selected season and confirms lap coverage for the driver, logging any gaps.
- This script runs sequentially against the race calendar, benefiting from the caching improvements described above.

## Performance expectations
- Sequential pagination means a full season verification can still take several seconds, but cached results make subsequent runs fast.
- When the hosting environment blocks outbound traffic altogether, the curl fallback will also fail. In that case the verification script reports the connectivity issue rather than silently treating it as missing lap data.
