import { getSeasonSchedule, getLapTimes } from '../ergast-api.js';

const DEFAULT_DRIVER_ID = 'piastri';
const DEFAULT_SEASON = new Date().getFullYear();

const parseEventDate = (dateStr, timeStr) => {
  if (!dateStr) return null;
  const timeValue = timeStr || '00:00:00Z';
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(timeValue);
  const isoString = hasTimezone ? `${dateStr}T${timeValue}` : `${dateStr}T${timeValue}Z`;
  const parsed = new Date(isoString);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

async function verifyLapTimes({ season, driverId }) {
  console.log(`Verifying lap times for ${driverId} in season ${season}...`);

  let schedule;
  try {
    schedule = await getSeasonSchedule(season);
  } catch (error) {
    console.error('Failed to load season schedule:', error);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(schedule) || schedule.length === 0) {
    console.error('No races found in schedule.');
    process.exitCode = 1;
    return;
  }

  const now = new Date();
  const completedRounds = schedule
    .filter((race) => {
      const raceDate = parseEventDate(race.date, race.time);
      return raceDate ? raceDate <= now : false;
    })
    .sort((a, b) => parseInt(a.round, 10) - parseInt(b.round, 10));

  if (completedRounds.length === 0) {
    console.warn('No completed rounds yet for this season.');
    return;
  }

  const missing = [];
  const anomalies = [];

  for (const race of completedRounds) {
    try {
      const laps = await getLapTimes(season, race.round, driverId);
      const lapCount = Array.isArray(laps) ? laps.length : 0;
      console.log(`Round ${race.round.padStart?.(2, '0') ?? race.round} - ${race.raceName}: ${lapCount} laps`);
      if (lapCount === 0) {
        missing.push({ round: race.round, name: race.raceName });
        continue;
      }

      const lapNumbers = laps.map((lap) => lap?.lap).filter((lap) => Number.isFinite(lap));
      const uniqueLapNumbers = new Set(lapNumbers);
      const hasDuplicates = uniqueLapNumbers.size !== lapNumbers.length;
      const isSorted = lapNumbers.every((lap, index) => index === 0 || lap > lapNumbers[index - 1]);

      if (hasDuplicates || !isSorted) {
        anomalies.push({
          round: race.round,
          name: race.raceName,
          duplicates: hasDuplicates,
          sorted: isSorted,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch lap times for round ${race.round}:`, error);
      missing.push({ round: race.round, name: race.raceName, error: true });
    }
  }

  if (missing.length > 0) {
    console.error('\nMissing lap data for:');
    missing.forEach((race) => {
      console.error(` - Round ${race.round}: ${race.name}${race.error ? ' (fetch error)' : ''}`);
    });
    process.exitCode = 1;
  }

  if (anomalies.length > 0) {
    console.error('\nLap data ordering issues detected:');
    anomalies.forEach((race) => {
      const problems = [];
      if (race.duplicates) problems.push('duplicate laps');
      if (!race.sorted) problems.push('out of order');
      console.error(` - Round ${race.round}: ${race.name} (${problems.join(', ')})`);
    });
    process.exitCode = 1;
  } else {
    console.log('\nAll completed rounds have orderly lap data for the selected driver.');
  }
}

const [, , seasonArg, driverArg] = process.argv;
const season = seasonArg ? parseInt(seasonArg, 10) : DEFAULT_SEASON;
const driverId = driverArg || DEFAULT_DRIVER_ID;

if (!Number.isFinite(season)) {
  console.error(`Invalid season provided: ${seasonArg}`);
  process.exit(1);
}

verifyLapTimes({ season, driverId }).catch((error) => {
  console.error('Unexpected error verifying lap times:', error);
  process.exitCode = 1;
});
