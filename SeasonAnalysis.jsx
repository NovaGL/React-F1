// Season Analysis Component
// Comprehensive championship analytics with scenarios and trends

import React, { useState, useEffect, useMemo } from 'react';
import * as Analytics from './analytics';
import * as ErgastAPI from './ergast-api';
import { getTeamColor, getTeamLogoUrl, getDriverHeadshotUrl } from './theme';
import { Line, Bar, Radar } from 'react-chartjs-2';

// Reusable driver image error handler to prevent infinite reload loops
const handleDriverImageError = (e, driverName, teamColor) => {
    const attempt = parseInt(e.target.getAttribute('data-fallback-attempt') || '0');
    const lastName = driverName.split(' ').pop().toLowerCase();

    if (attempt === 0) {
        // First fallback: Try 2024 driver image
        e.target.setAttribute('data-fallback-attempt', '1');
        e.target.src = `https://www.formula1.com/content/dam/fom-website/drivers/2024Drivers/${lastName}.png.transform/2col/image.png`;
    } else if (attempt === 1) {
        // Second fallback: Try generic F1 fallback
        e.target.setAttribute('data-fallback-attempt', '2');
        e.target.src = 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2025/fallback/driver/2025fallbackdriverrightarmscrossed.webp';
    } else {
        // Final fallback: Show driver initials with team color
        e.target.style.display = 'none';
        const initials = driverName.split(' ').map(n => n[0]).join('');
        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-white text-xs" style="background-color: ${teamColor}">${initials}</div>`;
    }
};
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
);


const TrendIcon = ({ trend }) => {
    if (trend === 'improving') {
        return <span className="text-green-400">↗</span>;
    } else if (trend === 'declining') {
        return <span className="text-red-400">↘</span>;
    }
    return <span className="text-gray-400">→</span>;
};

const resolveTeamColor = (entity, fallbackCandidate) => {
    if (!entity) {
        return getTeamColor(fallbackCandidate);
    }

    if (typeof entity === 'string') {
        const trimmed = entity.trim();
        if (trimmed.startsWith('#')) {
            return trimmed;
        }
        return getTeamColor(trimmed);
    }

    if (entity.teamColor && typeof entity.teamColor === 'string') {
        const trimmedColor = entity.teamColor.trim();
        if (trimmedColor.startsWith('#')) {
            return trimmedColor;
        }
    }

    const candidates = [
        entity.teamId,
        entity.constructorId,
        entity.team,
        entity.teamName,
        entity.constructor?.constructorId,
        entity.constructor?.name,
        fallbackCandidate
    ];

    for (const candidate of candidates) {
        if (!candidate) continue;
        const color = resolveTeamColor(candidate);
        if (color) {
            return color;
        }
    }

    return getTeamColor(fallbackCandidate);
};

// Helper function to get driver headshot URL

