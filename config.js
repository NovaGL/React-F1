// Centralized configuration values for the React F1 dashboard.
// Adjust these constants to tweak app behaviour without touching component logic.

// Lap time analysis tuning
// ---------------------------------------------------------------------------
// Total number of drivers to expose in the lap time selector (capped at this value)
export const LAP_TIME_DRIVER_LIMIT = 20;
// How many drivers to prefetch lap data for when the chart loads (helps avoid rate limits)
export const LAP_TIME_PREFETCH_COUNT = 10;
// How many drivers to auto-select once data is loaded
export const LAP_TIME_AUTO_SELECT_COUNT = 5;
// Delay (milliseconds) between on-demand lap time requests when queueing multiple fetches
export const LAP_TIME_REQUEST_DELAY_MS = 250;

// Ergast fallback batching configuration
// ---------------------------------------------------------------------------
// Number of concurrent API requests for lap times (only used for Ergast fallback)
// Higher = faster loading. OpenF1 doesn't use this (fetches all at once).
export const CONCURRENT_LAP_REQUESTS = 5;
