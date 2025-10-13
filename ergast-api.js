// Ergast API Client for F1 Data
// Using Jolpi mirror: https://api.jolpi.ca/ergast/f1

import {
  TEAM_COLORS as SHARED_TEAM_COLORS,
  TEAM_LOGOS as SHARED_TEAM_LOGOS,
  getTeamColor as resolveTeamColor,
  getTeamLogoUrl as resolveTeamLogoUrl
} from './theme.js';

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Cache for API responses
const cache = new Map();

const MIN_REQUEST_INTERVAL = 750; // ms between calls to avoid bursts
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY = 1000; // ms
const LAP_TIME_PAGE_SIZE = 200;
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
export async function getLapTimes(season, round, driverId) {
  const cacheKey = `lap-times-${season}-${round}-${driverId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }

  const parseLapResponse = (data) => {
    const race = data?.MRData?.RaceTable?.Races?.[0];
    if (!race || !race.Laps) return [];

    return race.Laps.map((lap) => ({
      lap: lap.number,
      time: lap.Timings[0].time,
    }));
  };

  const fetchLapPage = async (offset) => {
    const url = `${ERGAST_BASE_URL}/${season}/${round}/drivers/${driverId}/laps.json?limit=${LAP_TIME_PAGE_SIZE}&offset=${offset}`;

    try {
      const response = await fetchWithRateLimit(url);
      const data = await response.json();
      const total = parseInt(data?.MRData?.total ?? '0', 10);
      return {
        laps: parseLapResponse(data),
        total: Number.isNaN(total) ? 0 : total,
        success: true,
      };
    } catch (error) {
      console.error(`Error fetching lap times for ${driverId} round ${round} (offset ${offset}):`, error);
      return {
        laps: [],
        total: null,
        success: false,
      };
    }
  };

  const aggregatedLaps = [];
  let totalLaps = null;
  let offset = 0;
  let hadSuccessfulPage = false;

  while (totalLaps === null || offset < totalLaps) {
    const { laps, total, success } = await fetchLapPage(offset);

    if (!success) {
      break;
    }

    hadSuccessfulPage = true;
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

  if (hadSuccessfulPage) {
    cache.set(cacheKey, { data: aggregatedLaps, timestamp: Date.now() });
  }

  return aggregatedLaps;
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