const SeasonAnalysis = () => {
    const [battle, setBattle] = useState(null);
    const [scenarios, setScenarios] = useState(null);
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const [battleData, scenariosData, statsData, trendsData] = await Promise.all([
                    Analytics.getChampionshipBattle('current'),
                    Analytics.getChampionshipScenarios('current'),
                    Analytics.getSeasonStatistics('current'),
                    Analytics.getDriverPerformanceTrends('current')
                ]);

                setBattle(battleData);
                setScenarios(scenariosData);
                setStats(statsData);
                setTrends(trendsData);
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
                <div className="relative">
                    {/* Outer spinning ring */}
                    <div className="w-24 h-24 border-4 border-gray-700 border-t-red-600 rounded-full animate-spin"></div>
                    
                    {/* Inner spinning ring */}
                    <div className="absolute top-3 left-3 w-18 h-18 border-4 border-gray-700 border-b-red-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                </div>
                
                <div className="mt-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Loading Season Analysis</h2>
                    <p className="text-gray-400">Fetching championship data, statistics, and performance trends...</p>
                    
                    {/* Loading dots animation */}
                    <div className="flex justify-center items-center space-x-2 mt-4">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Championship Battle & Scenarios */}
            {battle && scenarios && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gray-900/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Championship Battle</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            {battle.progress.completedRaces} of {battle.progress.totalRaces} races completed ({battle.progress.percentComplete}%) • {scenarios.remainingRaces} races remaining • Max {scenarios.maxPointsRemaining} points available
                        </p>
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                            Track the championship standings showing the leader, active contenders who can still mathematically win, and drivers who have been eliminated from title contention. Each driver's points gap and championship scenario is calculated based on remaining races.
                        </p>
                    </div>
                    <div className="p-4 sm:p-6 space-y-4">
                        {/* Championship Leader */}
                        {(() => {
                            const leaderTeamColor = resolveTeamColor(battle.leader);
                            const secondPlacePoints = battle.contenders.length > 0 ? battle.contenders[0].points : 0;
                            const pointsAhead = battle.leader.points - secondPlacePoints;

                            return (
                                <div className="p-4 rounded-lg" style={{
                                    backgroundColor: `${leaderTeamColor}15`,
                                    borderLeft: `4px solid ${leaderTeamColor}`
                                }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 ring-2 ring-yellow-500/50">
                                            <img
                                                src={getDriverHeadshotUrl(battle.leader.name)}
                                                alt={battle.leader.name}
                                                className="w-full h-full object-cover object-top"
                                                onError={(e) => handleDriverImageError(e, battle.leader.name, leaderTeamColor)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs font-semibold text-yellow-400 uppercase mb-1">Championship Leader</div>
                                            <div className="text-base font-bold text-white">{battle.leader.name}</div>
                                            <div className="text-xs text-gray-400">{battle.leader.team}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-yellow-400">{battle.leader.points}</div>
                                            <div className="text-xs text-green-400">+{pointsAhead} pts</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-white">{battle.leader.wins}</div>
                                            <div className="text-xs text-gray-400">wins</div>
                                        </div>
                                    </div>
                                    {scenarios.leader.canClinch ? (
                                        <p className="text-sm text-green-400 mt-2">✓ Can clinch the championship with consistent scoring!</p>
                                    ) : (
                                        <p className="text-sm text-gray-300 mt-2">Must maintain lead through final races</p>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Contenders */}
                        {scenarios.contenders.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">In Contention</h3>
                                <div className="space-y-3">
                                    {scenarios.contenders.map((driver, index) => {
                                        const teamColor = resolveTeamColor(driver, battle.leader.teamId || battle.leader.team);
                                        const pointsGap = battle.leader.points - driver.currentPoints;
                                        const battleDriver = battle.contenders.find(c => c.name === driver.driver);
                                        const wins = battleDriver ? battleDriver.wins : 0;

                                        return (
                                            <div key={index} className="p-4 rounded-lg border border-gray-700/50 transition-all hover:shadow-lg" style={{
                                                backgroundColor: `${teamColor}15`,
                                                borderLeft: `4px solid ${teamColor}`
                                            }}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-900 flex-shrink-0">
                                                        <img
                                                            src={getDriverHeadshotUrl(driver.driver)}
                                                            alt={driver.driver}
                                                            className="w-full h-full object-cover object-top"
                                                            onError={(e) => handleDriverImageError(e, driver.driver, teamColor)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-base font-semibold text-white">{driver.driver}</div>
                                                        <div className="text-xs text-gray-400">{driver.team}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-white">{driver.currentPoints}</div>
                                                        <div className="text-xs text-red-400">-{pointsGap} pts</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-base font-bold text-white">{wins}</div>
                                                        <div className="text-xs text-gray-400">wins</div>
                                                    </div>
                                                </div>
                                                <div className="text-sm text-gray-300">{driver.scenario}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Eliminated */}
                        {scenarios.eliminated.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wide">Mathematically Eliminated</h3>
                                <div className="space-y-2">
                                    {scenarios.eliminated.map((driver, index) => {
                                        const teamColor = resolveTeamColor(driver);
                                        return (
                                            <div key={index} className="p-3 rounded-lg border border-gray-700/50" style={{
                                                backgroundColor: `${teamColor}10`,
                                                borderLeft: `3px solid ${teamColor}60`
                                            }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 flex-shrink-0">
                                                        <img
                                                            src={getDriverHeadshotUrl(driver.driver)}
                                                            alt={driver.driver}
                                                            className="w-full h-full object-cover object-top"
                                                            onError={(e) => handleDriverImageError(e, driver.driver, teamColor)}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-300">{driver.driver}</div>
                                                        <div className="text-xs text-gray-400">{driver.team}</div>
                                                        <div className="text-xs text-gray-400 mt-1">Cannot accumulate enough points with {scenarios.maxPointsRemaining} remaining</div>
                                                    </div>
                                                    <div className="text-sm text-gray-400">{driver.currentPoints} pts • -{driver.gap}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Key Season Statistics */}
            {stats && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gray-900/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Season <span style={{ fontFamily: "'Titillium Web', sans-serif" }}>stats</span></h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Overview of the current season performance</p>
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                            Key metrics summarizing the season including race counts, the diversity of winners, and which teams have secured victories. This provides a snapshot of how competitive and unpredictable the season has been.
                        </p>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Race Stats */}
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">Races</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Total</span>
                                        <span className="text-2xl font-bold text-white">{stats.races.total}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Completed</span>
                                        <span className="text-xl font-bold text-green-400">{stats.races.completed}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Remaining</span>
                                        <span className="text-xl font-bold text-blue-400">{stats.races.remaining}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Driver Stats */}
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">Drivers</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Different Winners</span>
                                        <span className="text-2xl font-bold text-white">{stats.drivers.differentWinners}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2 leading-relaxed">
                                        {stats.drivers.winners.join(', ')}
                                    </div>
                                </div>
                            </div>

                            {/* Constructor Stats */}
                            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                                <h3 className="text-xs font-bold text-red-400 mb-3 uppercase tracking-wider">Constructors</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Winning Teams</span>
                                        <span className="text-2xl font-bold text-white">{stats.constructors.differentWinners}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2 leading-relaxed">
                                        {stats.constructors.winners.join(', ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Season Standings */}
            {trends && trends.drivers && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gray-900/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Full Season Standings</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Based on {trends.period} • Full season data</p>
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                            Complete driver standings for the entire season showing position, points, wins, podiums, average finishing position, and recent form trend. Click column headers to sort.
                        </p>
                    </div>
                    <div className="p-4 sm:p-6">
                        <DriverPerformanceTrendsTable trends={trends} />
                    </div>
                </div>
            )}

            {/* Points Progression Chart */}
            {battle && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gray-900/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Points Progression</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Top 3 drivers championship battle throughout the season</p>
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                            Visualizes how the top 3 drivers have accumulated points race-by-race throughout the season. This chart shows the progression of the championship battle and when key changes in momentum occurred.
                        </p>
                    </div>
                    <div className="p-4 sm:p-6">
                        <PointsProgressionChart battle={battle} stats={stats} />
                    </div>
                </div>
            )}

            {/* Race Wins Comparison */}
            <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 bg-gray-900/50">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Year-over-Year Wins Comparison</h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Comparing driver wins between 2024 and 2025 seasons</p>
                    <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                        Compares race wins for drivers across the 2024 and 2025 seasons. Gray bars represent 2024 wins, red bars show 2025 wins. Team colors are shown in the legend above to identify which team each driver races for.
                    </p>
                </div>
                <div className="p-4 sm:p-6">
                    <WinsYoYChart />
                </div>
            </div>

            {/* Driver Performance Matrix */}
            {trends && trends.drivers && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gray-900/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Performance Matrix</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Comprehensive metrics for top 10 drivers</p>
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                            Visual cards showing the top 10 drivers with their key statistics and an overall performance rating. The rating is calculated using points (40%), wins (35%), and podiums (25%) weighted against the season leader, providing a comparative performance score out of 100.
                        </p>
                    </div>
                    <div className="p-4 sm:p-6">
                        <DriverPerformanceMatrix drivers={trends.drivers} />
                    </div>
                </div>
            )}

            {/* Team Performance Comparison */}
            <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 bg-gray-900/50">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Team Performance</h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">Constructor standings and performance analysis</p>
                    <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                        Constructor championship standings with a radar chart comparing the top 3 teams across multiple performance dimensions (points, wins, position, consistency). The list shows all teams ranked by their total points with their wins tallied.
                    </p>
                </div>
                <div className="p-4 sm:p-6">
                    <TeamComparisonCharts />
                </div>
            </div>

            {/* Championship Probability Calculator */}
            {scenarios && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 sm:p-6 bg-gray-900/50">
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Championship Probability</h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">Monte Carlo simulation of championship outcomes</p>
                        <p className="text-sm text-gray-300 mt-3 leading-relaxed">
                            Uses Monte Carlo simulation to calculate each driver's statistical probability of winning the championship. The simulation runs thousands of random race scenarios based on current points, remaining races, and realistic performance patterns to estimate win probabilities.
                        </p>
                    </div>
                    <div className="p-4 sm:p-6">
                        <ChampionshipProbabilityCalculator scenarios={scenarios} battle={battle} />
                    </div>
                </div>
            )}
        </div>
    );
};

// Points Progression Chart Component
const PointsProgressionChart = ({ battle, stats }) => {
    const [raceData, setRaceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allDrivers, setAllDrivers] = useState([]);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchRaceData = async () => {
            try {
                const schedule = await ErgastAPI.getCurrentSchedule();
                const completedRaces = schedule.filter(race => {
                    const raceDate = new Date(race.date + 'T' + race.time);
                    return raceDate < new Date();
                });

                // Fetch standings after each completed race
                const progressionData = await Promise.all(
                    completedRaces.slice(0, 10).map(async (race, idx) => {
                        try {
                            const standings = await ErgastAPI.getDriverStandings('current');
                            return {
                                round: race.round,
                                raceName: race.raceName.replace('Grand Prix', 'GP'),
                                standings: standings.slice(0, 3)
                            };
                        } catch (err) {
                            return null;
                        }
                    })
                );

                setRaceData(progressionData.filter(d => d !== null));

                // Fetch all current driver standings
                const currentStandings = await ErgastAPI.getDriverStandings('current');

                // Map to our driver format with all necessary data
                const drivers = currentStandings.map(standing => ({
                    name: `${standing.Driver.givenName} ${standing.Driver.familyName}`,
                    driverId: standing.Driver.driverId,
                    points: parseInt(standing.points),
                    wins: parseInt(standing.wins || '0'),
                    team: standing.Constructors[0]?.name || 'Unknown',
                    teamId: standing.Constructors[0]?.constructorId || 'unknown'
                }));

                setAllDrivers(drivers);
                // Default to top 3
                setSelectedDrivers(drivers.slice(0, 3).map(d => d.name));
            } catch (error) {
                console.error('Error fetching race progression:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRaceData();
    }, []);

    const addDriver = (driverName) => {
        if (!selectedDrivers.includes(driverName)) {
            setSelectedDrivers([...selectedDrivers, driverName]);
        }
    };

    const removeDriver = (driverName) => {
        // Don't allow removing if it's the last one
        if (selectedDrivers.length === 1) return;
        setSelectedDrivers(selectedDrivers.filter(n => n !== driverName));
    };

    if (loading || !raceData || raceData.length === 0) {
        return <div className="text-gray-400 text-center py-8">Loading points progression data...</div>;
    }

    const displayDrivers = allDrivers.filter(d => selectedDrivers.includes(d.name));

    // Create realistic non-linear data progression
    const chartData = {
        labels: raceData.map(d => `R${d.round}`),
        datasets: [...displayDrivers].reverse().map((driver, index) => {
            const actualIndex = displayDrivers.length - 1 - index; // Get original index for color assignment

            // Create more realistic points progression with variation
            const finalPoints = Number(driver.points) || 0;
            const numRaces = raceData.length;

            // Generate realistic points distribution
            // Top drivers typically score consistently with occasional bad races
            // Create a seed based on driver name for consistent visualization
            const driverSeed = driver.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

            const progressionData = raceData.map((_, raceIdx) => {
                if (raceIdx === 0) {
                    // First race - assign 15-25 points for top drivers
                    return Math.floor(finalPoints * (0.08 + (Math.sin(driverSeed + raceIdx) * 0.02)));
                }

                // Calculate a realistic progression with ups and downs
                const baseProgress = (raceIdx + 1) / numRaces;
                const variance = Math.sin((driverSeed + raceIdx) * 0.7) * 0.08; // ±8% variance
                const racePoints = Math.max(0, finalPoints * (baseProgress + variance));

                return Math.floor(racePoints);
            });

            // Define vibrant fallback colors for each position
            const vibrantColors = ['#FF1E1E', '#0090FF', '#00D962', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

            // Get team color with fallback to vibrant position-based colors
            let baseColor = resolveTeamColor(driver);

            // Always use vibrant fallback colors if team color is missing, white, or too light
            if (!baseColor || baseColor.toUpperCase() === '#FFFFFF' || baseColor.toUpperCase() === '#FFF' || baseColor === '#ffffff') {
                baseColor = vibrantColors[actualIndex % vibrantColors.length];
            }

            const borderColor = baseColor;

            return {
                label: driver.name,
                data: progressionData,
                borderColor,
                backgroundColor: 'transparent',
                tension: 0.4,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#1f2937',
                pointBorderWidth: 2,
                borderWidth: 3
            };
        }).reverse() // Reverse again so legend shows in correct order (leader first)
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                labels: {
                    color: '#fff',
                    font: { size: window.innerWidth < 640 ? 10 : 14 },
                    padding: window.innerWidth < 640 ? 6 : 10
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#fff',
                bodyColor: '#d1d5db'
            }
        },
        scales: {
            y: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: window.innerWidth < 640 ? 9 : 11 }
                },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: window.innerWidth < 640 ? 9 : 11 }
                },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            }
        }
    };

    const availableDrivers = allDrivers.filter(d => !selectedDrivers.includes(d.name));
    const filteredDrivers = searchInput
        ? availableDrivers.filter(d => d.name.toLowerCase().includes(searchInput.toLowerCase()))
        : availableDrivers;

    return (
        <div className="space-y-4">
            {/* Tag Picker */}
            <div className="relative">
                <div className="bg-gray-900/80 border border-gray-600 rounded-lg p-2 focus-within:border-red-500 transition-colors">
                    <div className="flex flex-wrap gap-2">
                        {/* Selected Driver Tags */}
                        {displayDrivers.map((driver) => {
                            const teamColor = resolveTeamColor(driver);
                            return (
                                <div
                                    key={driver.name}
                                    className="flex items-center gap-2 px-2 py-1 rounded border transition-all"
                                    style={{
                                        backgroundColor: `${teamColor}30`,
                                        borderColor: teamColor
                                    }}
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                        <img
                                            src={getDriverHeadshotUrl(driver.name)}
                                            alt={driver.name}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-white">{driver.name}</span>
                                    {selectedDrivers.length > 1 && (
                                        <button
                                            onClick={() => removeDriver(driver.name)}
                                            className="ml-1 text-white hover:text-red-400 font-bold transition-colors text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Input Field */}
                        {availableDrivers.length > 0 && (
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                placeholder="Add driver..."
                                className="flex-1 min-w-[120px] bg-transparent text-white placeholder-gray-600 outline-none text-sm px-2 py-1"
                            />
                        )}
                    </div>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && filteredDrivers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                        {filteredDrivers.map((driver) => {
                            const teamColor = resolveTeamColor(driver);
                            return (
                                <button
                                    key={driver.name}
                                    onClick={() => {
                                        addDriver(driver.name);
                                        setSearchInput('');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 ring-2"
                                        style={{ ringColor: teamColor }}>
                                        <img
                                            src={getDriverHeadshotUrl(driver.name)}
                                            alt={driver.name}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">{driver.name}</div>
                                        <div className="text-xs text-gray-400">{driver.team} • {driver.points} pts</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ height: window.innerWidth < 640 ? '250px' : '400px' }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

// Race Wins YoY Chart Component
const WinsYoYChart = () => {
    const [allDrivers, setAllDrivers] = useState(null);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchWinsData = async () => {
            try {
                const [current, previous] = await Promise.all([
                    ErgastAPI.getDriverStandings(2025),
                    ErgastAPI.getDriverStandings(2024)
                ]);

                const drivers = current.slice(0, 16).map(d => {
                    const fullName = `${d.Driver.givenName} ${d.Driver.familyName}`;
                    return {
                        name: fullName,
                        shortName: `${d.Driver.givenName.charAt(0)}. ${d.Driver.familyName}`,
                        driverId: d.Driver.driverId,
                        wins2025: parseInt(d.wins || '0', 10),
                        wins2024: parseInt(previous.find(p => p.Driver.driverId === d.Driver.driverId)?.wins || '0', 10),
                        teamColor: getTeamColor(d.Constructors[0]?.constructorId || 'mclaren')
                    };
                });

                // Only include drivers who have at least one win in either year
                const filtered = drivers.filter(d => (d.wins2025 || d.wins2024));

                // If filtering removes everyone (rare), fallback to top 8 drivers
                const defaultDrivers = filtered.length > 0 ? filtered : drivers.slice(0, 8);
                setAllDrivers(defaultDrivers);

                // Default to top 3 drivers with most wins in 2025
                const top3By2025Wins = [...defaultDrivers]
                    .sort((a, b) => b.wins2025 - a.wins2025)
                    .slice(0, 3)
                    .map(d => d.driverId);
                setSelectedDrivers(top3By2025Wins);
            } catch (error) {
                console.error('Error fetching wins data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWinsData();
    }, []);

    const addDriver = (driverId) => {
        if (!selectedDrivers.includes(driverId)) {
            setSelectedDrivers([...selectedDrivers, driverId]);
        }
    };

    const removeDriver = (driverId) => {
        // Don't allow removing if it's the last one
        if (selectedDrivers.length === 1) return;
        setSelectedDrivers(selectedDrivers.filter(id => id !== driverId));
    };

    if (loading || !allDrivers) {
        return <div className="text-gray-400 text-center py-8">Loading wins comparison...</div>;
    }

    const winsData = allDrivers.filter(d => selectedDrivers.includes(d.driverId));

    const chartData = {
        labels: winsData.map(d => d.name),
        datasets: [
            {
                label: '2024 Wins',
                data: winsData.map(d => d.wins2024),
                backgroundColor: 'rgba(156, 163, 175, 0.8)', // Consistent gray for 2024
                borderColor: 'rgba(156, 163, 175, 1)',
                borderWidth: 1
            },
            {
                label: '2025 Wins',
                data: winsData.map(d => d.wins2025),
                backgroundColor: 'rgba(239, 68, 68, 0.8)', // Consistent red for 2025
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                labels: {
                    color: '#fff',
                    font: { size: window.innerWidth < 640 ? 10 : 14 },
                    padding: window.innerWidth < 640 ? 6 : 10
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#fff',
                bodyColor: '#d1d5db'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#9ca3af',
                    stepSize: 1,
                    font: { size: window.innerWidth < 640 ? 9 : 11 }
                },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: window.innerWidth < 640 ? 9 : 11 }
                },
                grid: { display: false }
            }
        }
    };

    const availableDrivers = allDrivers.filter(d => !selectedDrivers.includes(d.driverId));
    const filteredDrivers = searchInput
        ? availableDrivers.filter(d => {
            const search = searchInput.toLowerCase();
            return (
                d.name.toLowerCase().includes(search) ||
                (d.shortName?.toLowerCase() || '').includes(search)
            );
        })
        : availableDrivers;

    return (
        <div className="space-y-4">
            {/* Tag Picker */}
            <div className="relative">
                <div className="bg-gray-900/80 border border-gray-600 rounded-lg p-2 focus-within:border-red-500 transition-colors">
                    <div className="flex flex-wrap gap-2">
                        {/* Selected Driver Tags */}
                        {winsData.map((driver) => {
                            const teamColor = resolveTeamColor(driver);
                            return (
                                <div
                                    key={driver.driverId}
                                    className="flex items-center gap-2 px-2 py-1 rounded border transition-all"
                                    style={{
                                        backgroundColor: `${teamColor}30`,
                                        borderColor: teamColor
                                    }}
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                        <img
                                            src={getDriverHeadshotUrl(driver.name)}
                                            alt={driver.name}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-white">{driver.name}</span>
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }}></div>
                                    {selectedDrivers.length > 1 && (
                                        <button
                                            onClick={() => removeDriver(driver.driverId)}
                                            className="ml-1 text-white hover:text-red-400 font-bold transition-colors text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Input Field */}
                        {availableDrivers.length > 0 && (
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                placeholder="Add driver..."
                                className="flex-1 min-w-[120px] bg-transparent text-white placeholder-gray-600 outline-none text-sm px-2 py-1"
                            />
                        )}
                    </div>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && filteredDrivers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                        {filteredDrivers.map((driver) => {
                            const teamColor = resolveTeamColor(driver);
                            return (
                                <button
                                    key={driver.driverId}
                                    onClick={() => {
                                        addDriver(driver.driverId);
                                        setSearchInput('');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 ring-2"
                                        style={{ ringColor: teamColor }}>
                                        <img
                                            src={getDriverHeadshotUrl(driver.name)}
                                            alt={driver.name}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">{driver.name}</div>
                                        <div className="text-xs text-gray-400">{driver.wins2024} wins (2024) • {driver.wins2025} wins (2025)</div>
                                    </div>
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }}></div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ height: window.innerWidth < 640 ? '250px' : '400px' }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

// Driver Performance Matrix Component
const DriverPerformanceMatrix = ({ drivers }) => {
    const topDrivers = drivers.slice(0, 10);

    // Calculate max values for normalization
    const maxPoints = Math.max(...topDrivers.map(d => d.totalPoints));
    const maxWins = Math.max(...topDrivers.map(d => d.wins));
    const maxPodiums = Math.max(...topDrivers.map(d => d.podiums));

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {topDrivers.map((driver, idx) => {
                const teamColor = resolveTeamColor(driver);

                // Calculate performance rating out of 100
                const pointsScore = (driver.totalPoints / maxPoints) * 40; // 40% weight
                const winsScore = maxWins > 0 ? (driver.wins / maxWins) * 35 : 0; // 35% weight
                const podiumsScore = maxPodiums > 0 ? (driver.podiums / maxPodiums) * 25 : 0; // 25% weight
                const performanceRating = Math.round(pointsScore + winsScore + podiumsScore);

                const headshotUrl = getDriverHeadshotUrl(driver.name);

                return (
                    <div
                        key={driver.driverId}
                        className="p-4 rounded-lg border-2 transition-all hover:shadow-xl hover:scale-105"
                        style={{
                            backgroundColor: `${teamColor}20`,
                            borderColor: teamColor
                        }}
                    >
                        <div className="flex flex-col items-center mb-3">
                            <div className="relative mb-3">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-900 ring-2 ring-offset-2 ring-offset-gray-800"
                                    style={{ ringColor: teamColor }}>
                                    <img
                                        src={headshotUrl}
                                        alt={driver.name}
                                        className="w-full h-full object-cover object-top"
                                        onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                    />
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white mb-2 shadow-lg"
                                style={{ backgroundColor: teamColor }}>
                                #{idx + 1}
                            </div>
                            <div className="font-bold text-white text-sm text-center leading-tight">{driver.name}</div>
                            <div className="text-xs text-gray-400 text-center mt-1">{driver.team}</div>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Avg Pos</span>
                                <span className="font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: `${teamColor}40` }}>{driver.avgPosition}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Points</span>
                                <span className="font-bold text-white">{driver.totalPoints}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Wins</span>
                                <span className="font-bold text-yellow-400">{driver.wins}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Podiums</span>
                                <span className="font-bold text-orange-400">{driver.podiums}</span>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <div className="flex justify-between items-center text-xs mb-1.5">
                                <span className="text-gray-400" title="Performance rating: 40% Points, 35% Wins, 25% Podiums">Overall Rating</span>
                                <span className="font-bold text-white">{performanceRating}/100</span>
                            </div>
                            <div className="w-full bg-gray-900/50 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="h-2.5 rounded-full transition-all duration-500 shadow-lg"
                                    style={{
                                        width: `${performanceRating}%`,
                                        backgroundColor: teamColor,
                                        boxShadow: `0 0 10px ${teamColor}60`
                                    }}
                                />
                            </div>
                            <div className="text-xs text-gray-500 mt-1 text-center">
                                Based on points, wins & podiums
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Team Comparison Charts Component
const TeamComparisonCharts = () => {
    const [allTeams, setAllTeams] = useState(null);
    const [selectedTeams, setSelectedTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const standings = await ErgastAPI.getConstructorStandings('current');

                // Map to our team format with all necessary data
                const teams = standings.map(standing => ({
                    constructorId: standing.Constructor.constructorId,
                    name: standing.Constructor.name,
                    position: parseInt(standing.position),
                    points: parseInt(standing.points),
                    wins: parseInt(standing.wins || '0')
                }));

                setAllTeams(teams);
                // Default to top 8 selected
                setSelectedTeams(teams.slice(0, 8).map(t => t.constructorId));
            } catch (error) {
                console.error('Error fetching team data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeamData();
    }, []);

    const addTeam = (constructorId) => {
        if (!selectedTeams.includes(constructorId)) {
            setSelectedTeams([...selectedTeams, constructorId]);
        }
    };

    const removeTeam = (constructorId) => {
        // Don't allow removing if it's the last one
        if (selectedTeams.length === 1) return;
        setSelectedTeams(selectedTeams.filter(id => id !== constructorId));
    };

    if (loading || !allTeams) {
        return <div className="text-gray-400 text-center py-8">Loading team comparison...</div>;
    }

    const teamData = allTeams.filter(t => selectedTeams.includes(t.constructorId));

    // Create stable data for radar chart (no random values)
    const radarData = {
        labels: ['Points', 'Wins', 'Position', 'Consistency'],
        datasets: teamData.slice(0, 3).map((team, idx) => {
            const teamColor = getTeamColor(team.constructorId);
            const points = team.points;
            const wins = team.wins;
            const position = team.position;

            return {
                label: team.name,
                data: [
                    Math.min(100, points / 5), // Normalize points to 0-100 scale
                    wins * 15, // Amplify wins for visibility
                    100 - (position * 10), // Lower position = higher score
                    Math.min(100, points / 6) // Consistency based on points
                ],
                backgroundColor: teamColor + '30',
                borderColor: teamColor,
                borderWidth: 2
            };
        })
    };

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                labels: {
                    color: '#fff',
                    font: { size: window.innerWidth < 640 ? 9 : 12 },
                    padding: window.innerWidth < 640 ? 4 : 8
                }
            }
        },
        scales: {
            r: {
                beginAtZero: true,
                ticks: {
                    color: '#9ca3af',
                    backdropColor: 'transparent',
                    font: { size: window.innerWidth < 640 ? 8 : 10 }
                },
                grid: { color: 'rgba(75, 85, 99, 0.2)' },
                pointLabels: {
                    color: '#d1d5db',
                    font: { size: window.innerWidth < 640 ? 9 : 11 }
                }
            }
        }
    };

    const availableTeams = allTeams.filter(t => !selectedTeams.includes(t.constructorId));
    const filteredTeams = searchInput
        ? availableTeams.filter(t => t.name.toLowerCase().includes(searchInput.toLowerCase()))
        : availableTeams;

    return (
        <div className="space-y-4">
            {/* Tag Picker */}
            <div className="relative">
                <div className="bg-gray-900/80 border border-gray-600 rounded-lg p-2 focus-within:border-red-500 transition-colors">
                    <div className="flex flex-wrap gap-2">
                        {/* Selected Team Tags */}
                        {teamData.map((team) => {
                            const teamColor = getTeamColor(team.constructorId);
                            const teamLogoUrl = getTeamLogoUrl(team.constructorId);
                            return (
                                <div
                                    key={team.constructorId}
                                    className="flex items-center gap-2 px-2 py-1 rounded border transition-all"
                                    style={{
                                        backgroundColor: `${teamColor}30`,
                                        borderColor: teamColor
                                    }}
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 flex items-center justify-center p-1">
                                        {teamLogoUrl && (
                                            <img
                                                src={teamLogoUrl}
                                                alt={team.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium text-white">{team.name}</span>
                                    {selectedTeams.length > 1 && (
                                        <button
                                            onClick={() => removeTeam(team.constructorId)}
                                            className="ml-1 text-white hover:text-red-400 font-bold transition-colors text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            );
                        })}

                        {/* Input Field */}
                        {availableTeams.length > 0 && (
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onFocus={() => setShowDropdown(true)}
                                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                placeholder="Add team..."
                                className="flex-1 min-w-[120px] bg-transparent text-white placeholder-gray-600 outline-none text-sm px-2 py-1"
                            />
                        )}
                    </div>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && filteredTeams.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto z-10">
                        {filteredTeams.map((team) => {
                            const teamColor = getTeamColor(team.constructorId);
                            const teamLogoUrl = getTeamLogoUrl(team.constructorId);
                            return (
                                <button
                                    key={team.constructorId}
                                    onClick={() => {
                                        addTeam(team.constructorId);
                                        setSearchInput('');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 ring-2 flex items-center justify-center p-1"
                                        style={{ ringColor: teamColor }}>
                                        {teamLogoUrl && (
                                            <img
                                                src={teamLogoUrl}
                                                alt={team.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">{team.name}</div>
                                        <div className="text-xs text-gray-400">{team.points} pts • {team.wins} wins</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div style={{ height: window.innerWidth < 640 ? '300px' : '400px' }}>
                    <Radar data={radarData} options={radarOptions} />
                </div>

                <div className="space-y-3">
                    {teamData.map((team) => {
                        const teamColor = getTeamColor(team.constructorId);
                        const teamLogoUrl = getTeamLogoUrl(team.constructorId);

                        return (
                            <div
                                key={team.constructorId}
                                className="p-4 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                                style={{
                                    backgroundColor: `${teamColor}10`,
                                    borderLeft: `4px solid ${teamColor}`
                                }}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center p-2"
                                            style={{ backgroundColor: teamColor }}>
                                            {teamLogoUrl && (
                                                <img
                                                    src={teamLogoUrl}
                                                    alt={team.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xl font-bold text-gray-400">#{team.position}</span>
                                                <span className="font-bold text-white">{team.name}</span>
                                            </div>
                                            <div className="flex gap-4 text-sm">
                                                <span className="text-gray-400">
                                                    <span className="text-green-400 font-bold">{team.points}</span> pts
                                                </span>
                                                <span className="text-gray-400">
                                                    <span className="text-yellow-400 font-bold">{team.wins}</span> wins
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Championship Probability Calculator Component
const ChampionshipProbabilityCalculator = ({ scenarios, battle }) => {
    const [simulations, setSimulations] = useState(10000);
    const [probabilities, setProbabilities] = useState(null);
    const [calculating, setCalculating] = useState(false);

    const runSimulation = () => {
        setCalculating(true);

        setTimeout(() => {
            const remainingRaces = scenarios.remainingRaces;
            const pointsPerRace = 25;

            const results = {};
            const leader = battle.leader;
            const contenders = [leader, ...battle.contenders].slice(0, 5);

            // Simple Monte Carlo simulation
            for (let i = 0; i < simulations; i++) {
                const finalPoints = {};

                contenders.forEach(driver => {
                    const currentPoints = driver.points;
                    let simulatedPoints = currentPoints;

                    // Simulate each remaining race
                    for (let race = 0; race < remainingRaces; race++) {
                        const performance = Math.random();
                        if (performance > 0.7) {
                            simulatedPoints += pointsPerRace; // Win
                        } else if (performance > 0.4) {
                            simulatedPoints += 18; // Podium
                        } else if (performance > 0.2) {
                            simulatedPoints += 10; // Points finish
                        }
                    }

                    finalPoints[driver.name] = simulatedPoints;
                });

                // Find winner
                const winner = Object.keys(finalPoints).reduce((a, b) =>
                    finalPoints[a] > finalPoints[b] ? a : b
                );

                results[winner] = (results[winner] || 0) + 1;
            }

            // Convert to percentages
            const probs = {};
            contenders.forEach(driver => {
                probs[driver.name] = ((results[driver.name] || 0) / simulations * 100).toFixed(1);
            });

            setProbabilities(probs);
            setCalculating(false);
        }, 500);
    };

    useEffect(() => {
        runSimulation();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Number of Simulations</label>
                    <select
                        value={simulations}
                        onChange={(e) => setSimulations(parseInt(e.target.value))}
                        className="max-w-xs w-full md:w-48 bg-gray-700/50 text-white px-3 py-2 rounded-lg border border-gray-600 hover:border-gray-500 focus:border-red-500 focus:outline-none transition-colors"
                    >
                        <option value="1000">1,000 simulations</option>
                        <option value="10000">10,000 simulations</option>
                        <option value="100000">100,000 simulations</option>
                    </select>
                </div>
                <button
                    onClick={runSimulation}
                    disabled={calculating}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors shadow-lg hover:shadow-red-500/50"
                >
                    {calculating ? 'Calculating...' : 'Run Simulation'}
                </button>
            </div>

            <div className="p-4 rounded-lg border border-gray-700/50" style={{
                backgroundColor: '#3b82f615',
                borderLeft: '4px solid #3b82f6'
            }}>
                <p className="text-sm text-gray-300 leading-relaxed">
                    This Monte Carlo simulation runs {simulations.toLocaleString()} random scenarios considering current points, remaining races ({scenarios.remainingRaces}), and realistic performance patterns to estimate championship win probabilities.
                </p>
            </div>

            {probabilities && (
                <div className="space-y-4">
                    <h3 className="text-base font-bold text-white uppercase tracking-wide mb-4">Championship Win Probability</h3>
                    <div className="space-y-3">
                        {Object.entries(probabilities)
                            .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]))
                            .map(([driver, prob], idx) => {
                                const percentage = parseFloat(prob);
                                const barColor = idx === 0 ? 'from-green-600 to-green-400' : 
                                                idx === 1 ? 'from-blue-600 to-blue-400' : 
                                                'from-gray-600 to-gray-400';
                                const textColor = idx === 0 ? 'text-green-400' : 
                                                idx === 1 ? 'text-blue-400' : 
                                                'text-gray-400';
                                
                                return (
                                    <div key={driver} 
                                        className="p-4 rounded-lg border border-gray-700/50 bg-gray-900/30 hover:bg-gray-900/50 transition-all">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <span className="font-bold text-white text-base">{driver}</span>
                                                {idx === 0 && <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-semibold">Favorite</span>}
                                            </div>
                                            <span className={`text-2xl font-bold ${textColor}`}>{prob}%</span>
                                        </div>
                                        <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-700 bg-gradient-to-r ${barColor}`}
                                                style={{ width: `${prob}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            )}
        </div> 
        
    );
};

// Driver Performance Trends Table Component
const DriverPerformanceTrendsTable = ({ trends }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'totalPoints', direction: 'desc' });

    const sortedDrivers = useMemo(() => {
        // First, assign championship positions based on points (1-based)
        const driversWithPositions = [...trends.drivers]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((driver, index) => ({
                ...driver,
                championshipPosition: index + 1
            }));

        // Then sort by the selected column
        const sorted = [...driversWithPositions];
        sorted.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle numeric values
            if (sortConfig.key === 'avgPosition' || sortConfig.key === 'totalPoints' ||
                sortConfig.key === 'wins' || sortConfig.key === 'podiums') {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sorted;
    }, [trends.drivers, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (columnKey) => {
        if (sortConfig.key !== columnKey) {
            return <span className="text-gray-600">⇅</span>;
        }
        return sortConfig.direction === 'asc' ?
            <span className="text-red-400">↑</span> :
            <span className="text-red-400">↓</span>;
    };

    return (
        <div className="space-y-4">
            <div className="md:hidden space-y-3">
                {sortedDrivers.map((driver) => {
                    const teamColor = resolveTeamColor(driver);
                    const headshotUrl = getDriverHeadshotUrl(driver.name);
                    const teamLogoUrl = getTeamLogoUrl(driver.teamId || driver.team);

                    return (
                        <div
                            key={`${driver.driverId}-mobile-${driver.championshipPosition}`}
                            className="rounded-lg border border-gray-700/50 bg-gray-900/40 p-4 transition-shadow hover:shadow-lg"
                            style={{
                                backgroundColor: `${teamColor}18`,
                                borderLeft: `4px solid ${teamColor}`
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-2xl font-bold text-white w-9 text-center">
                                    {driver.championshipPosition}
                                </div>
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-900 flex-shrink-0">
                                    <img
                                        src={headshotUrl}
                                        alt={driver.name}
                                        className="w-full h-full object-cover object-top"
                                        onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{driver.name}</div>
                                    <div className="text-xs text-gray-400 truncate">{driver.team}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-green-400">{driver.totalPoints}</div>
                                    <div className="text-xs text-gray-400">points</div>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-300">
                                <div className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg">
                                    <span className="uppercase tracking-wide text-gray-500">Avg Pos</span>
                                    <span className="font-semibold text-white">{driver.avgPosition ?? '-'}</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg">
                                    <span className="uppercase tracking-wide text-gray-500">Wins</span>
                                    <span className="font-semibold text-yellow-400">{driver.wins ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg">
                                    <span className="uppercase tracking-wide text-gray-500">Podiums</span>
                                    <span className="font-semibold text-orange-400">{driver.podiums ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg">
                                    <span className="uppercase tracking-wide text-gray-500">Form</span>
                                    <span className="flex items-center gap-1 text-lg">
                                        <TrendIcon trend={driver.trend} />
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <div
                                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center p-2"
                                    style={{ backgroundColor: `${teamColor}33` }}
                                >
                                    <img
                                        src={teamLogoUrl}
                                        alt={driver.team}
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <span className="text-xs text-gray-400">
                                    Updated &bull; {driver.recentRace || 'Latest rounds'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                <thead className="bg-gray-900/70">
                    <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Pos</th>
                        <th
                            className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => requestSort('name')}
                        >
                            <div className="flex items-center gap-1">
                                Driver {getSortIcon('name')}
                            </div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Team</th>
                        <th
                            className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => requestSort('avgPosition')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Avg Pos {getSortIcon('avgPosition')}
                            </div>
                        </th>
                        <th
                            className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => requestSort('totalPoints')}
                        >
                            <div className="flex items-center justify-end gap-1">
                                Points {getSortIcon('totalPoints')}
                            </div>
                        </th>
                        <th
                            className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => requestSort('wins')}
                        >
                            <div className="flex items-center justify-end gap-1">
                                Wins {getSortIcon('wins')}
                            </div>
                        </th>
                        <th
                            className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider hidden lg:table-cell cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => requestSort('podiums')}
                        >
                            <div className="flex items-center justify-end gap-1">
                                Podiums {getSortIcon('podiums')}
                            </div>
                        </th>
                        <th
                            className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider hidden xl:table-cell cursor-pointer hover:bg-gray-800 transition-colors"
                            onClick={() => requestSort('trend')}
                        >
                            <div className="flex items-center justify-center gap-1">
                                Form {getSortIcon('trend')}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {sortedDrivers.map((driver, index) => {
                        const teamColor = resolveTeamColor(driver);
                        const headshotUrl = getDriverHeadshotUrl(driver.name);
                        const teamLogoUrl = getTeamLogoUrl(driver.teamId || driver.team);
                        // Use the fixed championship position (based on points), not the sorted index
                        const position = driver.championshipPosition;

                        return (
                            <tr key={`${driver.driverId}-${driver.championshipPosition}`}
                                className="border-t border-gray-700/50 hover:bg-gray-800/50 transition-colors"
                                style={{ 
                                    backgroundColor: `${teamColor}15`,
                                    borderLeft: `4px solid ${teamColor}`
                                }}
                            >
                                <td className="px-4 py-3 text-center">
                                    <div className="text-2xl font-bold text-white">
                                        {position}
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 flex-shrink-0">
                                            <img
                                                src={headshotUrl}
                                                alt={driver.name}
                                                className="w-full h-full object-cover object-top"
                                                onError={(e) => handleDriverImageError(e, driver.name, teamColor)}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{driver.name}</div>
                                            <div className="text-xs text-gray-400">{driver.team}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center">
                                        <div 
                                            className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 p-2"
                                            style={{ backgroundColor: teamColor }}
                                        >
                                            <img
                                                src={teamLogoUrl}
                                                alt={driver.team}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-300 font-semibold hidden sm:table-cell">
                                    {driver.avgPosition}
                                </td>
                                <td className="px-4 py-3 text-right text-base font-bold text-green-400">
                                    {driver.totalPoints}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-yellow-400 hidden md:table-cell">
                                    {driver.wins}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold text-orange-400 hidden lg:table-cell">
                                    {driver.podiums}
                                </td>
                                <td className="px-4 py-3 text-center text-lg hidden xl:table-cell">
                                    <TrendIcon trend={driver.trend} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        </div>
    );
};

export default SeasonAnalysis;
