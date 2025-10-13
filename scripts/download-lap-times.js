#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    getDriverStandings,
    getSeasonSchedule,
    getRaceResults,
    getLapTimesBatch
} from '../ergast-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, '../public/laps');
const DEFAULT_SEASON = new Date().getFullYear().toString();

const seasonArg = process.argv[2];
const seasons = seasonArg ? seasonArg.split(',') : [DEFAULT_SEASON];

async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}

async function writeJSON(filePath, data) {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function padRound(round) {
    return String(round).padStart(2, '0');
}

async function downloadSeasonLapTimes(season) {
    console.log(`\n=== Downloading lap times for season ${season} ===`);

    const standings = await getDriverStandings(season);
    const topSeasonIds = (standings || [])
        .slice(0, Math.min(5, standings.length))
        .map(entry => entry.Driver.driverId);

    const schedule = await getSeasonSchedule(season);

    for (const race of schedule) {
        const round = race.round;
        const roundPad = padRound(round);
        const raceKey = `${season}-${roundPad}`;

        console.log(`\nProcessing ${raceKey} - ${race.raceName}`);

        const raceResultData = await getRaceResults(season, round);
        const raceResults = raceResultData?.Results || [];
        const raceDriverIds = raceResults.map(result => result.Driver.driverId);
        const combinedIds = Array.from(new Set([...topSeasonIds, ...raceDriverIds]));

        const limitCount = Math.max(1, combinedIds.length);
        const driverIds = combinedIds.slice(0, limitCount);

        const lapResults = await getLapTimesBatch(
            season,
            round,
            driverIds,
            null,
            raceResults
        );

        const resultLookup = new Map(
            raceResults.map(result => [result.Driver.driverId, result])
        );
        const standingsLookup = new Map(
            standings.map(entry => [entry.Driver.driverId, entry.Driver])
        );

        const driverEntries = [];

        for (const driverId of driverIds) {
            const lapResult = lapResults.find(entry => entry.driverId === driverId) || {
                laps: [],
                error: 'not_fetched'
            };
            const raceResult = resultLookup.get(driverId);
            const driverInfo = raceResult?.Driver || standingsLookup.get(driverId) || {
                driverId,
                givenName: driverId,
                familyName: ''
            };
            const constructorInfo =
                raceResult?.Constructor ||
                (raceResult?.Constructors ? raceResult.Constructors[0] : null) || {
                    constructorId: driverId,
                    name: 'Unknown'
                };

            const driverFile = `${raceKey}-${driverId}.json`;
            const driverOutputPath = path.join(OUTPUT_DIR, driverFile);

            await writeJSON(driverOutputPath, {
                season,
                round,
                raceName: race.raceName,
                driver: driverInfo,
                constructor: constructorInfo,
                laps: lapResult.laps || [],
                lapError: lapResult.error || null
            });

            driverEntries.push({
                driverId,
                driver: driverInfo,
                constructor: constructorInfo,
                hasLapData: (lapResult.laps || []).length > 0,
                lapError: lapResult.error || null,
                file: driverFile
            });
        }

        const raceIndexPath = path.join(OUTPUT_DIR, `${raceKey}.json`);
        await writeJSON(raceIndexPath, {
            season,
            round,
            raceName: race.raceName,
            circuitId: race.Circuit?.circuitId,
            drivers: driverEntries
        });

        console.log(`Saved lap data for ${driverEntries.length} drivers -> ${raceKey}.json`);
    }
}

try {
    await ensureDir(OUTPUT_DIR);
    for (const season of seasons) {
        await downloadSeasonLapTimes(season.trim());
    }
    console.log('\nLap time snapshots downloaded successfully.');
} catch (error) {
    console.error('Failed to download lap time snapshots:', error);
    process.exit(1);
}
