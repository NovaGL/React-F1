// Ergast API Client for F1 Data
// Using Jolpi mirror: https://api.jolpi.ca/ergast/f1

import {
  TEAM_COLORS as SHARED_TEAM_COLORS,
  TEAM_LOGOS as SHARED_TEAM_LOGOS,
  getTeamColor as resolveTeamColor,
  getTeamLogoUrl as resolveTeamLogoUrl
} from './theme.js';

import { CONCURRENT_LAP_REQUESTS as CONFIGURED_CONCURRENT_REQUESTS } from './config.js';
import * as OpenF1 from './openf1-api.js';

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Cache for API responses
const cache = new Map();

const MIN_REQUEST_INTERVAL = 500; // ms between calls (reduced for parallel fetching)
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 2000; // ms
const LAP_TIME_PAGE_SIZE = 200;
const LAP_TIME_RETRY_DELAY = 3000; // ms delay specifically for lap time retries
const CONCURRENT_LAP_REQUESTS = CONFIGURED_CONCURRENT_REQUESTS || 3; // Number of parallel lap time requests
let lastRequestTimestamp = 0;

const NETWORK_UNREACHABLE_CODES = new Set(['ENETUNREACH', 'EHOSTUNREACH']);

function isNetworkUnreachable(error) {
  if (!error) return false;
  const code = error.code || error?.cause?.code;
  return code ? NETWORK_UNREACHABLE_CODES.has(code) : false;
}

let execFileAsync;
async function ensureExecFileAsync() {
  if (execFileAsync) {
    return execFileAsync;
  }

  if (typeof process === 'undefined' || !process?.versions?.node) {
    throw new Error('curl fallback is only available in a Node.js environment');
  }

  const [{ execFile }, { promisify }] = await Promise.all([
    import('node:child_process'),
    import('node:util')
  ]);

  execFileAsync = promisify(execFile);
  return execFileAsync;
}

async function fetchViaCurl(url, options = {}) {
  const runExecFile = await ensureExecFileAsync();
  const args = ['-sS', '-w', '\n%{http_code}\n'];

  if (options.method && options.method !== 'GET') {
    args.push('-X', options.method);
  }

  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      if (typeof value === 'undefined') continue;
      args.push('-H', `${key}: ${value}`);
    }
  }

  if (options.body) {
    const body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    args.push('--data-binary', body);
  }

  args.push(url);

  const { stdout } = await runExecFile('curl', args, { maxBuffer: 15 * 1024 * 1024 });
  const trimmed = stdout.trimEnd();
  const lastNewlineIndex = trimmed.lastIndexOf('\n');

  if (lastNewlineIndex === -1) {
    throw new Error('Unexpected curl response format');
  }

  const statusCodeStr = trimmed.slice(lastNewlineIndex + 1);
  const status = Number.parseInt(statusCodeStr, 10);
  const body = trimmed.slice(0, lastNewlineIndex);

  if (!Number.isFinite(status)) {
    throw new Error(`Invalid status code from curl: ${statusCodeStr}`);
  }

  const response = new Response(body, {
    status,
    headers: new Headers(),
  });

  return response;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enforceRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTimestamp;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - elapsed);
  }
  lastRequestTimestamp = Date.now();
}

