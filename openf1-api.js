// OpenF1 API Client for F1 Data
// Using OpenF1 API: https://openf1.org/

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

// Cache for API responses
const cache = new Map();

// OpenF1 has very permissive rate limits - no throttling needed for maximum speed
async function fetchWithRateLimit(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
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

// Get session key for a specific year and round
// This maps Ergast year/round to OpenF1 session_key
export async function getSessionKey(year, round) {
  const cacheKey = `session-${year}-${round}`;

  try {
    // Get all race sessions for the year
    const url = `${OPENF1_BASE_URL}/sessions?year=${year}&session_name=Race`;
    const sessions = await fetchWithCache(url, `sessions-${year}`, 3600000);

    // Sort by date and get the session for this round
    const sortedSessions = sessions.sort((a, b) =>
      new Date(a.date_start) - new Date(b.date_start)
    );

    // Round is 1-indexed, array is 0-indexed
    const session = sortedSessions[parseInt(round) - 1];

    if (!session) {
      console.warn(`No session found for ${year} round ${round}`);
      return null;
    }

    return session.session_key;
  } catch (error) {
    console.error(`Error getting session key for ${year} round ${round}:`, error);
    return null;
  }
}

// Get lap times for all drivers in a session
// Returns Map<driver_number, Array<laps>>
export async function getAllLapTimes(sessionKey) {
  const cacheKey = `all-laps-${sessionKey}`;

  try {
    const url = `${OPENF1_BASE_URL}/laps?session_key=${sessionKey}`;
    const laps = await fetchWithCache(url, cacheKey, 3600000);

    // Group by driver number
    const lapsByDriver = new Map();

    for (const lap of laps) {
      if (!lap.lap_duration) continue; // Skip laps without duration

      const driverNum = lap.driver_number;
      if (!lapsByDriver.has(driverNum)) {
        lapsByDriver.set(driverNum, []);
      }

      lapsByDriver.get(driverNum).push({
        lap: lap.lap_number,
        time: formatLapTime(lap.lap_duration), // Convert seconds to mm:ss.sss
        duration: lap.lap_duration,
        sector1: lap.duration_sector_1,
        sector2: lap.duration_sector_2,
        sector3: lap.duration_sector_3,
        isPitLap: lap.is_pit_out_lap
      });
    }

    // Sort each driver's laps by lap number
    for (const [driverNum, driverLaps] of lapsByDriver) {
      driverLaps.sort((a, b) => a.lap - b.lap);
    }

    return lapsByDriver;
  } catch (error) {
    console.error(`Error fetching all lap times for session ${sessionKey}:`, error);
    return new Map();
  }
}

// Get drivers for a session with their details
export async function getSessionDrivers(sessionKey) {
  const cacheKey = `drivers-${sessionKey}`;

  try {
    const url = `${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`;
    const drivers = await fetchWithCache(url, cacheKey, 3600000);

    return drivers;
  } catch (error) {
    console.error(`Error fetching drivers for session ${sessionKey}:`, error);
    return [];
  }
}

// Format lap time from seconds to mm:ss.sss
function formatLapTime(seconds) {
  if (!seconds) return null;

  const minutes = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);

  return `${minutes}:${secs.padStart(6, '0')}`;
}

// Map driver number to Ergast driverId (best effort)
// OpenF1 uses driver numbers, Ergast uses driver IDs
export function mapDriverNumberToErgastId(driverNumber, sessionDrivers, ergastResults) {
  // Try to find driver in session drivers
  const sessionDriver = sessionDrivers.find(d => d.driver_number === driverNumber);

  if (!sessionDriver) return null;

  // Try to match by last name
  const lastName = sessionDriver.last_name.toLowerCase();
  const ergastDriver = ergastResults.find(result =>
    result.Driver.familyName.toLowerCase() === lastName
  );

  return ergastDriver?.Driver.driverId || null;
}

// Clear cache (useful for forcing refresh)
export function clearCache() {
  cache.clear();
}
