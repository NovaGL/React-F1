// F1 Analytics Module
// Comprehensive analytics with year-over-year comparisons and caching

import * as ErgastAPI from './ergast-api';

// Analytics cache with localStorage persistence
const CACHE_PREFIX = 'f1_analytics_';
const CACHE_DURATION = 3600000; // 1 hour

class AnalyticsCache {
    constructor() {
        this.memoryCache = new Map();
    }

    get(key) {
        // Check memory first
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }

        // Check localStorage
        try {
            const stored = localStorage.getItem(CACHE_PREFIX + key);
            if (stored) {
                const {data, timestamp} = JSON.parse(stored);
                if (Date.now() - timestamp < CACHE_DURATION) {
                    this.memoryCache.set(key, data);
                    return data;
                }
                localStorage.removeItem(CACHE_PREFIX + key);
            }
        } catch (e) {
            console.warn('Cache read error:', e);
        }
        return null;
    }

    set(key, data) {
        this.memoryCache.set(key, data);
        try {
            localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({
                data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Cache write error:', e);
        }
    }

    clear() {
        this.memoryCache.clear();
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }
}

const cache = new AnalyticsCache();

// Year-over-Year Driver Comparison
export async function getDriverYoYComparison(driverId, currentYear = new Date().getFullYear()) {
    const cacheKey = `driver_yoy_${driverId}_${currentYear}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [currentStandings, previousStandings] = await Promise.all([
            ErgastAPI.getDriverStandings(currentYear),
            ErgastAPI.getDriverStandings(currentYear - 1)
        ]);

        const currentDriver = currentStandings.find(d => d.Driver.driverId === driverId);
        const previousDriver = previousStandings.find(d => d.Driver.driverId === driverId);

        if (!currentDriver) return null;

        const comparison = {
            current: {
                year: currentYear,
                position: parseInt(currentDriver.position),
                points: parseInt(currentDriver.points),
                wins: parseInt(currentDriver.wins)
            },
            previous: previousDriver ? {
                year: currentYear - 1,
                position: parseInt(previousDriver.position),
                points: parseInt(previousDriver.points),
                wins: parseInt(previousDriver.wins)
            } : null,
            changes: previousDriver ? {
                positionDelta: parseInt(previousDriver.position) - parseInt(currentDriver.position),
                pointsDelta: parseInt(currentDriver.points) - parseInt(previousDriver.points),
                winsDelta: parseInt(currentDriver.wins) - parseInt(previousDriver.wins)
            } : null
        };

        cache.set(cacheKey, comparison);
        return comparison;
    } catch (error) {
        console.error('Error in driver YoY comparison:', error);
        return null;
    }
}

// Year-over-Year Constructor Comparison
export async function getConstructorYoYComparison(constructorId, currentYear = new Date().getFullYear()) {
    const cacheKey = `constructor_yoy_${constructorId}_${currentYear}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [currentStandings, previousStandings] = await Promise.all([
            ErgastAPI.getConstructorStandings(currentYear),
            ErgastAPI.getConstructorStandings(currentYear - 1)
        ]);

        const currentTeam = currentStandings.find(c => c.Constructor.constructorId === constructorId);
        const previousTeam = previousStandings.find(c => c.Constructor.constructorId === constructorId);

        if (!currentTeam) return null;

        const comparison = {
            current: {
                year: currentYear,
                position: parseInt(currentTeam.position),
                points: parseInt(currentTeam.points),
                wins: parseInt(currentTeam.wins)
            },
            previous: previousTeam ? {
                year: currentYear - 1,
                position: parseInt(previousTeam.position),
                points: parseInt(previousTeam.points),
                wins: parseInt(previousTeam.wins)
            } : null,
            changes: previousTeam ? {
                positionDelta: parseInt(previousTeam.position) - parseInt(currentTeam.position),
                pointsDelta: parseInt(currentTeam.points) - parseInt(previousTeam.points),
                winsDelta: parseInt(currentTeam.wins) - parseInt(previousTeam.wins)
            } : null
        };

        cache.set(cacheKey, comparison);
        return comparison;
    } catch (error) {
        console.error('Error in constructor YoY comparison:', error);
        return null;
    }
}