async function fetchWithRateLimit(url, options, attempt = 0) {
  await enforceRateLimit();

  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (isNetworkUnreachable(error)) {
      console.warn(`Network unreachable via fetch, falling back to curl for ${url}`);
      try {
        response = await fetchViaCurl(url, options);
      } catch (curlError) {
        console.warn(`curl fallback failed for ${url}:`, curlError);
        throw error;
      }
    } else if (attempt < MAX_RETRY_ATTEMPTS) {
      await sleep(BASE_RETRY_DELAY * Math.pow(2, attempt));
      return fetchWithRateLimit(url, options, attempt + 1);
    } else {
      throw error;
    }
  }

  if (response.status === 429) {
    if (attempt >= MAX_RETRY_ATTEMPTS) {
      const error = new Error('API rate limit exceeded (429)');
      error.status = 429;
      throw error;
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryDelay = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : BASE_RETRY_DELAY * Math.pow(2, attempt);
    await sleep(Number.isFinite(retryDelay) ? retryDelay : BASE_RETRY_DELAY);
    return fetchWithRateLimit(url, options, attempt + 1);
  }

  if (!response.ok) {
    if ((response.status === 503 || response.status === 504) && attempt < MAX_RETRY_ATTEMPTS) {
      await sleep(BASE_RETRY_DELAY * Math.pow(2, attempt));
      return fetchWithRateLimit(url, options, attempt + 1);
    }

    const error = new Error(`API Error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response;
}

// Helper to fetch with caching
async function fetchWithCache(url, cacheKey, cacheDuration = 3600000) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data;
  }

  const response = await fetchWithRateLimit(url);

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Get current season schedule
export async function getCurrentSchedule() {
  const url = `${ERGAST_BASE_URL}/current.json`;
  const data = await fetchWithCache(url, 'current-schedule', 3600000);
  return data.MRData.RaceTable.Races;
}

// Get specific season schedule
export async function getSeasonSchedule(year) {
  const url = `${ERGAST_BASE_URL}/${year}.json`;
  const data = await fetchWithCache(url, `schedule-${year}`, 3600000);
  return data.MRData.RaceTable.Races;
}

// Get current driver standings
export async function getDriverStandings(year = 'current') {
  const url = `${ERGAST_BASE_URL}/${year}/driverStandings.json`;
  const data = await fetchWithCache(url, `driver-standings-${year}`, 1800000);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
}

export async function getDriverStandingsByRound(year, round) {
  const cacheKey = `driver-standings-${year}-${round}`;
  const url = `${ERGAST_BASE_URL}/${year}/${round}/driverStandings.json`;
  const data = await fetchWithCache(url, cacheKey, 1800000);
  return data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
}

// Get current constructor standings
export async function getConstructorStandings(year = 'current') {
  const url = `${ERGAST_BASE_URL}/${year}/constructorStandings.json`;
  const data = await fetchWithCache(url, `constructor-standings-${year}`, 1800000);
  return data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
}

// Get last race results
export async function getLastRaceResults() {
  const url = `${ERGAST_BASE_URL}/current/last/results.json`;
  const data = await fetchWithCache(url, 'last-race-results', 300000); // 5 min cache
  return data.MRData.RaceTable.Races[0];
}

// Get specific race results
export async function getRaceResults(year, round) {
  const url = `${ERGAST_BASE_URL}/${year}/${round}/results.json`;
  const data = await fetchWithCache(url, `race-results-${year}-${round}`, 3600000);
  return data.MRData.RaceTable.Races[0];
}

// Get qualifying results
export async function getQualifyingResults(year, round) {
  const url = `${ERGAST_BASE_URL}/${year}/${round}/qualifying.json`;
  const data = await fetchWithCache(url, `qualifying-${year}-${round}`, 3600000);
  return data.MRData.RaceTable.Races[0];
}

// Get sprint results
export async function getSprintResults(year, round) {
  const url = `${ERGAST_BASE_URL}/${year}/${round}/sprint.json`;
  const data = await fetchWithCache(url, `sprint-${year}-${round}`, 3600000);
  return data.MRData.RaceTable.Races[0];
}
// Get lap times for a specific driver in a race
// Returns { laps: Array, error: String|null, total: Number }
export async function getLapTimes(season, round, driverId, retryAttempt = 0) {
  const cacheKey = `lap-times-${season}-${round}-${driverId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return { laps: cached.data, error: null, total: cached.data.length };
  }

  const parseLapResponse = (data) => {
    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race || !race.Laps) return [];

    return race.Laps.map((lap) => ({
      lap: lap.number,
      time: lap.Timings[0].time,
    }));
  };

  const fetchLapPage = async (offset, pageRetryAttempt = 0) => {
    const url = `${ERGAST_BASE_URL}/${season}/${round}/drivers/${driverId}/laps.json?limit=${LAP_TIME_PAGE_SIZE}&offset=${offset}`;

    try {
      const response = await fetchWithRateLimit(url);
      const data = await response.json();
      const total = parseInt(data?.MRData?.total ?? '0', 10);
      return {
        laps: parseLapResponse(data),
        total: Number.isNaN(total) ? 0 : total,
        success: true,
        error: null
      };
    } catch (error) {
      // If rate limited and we have retries left, wait longer and retry
      if (error.status === 429 && pageRetryAttempt < 2) {
        console.warn(`Rate limited fetching ${driverId} laps, retrying after delay...`);
        await sleep(LAP_TIME_RETRY_DELAY * (pageRetryAttempt + 1));
        return fetchLapPage(offset, pageRetryAttempt + 1);
      }

      console.error(`Error fetching lap times for ${driverId} round ${round} (offset ${offset}):`, error.message || error);
      return {
        laps: [],
        total: null,
        success: false,
        error: error.status === 429 ? 'rate_limited' : 'fetch_failed'
      };
    }
  };

  const aggregatedLaps = [];
  let totalLaps = null;
  let offset = 0;
  let hadSuccessfulPage = false;
  let lastError = null;
  const MAX_ITERATIONS = 20; // Safety: prevent infinite loops (20 * 200 = 4000 laps max)
  let iterations = 0;

  while (totalLaps === null || offset < totalLaps) {
    // SAFETY CHECK: Prevent infinite loops
    if (iterations++ >= MAX_ITERATIONS) {
      console.error(`Maximum iterations reached for ${driverId}, breaking to prevent infinite loop`);
      break;
    }

    const { laps, total, success, error } = await fetchLapPage(offset);

    if (!success) {
      lastError = error;
      // If we got at least some data, return what we have
      if (hadSuccessfulPage && aggregatedLaps.length > 0) {
        console.warn(`Partial lap data for ${driverId}: ${aggregatedLaps.length}/${totalLaps || '?'} laps`);
        break;
      }
      // If this is the first page and we're rate limited, try one more time with longer delay
      if (error === 'rate_limited' && retryAttempt === 0) {
        console.warn(`Rate limited on first page for ${driverId}, retrying entire fetch...`);
        await sleep(LAP_TIME_RETRY_DELAY * 2);
        return getLapTimes(season, round, driverId, 1);
      }
      break;
    }

    hadSuccessfulPage = true;
    lastError = null;

    if (totalLaps === null) {
      totalLaps = total;
    }

    if (laps.length === 0) {
      break;
    }

    aggregatedLaps.push(...laps);
    offset += LAP_TIME_PAGE_SIZE;

    if (aggregatedLaps.length >= totalLaps) {
      break;
    }
  }

  // Cache even partial or empty results to avoid refetching
  if (hadSuccessfulPage || totalLaps === 0) {
    cache.set(cacheKey, { data: aggregatedLaps, timestamp: Date.now() });
  }

  return {
    laps: aggregatedLaps,
    error: lastError,
    total: totalLaps || 0
  };
}

// Batch fetch lap times for multiple drivers with controlled concurrency
// Uses OpenF1 API if available (faster, no rate limits), falls back to Ergast
// Returns array of { driverId, laps, error, total }
export async function getLapTimesBatch(season, round, driverIds, onProgress = null, raceResults = null) {
  // Try OpenF1 first (much faster!)
  try {
    console.log(`Attempting to fetch lap times via OpenF1 API for ${season} round ${round}...`);
    const sessionKey = await OpenF1.getSessionKey(season, round);

    if (sessionKey) {
      console.log(`Found OpenF1 session_key: ${sessionKey}`);

      // Fetch all lap times and drivers in parallel
      const [allLapTimes, sessionDrivers] = await Promise.all([
        OpenF1.getAllLapTimes(sessionKey),
        OpenF1.getSessionDrivers(sessionKey)
      ]);

      // Map driver IDs to driver numbers and extract lap times
      const results = [];

      for (let i = 0; i < driverIds.length; i++) {
        const driverId = driverIds[i];

        // Find the driver number for this driverId
        const ergastDriver = raceResults?.find(r => r.Driver.driverId === driverId);
        if (!ergastDriver) {
          results.push({ driverId, laps: [], error: 'driver_not_found', total: 0 });
          if (onProgress) onProgress(i + 1, driverIds.length);
          continue;
        }

        // Try to find matching OpenF1 driver
        const lastName = ergastDriver.Driver.familyName.toLowerCase();
        const openF1Driver = sessionDrivers.find(d =>
          d.last_name.toLowerCase() === lastName
        );

        if (!openF1Driver) {
          results.push({ driverId, laps: [], error: 'driver_not_in_openf1', total: 0 });
          if (onProgress) onProgress(i + 1, driverIds.length);
          continue;
        }

        // Get lap times for this driver
        const laps = allLapTimes.get(openF1Driver.driver_number) || [];

        results.push({
          driverId,
          laps,
          error: laps.length === 0 ? 'no_data' : null,
          total: laps.length
        });

        if (onProgress) onProgress(i + 1, driverIds.length);
      }

      console.log(`OpenF1 fetch complete: ${results.filter(r => r.laps.length > 0).length}/${driverIds.length} drivers have lap data`);
      return results;
    }
  } catch (error) {
    console.warn('OpenF1 API failed, falling back to Ergast:', error.message || error);
  }

  // Fallback to Ergast API
  console.log('Using Ergast API for lap times (slower)...');
  const results = new Map();

  // Process in batches of CONCURRENT_LAP_REQUESTS
  for (let i = 0; i < driverIds.length; i += CONCURRENT_LAP_REQUESTS) {
    const batch = driverIds.slice(i, i + CONCURRENT_LAP_REQUESTS);

    const batchPromises = batch.map(async (driverId) => {
      const result = await getLapTimes(season, round, driverId);
      results.set(driverId, result);

      // Call progress callback if provided
      if (onProgress) {
        onProgress(results.size, driverIds.length);
      }

      return { driverId, ...result };
    });

    await Promise.all(batchPromises);
  }

  return driverIds.map(driverId => ({
    driverId,
    ...(results.get(driverId) || { laps: [], error: 'not_fetched', total: 0 })
  }));
}

// Get fastest laps for a specific race
export async function getFastestLaps(season, round) {
    try {
        const url = `${ERGAST_BASE_URL}/${season}/${round}/results.json`;
        const data = await fetchWithCache(url, `fastest-laps-${season}-${round}`, 3600000);

        const race = data.MRData.RaceTable.Races[0];
        if (!race || !race.Results) return [];

        // Filter results that have fastest lap data and sort by rank
        return race.Results
            .filter(result => result.FastestLap)
            .map(result => ({
                driver: result.Driver,
                constructor: result.Constructor,
                fastestLap: result.FastestLap
            }))
            .sort((a, b) => parseInt(a.fastestLap.rank) - parseInt(b.fastestLap.rank));
    } catch (error) {
        console.error('Error fetching fastest laps:', error);
        return [];
    }
}

// Get next race
export async function getNextRace() {
  const schedule = await getCurrentSchedule();
  const now = new Date();

  const nextRace = schedule.find(race => {
    const raceDate = new Date(race.date + 'T' + race.time);
    return raceDate > now;
  });

  return nextRace || schedule[schedule.length - 1]; // Return last race if season ended
}


// Get previous year's race at same circuit
export async function getPreviousYearRace(circuitId, currentYear) {
  const previousYear = currentYear - 1;
  const schedule = await getSeasonSchedule(previousYear);
  const race = schedule.find(r => r.Circuit.circuitId === circuitId);

  if (race) {
    const results = await getRaceResults(previousYear, race.round);
    return results;
  }

  return null;
}

// Clear cache (useful for forcing refresh)
export function clearCache() {
  cache.clear();
}

// Constructor team colors (for styling)
export const TEAM_COLORS = SHARED_TEAM_COLORS;

// Get team color by constructor ID
export function getTeamColor(constructorId) {
  return resolveTeamColor(constructorId, '#FFFFFF');
}

// Get driver headshot image URL
export function getDriverImage(driverId) {
  // Using F1 official media CDN for driver images
  return `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/${driverId.charAt(0).toUpperCase()}/${driverId}.png.transform/2col/image.png`;
}

// Team logo URLs (simple branded badges)
export const TEAM_LOGOS = SHARED_TEAM_LOGOS;

// Get team logo
export function getTeamLogo(constructorId) {
  return resolveTeamLogoUrl(constructorId) || SHARED_TEAM_LOGOS.haas;
}

export function getTeamLogoUrl(team, width) {
  return resolveTeamLogoUrl(team, width);
}

// Get constructor history (standings over multiple years)
export async function getConstructorHistory(constructorId, years = 5) {
  const currentYear = new Date().getFullYear();
  const history = [];

  for (let i = 0; i < years; i++) {
    const year = currentYear - i;
    try {
      const standings = await getConstructorStandings(year);
      const teamStanding = standings.find(s => s.Constructor.constructorId === constructorId);
      if (teamStanding) {
        history.push({
          year,
          position: parseInt(teamStanding.position),
          points: parseInt(teamStanding.points),
          wins: parseInt(teamStanding.wins)
        });
      }
    } catch (err) {
      console.error(`Error fetching ${year} history for ${constructorId}:`, err);
    }
  }

  return history.reverse(); // Oldest to newest
}

// Get a short driver biography/summary from Wikipedia (REST summary endpoint)
export async function getDriverSummary(givenName, familyName) {
  if (!givenName && !familyName) return null;

  const title = encodeURIComponent(`${givenName} ${familyName}`.trim().replace(/\s+/g, '_'));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
  const cacheKey = `driver-summary-${givenName}_${familyName}`;

  try {
    const data = await fetchWithCache(url, cacheKey, 24 * 60 * 60 * 1000); // cache 24h
    // The REST summary returns an object with `extract` (short summary)
    return data.extract || null;
  } catch (err) {
    // If direct title lookup fails, don't throw; return null to let caller fallback
    console.warn(`No wiki summary for ${givenName} ${familyName}:`, err.message || err);
    return null;
  }
}

// Use Ergast's driver records to discover the driver's Wikipedia URL (if present),
// then fetch the Wikipedia REST summary. Falls back to name-based lookup.
export async function getDriverSummaryById(driverId, season = 'current') {
  if (!driverId) return null;

  // Try to get the Ergast driver record for the season
  try {
    const url = `${ERGAST_BASE_URL}/${season}/drivers.json`;
    const data = await fetchWithCache(url, `drivers-${season}`, 24 * 60 * 60 * 1000);
    const drivers = data.MRData.DriverTable?.Drivers || [];
    const driver = drivers.find(d => (d.driverId && d.driverId.toLowerCase() === driverId.toLowerCase()) || (d.code && d.code.toLowerCase() === driverId.toLowerCase()));

    if (driver && driver.url) {
      const wikiUrl = driver.url;
      // Extract the page title from the Wikipedia URL
      const parts = wikiUrl.split('/');
      const title = decodeURIComponent(parts[parts.length - 1]);
      const wikiApi = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      try {
        const summaryData = await fetchWithCache(wikiApi, `wiki-${title}`, 24 * 60 * 60 * 1000);
        return summaryData.extract || null;
      } catch (err) {
        console.warn(`Failed to fetch wiki summary for ${title}:`, err.message || err);
        // fall through to name-based fallback
      }
    }
  } catch (err) {
    console.warn('Failed to lookup driver in Ergast drivers list:', err.message || err);
  }

  // Fallback: try name-based lookup if we can't find a URL
  return null;
}

// Return the Wikipedia URL for a driver from the Ergast driver record if available
export async function getDriverWikiUrlById(driverId, season = 'current') {
  if (!driverId) return null;
  try {
    const url = `${ERGAST_BASE_URL}/${season}/drivers.json`;
    const data = await fetchWithCache(url, `drivers-${season}`, 24 * 60 * 60 * 1000);
    const drivers = data.MRData.DriverTable?.Drivers || [];
    const driver = drivers.find(d => (d.driverId && d.driverId.toLowerCase() === driverId.toLowerCase()) || (d.code && d.code.toLowerCase() === driverId.toLowerCase()));
    if (driver && driver.url) return driver.url;
  } catch (err) {
    console.warn('Failed to lookup driver wiki url in Ergast drivers list:', err.message || err);
  }
  return null;
}

// Build a Wikipedia URL from a driver's name as a fallback (not guaranteed to be correct for ambiguous names)
export function buildWikiUrlForName(givenName, familyName) {
  if (!givenName && !familyName) return null;
  const title = `${givenName || ''} ${familyName || ''}`.trim().replace(/\s+/g, '_');
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}
