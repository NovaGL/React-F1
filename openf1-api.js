const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes by default
const MIN_REQUEST_INTERVAL = 300; // ms between OpenF1 requests
let lastRequestTimestamp = 0;

const DRIVER_NUMBER_MAP = new Map([
  ['albon', 23],
  ['alonso', 14],
  ['bearman', 87],
  ['bottas', 77],
  ['de_vries', 21],
  ['doohan', 18],
  ['gasly', 10],
  ['hamilton', 44],
  ['hulkenberg', 27],
  ['kevin_magnussen', 20],
  ['lawson', 40],
  ['leclerc', 16],
  ['max_verstappen', 1],
  ['norris', 4],
  ['ocon', 31],
  ['perez', 11],
  ['piastri', 81],
  ['ricciardo', 3],
  ['russell', 63],
  ['sainz', 55],
  ['sargeant', 2],
  ['stroll', 18],
  ['tsunoda', 22],
  ['zhou', 24],
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function enforceRateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestTimestamp;
  if (elapsed < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - elapsed);
  }
  lastRequestTimestamp = Date.now();
}

function buildUrl(path, params = {}) {
  const url = new URL(`${OPENF1_BASE_URL}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, value);
  }
  return url;
}

async function fetchJson(path, params = {}, { cacheKey, ttl = CACHE_TTL } = {}) {
  const url = buildUrl(path, params);
  const finalCacheKey = cacheKey || url.toString();
  const cached = cache.get(finalCacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  await enforceRateLimit();

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'React-F1 Dashboard (openf1 fallback)',
    },
  });

  if (!response.ok) {
    const error = new Error(`OpenF1 API error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  cache.set(finalCacheKey, { data, timestamp: Date.now(), ttl });
  return data;
}

async function resolveSessionKey(season, round) {
  try {
    const sessions = await fetchJson('sessions', {
      year: season,
      session_type: 'R',
      round,
      limit: 5,
    }, { cacheKey: `sessions-${season}-${round}`, ttl: 60 * 60 * 1000 });

    if (Array.isArray(sessions) && sessions.length > 0) {
      const raceSession = sessions.find((session) => session.session_type === 'R');
      return (raceSession || sessions[0]).session_key;
    }
  } catch (error) {
    console.warn(`Failed to resolve OpenF1 session for ${season} round ${round}:`, error);
  }
  return null;
}

async function resolveDriverNumber(driverId, season) {
  const normalized = typeof driverId === 'string' ? driverId.toLowerCase() : '';
  if (!normalized) return null;

  try {
    const drivers = await fetchJson('drivers', {
      year: season,
      driver_ref: normalized,
      limit: 5,
    }, { cacheKey: `driver-${season}-${normalized}`, ttl: 24 * 60 * 60 * 1000 });

    if (Array.isArray(drivers) && drivers.length > 0) {
      const match = drivers.find((driver) =>
        driver?.driver_ref?.toLowerCase() === normalized ||
        driver?.driver_id?.toLowerCase() === normalized ||
        driver?.last_name?.toLowerCase() === normalized
      );

      const target = match || drivers[0];
      if (target?.driver_number != null) {
        const parsedNumber = Number.parseInt(target.driver_number, 10);
        if (Number.isFinite(parsedNumber)) {
          return parsedNumber;
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to resolve OpenF1 driver number for ${driverId}:`, error);
  }

  if (DRIVER_NUMBER_MAP.has(normalized)) {
    return DRIVER_NUMBER_MAP.get(normalized);
  }

  // Some Ergast IDs include underscores, try using the last segment as a fallback key
  if (normalized.includes('_')) {
    const fallbackKey = normalized.split('_').pop();
    if (fallbackKey && DRIVER_NUMBER_MAP.has(fallbackKey)) {
      return DRIVER_NUMBER_MAP.get(fallbackKey);
    }
  }

  return null;
}

function formatLapDuration(value) {
  if (value == null) return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalMilliseconds = Math.round(value * 1000);
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = totalMilliseconds % 1000;
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Already formatted as mm:ss.mmm
    if (/^\d+:\d{2}\.\d{3}$/.test(trimmed)) {
      return trimmed;
    }

    const numeric = Number.parseFloat(trimmed);
    if (Number.isFinite(numeric)) {
      return formatLapDuration(numeric);
    }
  }

  return null;
}

export async function getLapTimesFromOpenF1(season, round, driverId) {
  try {
    const [sessionKey, driverNumber] = await Promise.all([
      resolveSessionKey(season, round),
      resolveDriverNumber(driverId, season),
    ]);

    if (!sessionKey || !driverNumber) {
      return [];
    }

    const laps = await fetchJson('laps', {
      session_key: sessionKey,
      driver_number: driverNumber,
      select: 'lap_number,lap_duration,lap_time',
      order: 'lap_number.asc',
      limit: 1000,
    }, { cacheKey: `laps-${sessionKey}-${driverNumber}`, ttl: 60 * 60 * 1000 });

    if (!Array.isArray(laps)) {
      return [];
    }

    return laps
      .map((lap) => {
        const lapNumber = Number.parseInt(lap?.lap_number, 10);
        if (!Number.isFinite(lapNumber)) {
          return null;
        }

        const duration = formatLapDuration(
          lap?.lap_duration ?? lap?.lap_time ?? null,
        );

        if (!duration) {
          return null;
        }

        return { lap: lapNumber, time: duration };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn(`OpenF1 lap fallback failed for ${season} round ${round}:`, error);
    return [];
  }
}

export function clearOpenF1Cache() {
  cache.clear();
}