// Championship Battle Analytics
export async function getChampionshipBattle(year = 'current') {
    const cacheKey = `championship_battle_${year}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [driverStandings, schedule] = await Promise.all([
            ErgastAPI.getDriverStandings(year),
            year === 'current' ? ErgastAPI.getCurrentSchedule() : ErgastAPI.getSeasonSchedule(year)
        ]);

        const totalRaces = schedule.length;
        const completedRaces = schedule.filter(race => {
            const raceDate = new Date(race.date + 'T' + race.time);
            return raceDate < new Date();
        }).length;

        const top3 = driverStandings.slice(0, 3);
        const leader = top3[0];

        const battle = {
            leader: {
                name: `${leader.Driver.givenName} ${leader.Driver.familyName}`,
                points: parseInt(leader.points),
                wins: parseInt(leader.wins),
                team: leader.Constructors[0]?.name,
                teamId: leader.Constructors[0]?.constructorId
            },
            contenders: top3.slice(1).map(driver => ({
                name: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
                points: parseInt(driver.points),
                pointsBehind: parseInt(leader.points) - parseInt(driver.points),
                wins: parseInt(driver.wins),
                team: driver.Constructors[0]?.name,
                teamId: driver.Constructors[0]?.constructorId
            })),
            progress: {
                completedRaces,
                totalRaces,
                remainingRaces: totalRaces - completedRaces,
                percentComplete: Math.round((completedRaces / totalRaces) * 100)
            }
        };

        cache.set(cacheKey, battle);
        return battle;
    } catch (error) {
        console.error('Error in championship battle analytics:', error);
        return null;
    }
}

// Team Performance Trends (last 5 years)
export async function getTeamPerformanceTrends(constructorId) {
    const cacheKey = `team_trends_${constructorId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const currentYear = new Date().getFullYear();
    const years = 5;
    const trends = [];

    try {
        for (let i = 0; i < years; i++) {
            const year = currentYear - i;
            try {
                const standings = await ErgastAPI.getConstructorStandings(year);
                const team = standings.find(s => s.Constructor.constructorId === constructorId);

                if (team) {
                    trends.push({
                        year,
                        position: parseInt(team.position),
                        points: parseInt(team.points),
                        wins: parseInt(team.wins)
                    });
                }
            } catch (err) {
                console.warn(`No data for ${year}`);
            }
        }

        trends.reverse(); // Oldest to newest

        const result = {
            constructorId,
            trends,
            improvement: trends.length > 1 ? {
                positionChange: trends[0].position - trends[trends.length - 1].position,
                pointsChange: trends[trends.length - 1].points - trends[0].points,
                winsChange: trends[trends.length - 1].wins - trends[0].wins
            } : null
        };

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error fetching team trends:', error);
        return null;
    }
}

// Season Statistics
export async function getSeasonStatistics(year = 'current') {
    const cacheKey = `season_stats_${year}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [driverStandings, constructorStandings, schedule] = await Promise.all([
            ErgastAPI.getDriverStandings(year),
            ErgastAPI.getConstructorStandings(year),
            year === 'current' ? ErgastAPI.getCurrentSchedule() : ErgastAPI.getSeasonSchedule(year)
        ]);

        const totalRaces = schedule.length;
        const completedRaces = schedule.filter(race => {
            const raceDate = new Date(race.date + 'T' + race.time);
            return raceDate < new Date();
        }).length;

        // Different race winners
        const winners = new Set();
        const winningTeams = new Set();

        driverStandings.forEach(driver => {
            if (parseInt(driver.wins) > 0) {
                winners.add(`${driver.Driver.givenName} ${driver.Driver.familyName}`);
                winningTeams.add(driver.Constructors[0]?.name);
            }
        });

        const stats = {
            year: year === 'current' ? new Date().getFullYear() : year,
            races: {
                total: totalRaces,
                completed: completedRaces,
                remaining: totalRaces - completedRaces
            },
            drivers: {
                total: driverStandings.length,
                differentWinners: winners.size,
                winners: Array.from(winners)
            },
            constructors: {
                total: constructorStandings.length,
                differentWinners: winningTeams.size,
                winners: Array.from(winningTeams)
            },
            topScorer: {
                driver: `${driverStandings[0].Driver.givenName} ${driverStandings[0].Driver.familyName}`,
                points: parseInt(driverStandings[0].points),
                wins: parseInt(driverStandings[0].wins)
            },
            topTeam: {
                name: constructorStandings[0].Constructor.name,
                points: parseInt(constructorStandings[0].points),
                wins: parseInt(constructorStandings[0].wins)
            }
        };

        cache.set(cacheKey, stats);
        return stats;
    } catch (error) {
        console.error('Error fetching season statistics:', error);
        return null;
    }
}

// Championship Scenarios - Calculate what's needed to win
export async function getChampionshipScenarios(year = 'current') {
    const cacheKey = `championship_scenarios_${year}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [driverStandings, schedule] = await Promise.all([
            ErgastAPI.getDriverStandings(year),
            year === 'current' ? ErgastAPI.getCurrentSchedule() : ErgastAPI.getSeasonSchedule(year)
        ]);

        const totalRaces = schedule.length;
        const completedRaces = schedule.filter(race => {
            const raceDate = new Date(race.date + 'T' + race.time);
            return raceDate < new Date();
        }).length;
        const remainingRaces = totalRaces - completedRaces;
        const maxPointsRemaining = remainingRaces * 26; // 25 + 1 for fastest lap

        const leader = driverStandings[0];
        const leaderPoints = parseInt(leader.points);

        const scenarios = driverStandings.slice(1, 5).map(driver => {
            const driverPoints = parseInt(driver.points);
            const gap = leaderPoints - driverPoints;
            const canWin = gap <= maxPointsRemaining;
            const needsPerRace = canWin ? Math.ceil(gap / remainingRaces) : null;

            return {
                driver: `${driver.Driver.givenName} ${driver.Driver.familyName}`,
                driverId: driver.Driver.driverId,
                team: driver.Constructors[0]?.name,
                teamId: driver.Constructors[0]?.constructorId,
                currentPoints: driverPoints,
                gap,
                canWin,
                needsPerRace,
                scenario: canWin
                    ? `Needs ${needsPerRace}+ points per race to catch leader`
                    : 'Mathematically eliminated'
            };
        });

        const result = {
            leader: {
                name: `${leader.Driver.givenName} ${leader.Driver.familyName}`,
                driverId: leader.Driver.driverId,
                team: leader.Constructors[0]?.name,
                teamId: leader.Constructors[0]?.constructorId,
                points: leaderPoints,
                canClinch: leaderPoints - parseInt(driverStandings[1]?.points || 0) > maxPointsRemaining
            },
            remainingRaces,
            maxPointsRemaining,
            contenders: scenarios.filter(s => s.canWin),
            eliminated: scenarios.filter(s => !s.canWin)
        };

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error calculating championship scenarios:', error);
        return null;
    }
}

