// Ergast API Client for F1 Data
// Using Jolpi mirror: https://api.jolpi.ca/ergast/f1

import {
  TEAM_COLORS as SHARED_TEAM_COLORS,
  TEAM_LOGOS as SHARED_TEAM_LOGOS,
  getTeamColor as resolveTeamColor,
  getTeamLogoUrl as resolveTeamLogoUrl
} from './theme';

const ERGAST_BASE_URL = 'https://api.jolpi.ca/ergast/f1';

// Cache for API responses
const cache = new Map();

// Helper to fetch with caching
async function fetchWithCache(url, cacheKey, cacheDuration = 3600000) {
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

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
    try {
        const url = `${ERGAST_BASE_URL}/${season}/${round}/drivers/${driverId}/laps.json?limit=1000`;
        const data = await fetchWithCache(url, `lap-times-${season}-${round}-${driverId}`, 3600000);
        
        const race = data.MRData.RaceTable.Races[0];
        if (!race || !race.Laps) return [];
        
        return race.Laps.map(lap => ({
            lap: lap.number,
            time: lap.Timings[0].time
        }));
    } catch (error) {
        console.error('Error fetching lap times:', error);
        return [];
    }
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