// Driver Performance Trends (season-wide data)
export async function getDriverPerformanceTrends(year = 'current') {
    const cacheKey = `driver_performance_trends_${year}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const schedule = year === 'current' ?
            await ErgastAPI.getCurrentSchedule() :
            await ErgastAPI.getSeasonSchedule(year);

        const completedRaces = schedule.filter(race => {
            const raceDate = new Date(race.date + 'T' + race.time);
            return raceDate < new Date();
        });

        // Get all completed races for season-wide data
        const driverTrends = {};

        for (const race of completedRaces) {
            try {
                const raceResults = await ErgastAPI.getRaceResults(
                    year === 'current' ? new Date().getFullYear() : year,
                    race.round
                );

                if (raceResults?.Results) {
                    raceResults.Results.forEach(result => {
                        const driverId = result.Driver.driverId;
                        const driverName = `${result.Driver.givenName} ${result.Driver.familyName}`;

                        if (!driverTrends[driverId]) {
                            driverTrends[driverId] = {
                                driverId,
                                name: driverName,
                                team: result.Constructor.name,
                                teamId: result.Constructor.constructorId,
                                races: []
                            };
                        }

                        driverTrends[driverId].races.push({
                            round: race.round,
                            raceName: race.raceName,
                            position: parseInt(result.position),
                            points: parseInt(result.points),
                            grid: parseInt(result.grid || 0)
                        });
                    });
                }
            } catch (err) {
                console.warn(`Could not get results for round ${race.round}`);
            }
        }

        // Calculate trends
        Object.keys(driverTrends).forEach(driverId => {
            const driver = driverTrends[driverId];
            const positions = driver.races.map(r => r.position);
            const totalPoints = driver.races.reduce((sum, r) => sum + r.points, 0);
            const avgPosition = positions.reduce((sum, p) => sum + p, 0) / positions.length;

            driver.avgPosition = avgPosition.toFixed(1);
            driver.totalPoints = totalPoints;
            driver.podiums = positions.filter(p => p <= 3).length;
            driver.wins = positions.filter(p => p === 1).length;

            // Trend: comparing first half vs second half of season
            const firstHalf = positions.slice(0, Math.floor(positions.length / 2));
            const secondHalf = positions.slice(Math.floor(positions.length / 2));
            const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, p) => sum + p, 0) / firstHalf.length : 0;
            const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, p) => sum + p, 0) / secondHalf.length : 0;

            driver.trend = firstAvg > secondAvg ? 'improving' :
                          firstAvg < secondAvg ? 'declining' : 'stable';
        });

        const result = {
            period: `${completedRaces.length} race${completedRaces.length !== 1 ? 's' : ''} completed`,
            drivers: Object.values(driverTrends)
                .sort((a, b) => b.totalPoints - a.totalPoints)
        };

        cache.set(cacheKey, result);
        return result;
    } catch (error) {
        console.error('Error calculating driver performance trends:', error);
        return null;
    }
}

// Clear all analytics cache
export function clearAnalyticsCache() {
    cache.clear();
    ErgastAPI.clearCache();
}

export default {
    getDriverYoYComparison,
    getConstructorYoYComparison,
    getChampionshipBattle,
    getTeamPerformanceTrends,
    getSeasonStatistics,
    getChampionshipScenarios,
    getDriverPerformanceTrends,
    clearAnalyticsCache
};
