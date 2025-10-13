import React, { useState, useEffect, useMemo } from 'react';
import './index.css';
import * as ErgastAPI from './ergast-api';
import SeasonAnalysis from './SeasonAnalysis';
import {
    getTeamColor,
    getTeamLogoUrl,
    getDriverHeadshotUrl,
    getDriverCloudinaryUrl,
    darkenColor
} from './theme';
import { getCircuitData, getCircuitImageUrl } from './circuit-data';
import { getNationalityFlag, normalizeNationality } from './nationality-flags';
import { Line, Bar } from 'react-chartjs-2';
import { LAP_TIME_DRIVER_LIMIT, LAP_TIME_AUTO_SELECT_COUNT } from './config';

// Reusable driver image error handler to prevent infinite reload loops
const handleDriverImageError = (e, driver, teamColor) => {
    const attempt = parseInt(e.target.getAttribute('data-fallback-attempt') || '0');
    const familyName = driver.familyName.toLowerCase();

    if (attempt === 0) {
        // First fallback: Try 2024 driver image
        e.target.setAttribute('data-fallback-attempt', '1');
        e.target.src = `https://www.formula1.com/content/dam/fom-website/drivers/2024Drivers/${familyName}.png.transform/2col/image.png`;
    } else if (attempt === 1) {
        // Second fallback: Try generic F1 fallback
        e.target.setAttribute('data-fallback-attempt', '2');
        e.target.src = 'https://media.formula1.com/image/upload/c_fill,w_720/q_auto/v1740000000/common/f1/2025/fallback/driver/2025fallbackdriverrightarmscrossed.webp';
    } else {
        // Final fallback: Show driver code or initials with team color
        e.target.style.display = 'none';
        const driverCode = driver.code || driver.familyName.slice(0, 3).toUpperCase();
        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center font-bold text-white text-lg" style="background-color: ${teamColor}">${driverCode}</div>`;
    }
};
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
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
    Title,
    Tooltip,
    Legend,
    Filler
);

// --- SVG ICONS ---
const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-yellow-400">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
  </svg>
);

const FlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const TrendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

// Official-looking Formula 1 red logo (provided SVG)
const F1Logo = ({ height = 24 }) => (
    <svg viewBox="0 0 1600 400" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" style={{height: height}} aria-hidden="true">
        <title>F1</title>
        <g clipPath="url(#clip0_47001_481:S13:)">
            <path d="M1367.21 312.501C1379.83 312.501 1390.25 316.71 1398.5 325.168C1406.75 333.626 1410.88 344.001 1410.88 356.334C1410.88 368.667 1406.79 379.043 1398.58 387.418C1390.38 395.793 1380 400.001 1367.38 400.001C1354.75 400.001 1344.25 395.792 1335.92 387.334C1327.54 378.876 1323.38 368.501 1323.38 356.168C1323.38 343.835 1327.54 333.459 1335.83 325.084C1344.13 316.709 1354.59 312.501 1367.21 312.501ZM1167.04 149.792H635.292C501.959 149.792 473.584 160.083 403.667 227.875H403.708L226.292 400H0L281.542 120.583C386.208 17 436.667 4.27469e-06 615.125 0H1320.04L1167.04 149.792ZM1144.21 173.708L1003.96 313.958H641.125C574.625 313.958 559.917 317.083 526.917 350.083L477 400H267.167L422.292 244.875C483.209 184 504.209 173.708 638.5 173.708H1144.21ZM1600 0L1198.92 400H950.875L1350.88 0H1600ZM1367.13 319.376C1356.79 319.376 1348.13 322.96 1341.13 330.126C1334.17 337.293 1330.67 345.96 1330.67 356.168C1330.67 366.376 1334.17 375.042 1341.13 382.209C1348.09 389.376 1356.75 392.959 1367.13 392.959C1377.5 392.959 1386.13 389.418 1393.13 382.293C1400.09 375.168 1403.58 366.501 1403.58 356.251C1403.58 346.001 1400.09 337.293 1393.13 330.126C1386.17 322.959 1377.5 319.376 1367.13 319.376ZM1367.21 332.084C1373.5 332.084 1378.25 333.251 1381.42 335.626C1384.58 337.959 1386.17 341.501 1386.17 346.209C1386.17 350.917 1385.54 354.417 1384.25 356.709C1382.96 359.001 1380.79 360.834 1377.71 362.251L1386.83 380.668H1376.71L1368.42 363.501H1358.63L1358.58 363.459V380.626H1348.96V332.084H1367.21ZM1358.42 355.918H1368.21C1371.21 355.918 1373.38 355.293 1374.67 354.001C1376 352.709 1376.67 350.626 1376.67 347.751C1376.67 342.293 1373.25 339.584 1366.38 339.584H1358.42V355.918Z" fill="#E10600"></path>
        </g>
        <defs>
            <clipPath id="clip0_47001_481:S13:"><rect width="1600" height="400" fill="white"/></clipPath>
        </defs>
    </svg>
);


const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 transition-transform duration-300">
        <path d="m6 9 6 6 6-6"/>
    </svg>
);

const LoadingSpinner = ({ message = 'Loading...', subtext }) => (
    <div className="text-gray-400 text-center py-8">
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
            <div>
                <div className="text-white font-semibold mb-1">{message}</div>
                {subtext && <div className="text-sm text-gray-500">{subtext}</div>}
            </div>
        </div>
    </div>
);



// Circuit key mapping for images
const CIRCUIT_IMAGE_KEYS = {
    'albert_park': 'Australia',
    'bahrain': 'Bahrain',
    'jeddah': 'Saudi_Arabia',
    'shanghai': 'China',
    'suzuka': 'Japan',
    'miami': 'United_States',
    'imola': 'Italy',
    'monaco': 'Monaco',
    'catalunya': 'Spain',
    'villeneuve': 'Canada',
    'red_bull_ring': 'Austria',
    'silverstone': 'Great_Britain',
    'spa': 'Belgium',
    'hungaroring': 'Hungary',
    'zandvoort': 'Netherlands',
    'monza': 'Italy',
    'baku': 'Azerbaijan',
    'marina_bay': 'Singapore',
    'americas': 'United_States_Austin',
    'rodriguez': 'Mexico',
    'interlagos': 'Brazil',
    'vegas': 'United_States_Las_Vegas',
    'losail': 'Qatar',
    'yas_marina': 'Abu_Dhabi'
};


// --- CUSTOM HOOKS ---

// Hook for Next Race with countdown
const useNextRace = () => {
    const [nextRace, setNextRace] = useState(null);
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const autoSelect = (entries) => {
            const lapEntries = entries.filter(entry => entry.hasLapData);
            const autoSelectCount = Math.max(
                0,
                Math.min(
                    typeof LAP_TIME_AUTO_SELECT_COUNT === 'number'
                        ? LAP_TIME_AUTO_SELECT_COUNT
                        : 5,
                    lapEntries.length
                )
            );

            setSelectedDrivers(
                lapEntries.slice(0, autoSelectCount).map(entry => entry.driver.driverId)
            );
            setLapData(lapEntries);
        };

        const fallbackToAPI = async () => {
            try {
                const standings = await ErgastAPI.getDriverStandings(race.season);

                if (cancelled) {
                    return;
                }

                const topSeasonIds = (standings || [])
                    .slice(0, Math.min(5, standings.length))
                    .map(entry => entry.Driver.driverId);

                const raceDriverIds = race.results.map(result => result.Driver.driverId);
                const combinedIds = Array.from(new Set([...topSeasonIds, ...raceDriverIds]));

                const limitCount = Math.max(
                    1,
                    typeof LAP_TIME_DRIVER_LIMIT === 'number'
                        ? Math.min(LAP_TIME_DRIVER_LIMIT, combinedIds.length)
                        : combinedIds.length
                );
                const driverIds = combinedIds.slice(0, limitCount);

                const results = await ErgastAPI.getLapTimesBatch(
                    race.season,
                    race.round,
                    driverIds,
                    null,
                    race.results
                );

                if (cancelled) {
                    return;
                }

                const standingsLookup = new Map(
                    (standings || []).map(entry => [entry.Driver.driverId, entry.Driver])
                );
                const resultLookup = new Map(
                    (race.results || []).map(result => [result.Driver.driverId, result])
                );

                const entries = driverIds.map(driverId => {
                    const apiResult = results.find(res => res.driverId === driverId) || {};
                    const laps = Array.isArray(apiResult.laps) ? apiResult.laps : [];
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

                    return {
                        driver: driverInfo,
                        constructor: constructorInfo,
                        laps,
                        hasLapData: laps.length > 0,
                        lapError: apiResult.error || (laps.length === 0 ? 'no_data' : null)
                    };
                });

                if (!cancelled) {
                    setDriverOptions(entries);
                    setAllDrivers(entries.map(entry => entry.driver.driverId));
                    autoSelect(entries);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Error fetching lap times from API:', error);
                    setLapData([]);
                    setDriverOptions([]);
                    setSelectedDrivers([]);
                    setAllDrivers([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        const loadFromStatic = async () => {
            if (!race.isPast || !race.results) {
                if (!cancelled) {
                    setLapData([]);
                    setDriverOptions([]);
                    setSelectedDrivers([]);
                    setAllDrivers([]);
                    setLoading(false);
                }
                return;
            }

            setLoading(true);

            const raceKey = `${race.season}-${String(race.round).padStart(2, '0')}`;

            try {
                const indexRes = await fetch(`/laps/${raceKey}.json`, { cache: 'force-cache' });
                if (!indexRes.ok) {
                    throw new Error(`Static lap index not found for ${raceKey}`);
                }

                const indexData = await indexRes.json();
                const driversMeta = indexData?.drivers || [];

                const entries = [];

                for (const meta of driversMeta) {
                    if (cancelled) break;

                    try {
                        const driverRes = await fetch(`/laps/${meta.file}`, { cache: 'force-cache' });
                        if (!driverRes.ok) {
                            throw new Error(`Missing static lap file ${meta.file}`);
                        }
                        const driverData = await driverRes.json();
                        entries.push({
                            driver: driverData.driver,
                            constructor: driverData.constructor,
                            laps: driverData.laps || [],
                            hasLapData: (driverData.laps || []).length > 0,
                            lapError: driverData.lapError || null
                        });
                    } catch (err) {
                        console.warn(`Static lap file error: ${err.message}`);
                    }
                }

                if (cancelled) {
                    return;
                }

                if (entries.length === 0) {
                    console.warn(`No static lap data entries for ${raceKey}, falling back to API.`);
                    await fallbackToAPI();
                    return;
                }

                setDriverOptions(entries);
                setAllDrivers(entries.map(entry => entry.driver.driverId));
                autoSelect(entries);
            } catch (error) {
                console.warn(`Static lap snapshot unavailable: ${error.message}`);
                await fallbackToAPI();
                return;
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadFromStatic();

        return () => {
            cancelled = true;
        };
    }, [race.isPast, race.results, race.round, race.season]);
    const toggleDriver = (driverId) => {
        setSelectedDrivers(prev => 
            prev.includes(driverId) 
                ? prev.filter(id => id !== driverId)
                : [...prev, driverId]
        );
    };

    const toggleAll = () => {
        if (selectedDrivers.length === allDrivers.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(allDrivers);
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading lap time data..." subtext="Fetching race timing snapshots." />;
    }

    if (lapData.length === 0) {
        return <div className="text-gray-400 text-center py-4">No lap time data available for this race</div>;
    }

    // Prepare chart data
    const filteredData = lapData.filter(d => selectedDrivers.includes(d.driver.driverId));
    
    const chartData = {
        labels: filteredData[0]?.laps.map(lap => lap.lap) || [],
        datasets: filteredData.map(driverData => {
            const teamColor = getTeamColor(driverData.constructor.constructorId);
            return {
                label: `${driverData.driver.givenName} ${driverData.driver.familyName}`,
                data: driverData.laps.map(lap => {
                    // Convert lap time (1:23.456) to seconds
                    const parts = lap.time.split(':');
                    const minutes = parseInt(parts[0]);
                    const seconds = parseFloat(parts[1]);
                    return (minutes * 60 + seconds).toFixed(3);
                }),
                borderColor: teamColor,
                backgroundColor: teamColor + '20',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.1
            };
        })
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                display: true,
                position: 'bottom',
                labels: {
                    color: '#d1d5db',
                    font: { size: 11 },
                    boxWidth: 12,
                    padding: 10
                }
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#fff',
                bodyColor: '#d1d5db',
                callbacks: {
                    label: function(context) {
                        const seconds = parseFloat(context.parsed.y);
                        const mins = Math.floor(seconds / 60);
                        const secs = (seconds % 60).toFixed(3);
                        return `${context.dataset.label}: ${mins}:${secs.padStart(6, '0')}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    callback: function(value) {
                        const mins = Math.floor(value / 60);
                        const secs = Math.floor(value % 60);
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                    }
                },
                grid: {
                    color: 'rgba(75, 85, 99, 0.2)'
                },
                title: {
                    display: true,
                    text: 'Lap Time',
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    maxTicksLimit: 20
                },
                grid: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Lap Number',
                    color: '#9ca3af',
                    font: { size: 11 }
                }
            }
        }
    };

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

    const selectedDriversData = driverOptions.filter(d => selectedDrivers.includes(d.driver.driverId));
    const availableDrivers = driverOptions
        .filter(d => !selectedDrivers.includes(d.driver.driverId))
        .sort((a, b) => Number(b.hasLapData) - Number(a.hasLapData));
    const filteredDrivers = searchInput
        ? availableDrivers.filter(d => {
            const fullName = `${d.driver.givenName} ${d.driver.familyName}`.toLowerCase();
            const code = (d.driver.code || '').toLowerCase();
            const search = searchInput.toLowerCase();
            return fullName.includes(search) || code.includes(search);
        })
        : availableDrivers;


    return (
        <div className="mt-6">
            <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "#E10600" }} aria-hidden="true">
                    🏎️
                </span>
                <span>Lap Time Analysis</span>
            </h4>
            <div className="relative">
                <div className="bg-gray-900/80 border border-gray-600 rounded-lg p-2 focus-within:border-red-500 transition-colors">
                    <div className="flex flex-wrap gap-2">
                        {/* Selected Driver Tags */}
                        {selectedDriversData.map((driverData) => {
                            const teamColor = getTeamColor(driverData.constructor.constructorId);
                            return (
                                <div
                                    key={driverData.driver.driverId}
                                    className="flex items-center gap-2 px-2 py-1 rounded border transition-all"
                                    style={{
                                        backgroundColor: `${teamColor}30`,
                                        borderColor: teamColor
                                    }}
                                >
                                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                        <img
                                            src={getDriverHeadshotUrl(`${driverData.driver.givenName} ${driverData.driver.familyName}`)}
                                            alt={driverData.driver.familyName}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => handleDriverImageError(e, driverData.driver, getTeamColor(driverData.constructor.constructorId))}
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-white">
                                        {driverData.driver.givenName} {driverData.driver.familyName}
                                    </span>
                                    {!driverData.hasLapData && (
                                        <span className="text-[10px] uppercase tracking-wide text-yellow-400 bg-yellow-500/10 border border-yellow-500/40 rounded px-1 py-0.5">
                                            No lap data
                                        </span>
                                    )}
                                    {selectedDrivers.length > 1 && (
                                        <button
                                            onClick={() => removeDriver(driverData.driver.driverId)}
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
                        {filteredDrivers.map((driverData) => {
                            const teamColor = getTeamColor(driverData.constructor.constructorId);
                            return (
                                <button
                                    key={driverData.driver.driverId}
                                    onClick={() => {
                                        addDriver(driverData.driver.driverId);
                                        setSearchInput('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left hover:bg-gray-700 ${driverData.hasLapData ? '' : 'opacity-75'}`}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-900 flex-shrink-0 ring-2"
                                        style={{ ringColor: teamColor }}>
                                        <img
                                            src={getDriverHeadshotUrl(`${driverData.driver.givenName} ${driverData.driver.familyName}`)}
                                            alt={driverData.driver.familyName}
                                            className="w-full h-full object-cover object-top"
                                            onError={(e) => handleDriverImageError(e, driverData.driver, getTeamColor(driverData.constructor.constructorId))}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-semibold text-white">
                                            {driverData.driver.givenName} {driverData.driver.familyName}
                                        </div>
                                        <div className="text-xs text-gray-400">{driverData.constructor.name}</div>
                                        {!driverData.hasLapData && (
                                            <div className="text-[11px] text-yellow-500 mt-1">Lap data unavailable</div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Chart */}
            {selectedDrivers.length === 0 ? (
                <div className="text-gray-400 text-center py-8 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    Select at least one driver to view lap times
                </div>
            ) : filteredData.length > 0 ? (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <div style={{ height: '400px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            ) : (
                <div className="text-gray-400 text-center py-8 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    Lap time data is unavailable for the currently selected drivers
                </div>
            )}
        </div>
    );
};


// Enhanced Race Card with Images and Results
const RaceCard = ({ race, isExpanded, onToggle, onImageClick }) => {
    const raceDate = new Date(race.date + 'T' + race.time);
    const circuitData = getCircuitData(race.Circuit.circuitId);
    const circuitImgUrl = getCircuitImageUrl(race.Circuit.circuitId);

    return (
        <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden transition-all duration-300">
            <button onClick={onToggle} className="w-full text-left p-4 sm:p-6 flex justify-between items-center hover:bg-gray-700/30 gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                        <span className="text-xs font-bold text-gray-400 mr-2 whitespace-nowrap">Round {race.round}</span>
                        <span className={`text-xs font-bold uppercase py-1 px-2 rounded-full ${
                            race.isPast ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'
                        }`}>
                            {race.isPast ? 'Completed' : 'Upcoming'}
                        </span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{race.raceName}</h3>
                    <p className="text-sm text-gray-400">{race.Circuit.circuitName}</p>
                    <p className="text-sm text-gray-500">{race.Circuit.Location.locality}, {race.Circuit.Location.country}</p>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                        {raceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Circuit Image Preview */}
                {circuitImgUrl && (
                    <div 
                        className="flex-shrink-0 w-24 h-16 sm:w-32 sm:h-20 bg-white/5 rounded-lg border border-gray-700/30 p-1 cursor-pointer hover:border-red-500/50 transition-colors"
                        onClick={onImageClick}
                        title="Click to view full circuit map"
                    >
                        <img
                            src={circuitImgUrl}
                            alt={`${race.Circuit.circuitName} layout`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                <div className={`transform transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                </div>
            </button>

            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                <div className="px-4 sm:px-6 pb-6 pt-2">
                    <div className="border-t border-gray-700 pt-4">
                        {/* Circuit Information */}
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Circuit Description */}
                            {circuitData?.description && (
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                    <h4 className="text-sm font-semibold text-red-400 mb-2">About the Circuit</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed">{circuitData.description}</p>
                                </div>
                            )}

                            {/* Circuit Details */}
                            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                                <h4 className="text-sm font-semibold text-red-400 mb-3">Circuit Information</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Location:</span>
                                        <span className="text-white font-semibold">{race.Circuit.Location.locality}, {race.Circuit.Location.country}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Circuit:</span>
                                        <span className="text-white font-semibold">{race.Circuit.circuitName}</span>
                                    </div>
                                    {circuitData?.lapTime && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Lap Record:</span>
                                            <span className="text-white font-semibold font-mono">{circuitData.lapTime}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Race Date:</span>
                                        <span className="text-white font-semibold">
                                            {raceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Race Time:</span>
                                        <span className="text-white font-semibold">
                                            {raceDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 whitespace-nowrap">Round:</span>
                                        <span className="text-white font-semibold whitespace-nowrap">{race.round} / {race.season}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

             {/* Race Results */}
{race.results && race.results.length > 0 ? (
    <div>
        <h4 className="text-md font-semibold text-white mb-3">
            {race.isPast ? 'Race Results' : 'Previous Year Results'}
        </h4>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 uppercase">Pos.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 uppercase">No.</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 uppercase">Driver</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 uppercase">Team</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-300 uppercase">Laps</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-300 uppercase">Time / Retired</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-300 uppercase">Pts.</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                    {race.results.slice(0, 10).map((result) => {
                        const teamColor = getTeamColor(result.Constructor.constructorId);
                        return (
                            <tr 
                                key={result.position}
                                className="transition-all duration-200 hover:shadow-lg"
                                style={{ 
                                    backgroundColor: `${teamColor}15`,
                                    borderLeft: `4px solid ${teamColor}` 
                                }}
                            >
                                {/* Position */}
                                <td className="px-3 py-3">
                                    <div className="w-8 text-center font-bold text-gray-400">
                                        {result.position}
                                    </div>
                                </td>
                                
                                {/* Driver Number */}
                                <td className="px-3 py-3">
                                    <div className="text-sm font-semibold text-gray-300">
                                        {result.Driver.permanentNumber || '-'}
                                    </div>
                                </td>
                                
                                {/* Driver Name with Avatar */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 mx-3" style={{ borderColor: teamColor }}>
                                            <img
                                                src={getDriverHeadshotUrl(result.Driver)}
                                                alt={result.Driver.familyName}
                                                className="w-full h-full object-contain"
                                                onError={(e) => handleDriverImageError(e, result.Driver, getTeamColor(result.Constructor.constructorId))}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-white">
                                                {result.Driver.givenName} {result.Driver.familyName}
                                            </span>
                                            <span className="text-xs">{getNationalityFlag(normalizeNationality(result.Driver.nationality))}</span>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* Team with Logo */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center p-2" style={{ backgroundColor: teamColor }}>
                                            {getTeamLogoUrl(result.Constructor.constructorId) ? (
                                                <img
                                                    src={getTeamLogoUrl(result.Constructor.constructorId)}
                                                    alt={result.Constructor.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-white">${result.Constructor.name.slice(0, 3).toUpperCase()}</span>`;
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-white">
                                                    {result.Constructor.name.slice(0, 3).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-semibold text-white">{result.Constructor.name}</span>
                                    </div>
                                </td>
                                
                                {/* Laps */}
                                <td className="px-3 py-3 text-center">
                                    <div className="text-sm font-semibold text-white">
                                        {result.laps || '-'}
                                    </div>
                                </td>
                                
                                {/* Time / Retired */}
                                <td className="px-3 py-3">
                                    <div className="text-sm font-semibold text-white">
                                        {result.Time?.time || result.status}
                                    </div>
                                </td>
                                
                                {/* Points */}
                                <td className="px-3 py-3">
                                    <div className="text-sm font-bold text-white text-center">
                                        {result.points}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
        
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-2">
            {race.results.slice(0, 10).map((result) => {
                const teamColor = getTeamColor(result.Constructor.constructorId);
                return (
                    <div 
                        key={result.position}
                        className="flex items-center p-3 transition-all duration-200 hover:shadow-lg rounded"
                        style={{ backgroundColor: `${teamColor}15`, borderLeft: `4px solid ${teamColor}` }}
                    >
                        <div className="w-8 text-center font-bold text-gray-400">{result.position}</div>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 mx-3" style={{ borderColor: teamColor }}>
                            <img
                                src={getDriverHeadshotUrl(result.Driver)}
                                alt={result.Driver.familyName}
                                className="w-full h-full object-contain"
                                onError={(e) => handleDriverImageError(e, result.Driver, getTeamColor(result.Constructor.constructorId))}
                            />
                        </div>
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-white">
                                {result.Driver.givenName} {result.Driver.familyName}
                            </div>
                            <div className="text-xs text-gray-400">
                                {result.Constructor.name} • {result.laps || '-'} laps • {result.Time?.time || result.status}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-bold text-white">{result.points}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
) : (
    <p className="text-gray-400 text-center py-8">No results available yet</p>
)}
            


                        {/* Fastest Lap Times - REMOVED */}
                        {false && race.isPast && fastestLaps.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                                    <span>⏱️</span> Fastest Lap Times
                                </h4>
                                <div className="space-y-2">
                                    {fastestLaps
                                        .sort((a, b) => parseInt(a.fastestLap.rank) - parseInt(b.fastestLap.rank))
                                        .slice(0, 10)
                                        .map((lapData) => {
                                            const teamColor = getTeamColor(lapData.constructor.constructorId);
                                            return (
                                                <div
                                                    key={lapData.position}
                                                    className="flex items-center p-3 transition-all duration-200 hover:shadow-lg rounded"
                                                    style={{
                                                        backgroundColor: `${teamColor}15`,
                                                        borderLeft: `4px solid ${teamColor}`
                                                    }}
                                                >
                                                    <div className="w-8 text-center font-bold text-yellow-400">
                                                        {lapData.fastestLap.rank}
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 mx-3"
                                                        style={{ borderColor: teamColor }}>
                                                        <img
                                                            src={getDriverHeadshotUrl(lapData.driver)}
                                                            alt={lapData.driver.familyName}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => handleDriverImageError(e, lapData.driver, getTeamColor(lapData.constructor.constructorId))}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-bold text-white">
                                                            {lapData.driver.givenName} {lapData.driver.familyName}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            Lap {lapData.fastestLap.lap}
                                                            {lapData.fastestLap.averageSpeed && (
                                                                <span>&nbsp;• {lapData.fastestLap.averageSpeed.speed} {lapData.fastestLap.averageSpeed.units}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right mr-3">
                                                        <div className="text-sm font-bold text-yellow-400 font-mono">{lapData.fastestLap.time}</div>
                                                        <div className="text-xs text-gray-400">lap time</div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center p-1.5"
                                                        style={{ backgroundColor: teamColor }}>
                                                        {getTeamLogoUrl(lapData.constructor.constructorId) ? (
                                                            <img
                                                                src={getTeamLogoUrl(lapData.constructor.constructorId)}
                                                                alt={lapData.constructor.name}
                                                                className="w-full h-full object-contain"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-white">${lapData.constructor.name.slice(0, 3).toUpperCase()}</span>`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-xs font-bold text-white">
                                                                {lapData.constructor.name.slice(0, 3).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}

                        {/* Lap Time Chart */}
                        {race.isPast && <LapTimeChart race={race} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Race Calendar Component with Images and Results
const RaceCalendarEnhanced = ({ schedule, loading }) => {
    const [expandedRace, setExpandedRace] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'previous'
    const [circuitModal, setCircuitModal] = useState({ isOpen: false, race: null });

    // Filter races based on selected tab
    const filteredSchedule = useMemo(() => {
        if (filter === 'upcoming') {
            return schedule.filter(race => !race.isPast);
        } else if (filter === 'previous') {
            return schedule.filter(race => race.isPast);
        }
        return schedule;
    }, [schedule, filter]);

    // Count races for each category
    const counts = useMemo(() => ({
        all: schedule.length,
        upcoming: schedule.filter(r => !r.isPast).length,
        previous: schedule.filter(r => r.isPast).length
    }), [schedule]);

    const handleToggle = (round) => {
        setExpandedRace(expandedRace === round ? null : round);
    };

    const openCircuitModal = (race, e) => {
        e.stopPropagation(); // Prevent expanding the race card
        setCircuitModal({ isOpen: true, race });
    };

    const closeCircuitModal = () => {
        setCircuitModal({ isOpen: false, race: null });
    };

    if (loading) {
        return <LoadingSpinner message="Loading race calendar..." subtext="Fetching the latest schedule and results from the Ergast API." />;
    }

    if (schedule.length === 0) return <div className="text-center p-8 text-gray-400">No races available</div>;

    return (
        <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-white flex items-center mb-4">
                    <CalendarIcon /> 2025 Race Calendar
                </h2>

                {/* Filter Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                            filter === 'all'
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        All Races
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filter === 'all' ? 'bg-white/20' : 'bg-gray-600'
                        }`}>
                            {counts.all}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                            filter === 'upcoming'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        Upcoming
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filter === 'upcoming' ? 'bg-white/20' : 'bg-gray-600'
                        }`}>
                            {counts.upcoming}
                        </span>
                    </button>
                    <button
                        onClick={() => setFilter('previous')}
                        className={`w-full px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-between sm:justify-center gap-2 ${
                            filter === 'previous'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        Previous
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            filter === 'previous' ? 'bg-white/20' : 'bg-gray-600'
                        }`}>
                            {counts.previous}
                        </span>
                    </button>
                </div>

                {/* Race List */}
                {filteredSchedule.length > 0 ? (
                    <div className="space-y-4">
                        {filteredSchedule.map((race) => (
                            <RaceCard
                                key={race.round}
                                race={race}
                                isExpanded={expandedRace === race.round}
                                onToggle={() => handleToggle(race.round)}
                                onImageClick={(e) => openCircuitModal(race, e)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-8 text-gray-400">
                        No {filter} races found
                    </div>
                )}
            </div>

            {/* Circuit Map Modal */}
            {circuitModal.isOpen && circuitModal.race && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={closeCircuitModal}
                >
                    <div 
                        className="bg-gray-900 rounded-lg shadow-2xl max-w-5xl w-full overflow-hidden border border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 bg-gray-800/50 border-b border-gray-700">
                            <div>
                                <h3 className="text-xl font-bold text-white">{circuitModal.race.raceName}</h3>
                                <p className="text-sm text-gray-400">{circuitModal.race.Circuit.circuitName}</p>
                            </div>
                            <button 
                                onClick={closeCircuitModal}
                                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body - Circuit Map */}
                        <div className="bg-black p-4">
                            <img 
                                src={getCircuitImageUrl(circuitModal.race.Circuit.circuitId)}
                                alt={`${circuitModal.race.Circuit.circuitName} full layout`}
                                className="w-full h-auto max-h-[70vh] object-contain"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div class="text-center text-gray-400 py-12">Circuit map not available</div>';
                                }}
                            />
                        </div>

                        {/* Modal Footer - Circuit Info */}
                        <div className="p-4 bg-gray-800/30">
                            <p className="text-sm text-gray-300">
                                {getCircuitData(circuitModal.race.Circuit.circuitId).description}
                            </p>
                            <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                                <span>📍 {circuitModal.race.Circuit.Location.locality}, {circuitModal.race.Circuit.Location.country}</span>
                                <span>📅 {new Date(circuitModal.race.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---
export default function App() {
    const [activeTab, setActiveTab] = useState('Dashboard');

    // Fetch data
    const { nextRace, countdown, loading: nextRaceLoading } = useNextRace();
    const { lastRace, loading: lastRaceLoading } = useLastRace();
    const { standings: driverStandings, loading: driverLoading } = useDriverStandingsErgast();
    const { standings: constructorStandings, loading: constructorLoading } = useConstructorStandings();
    const { schedule, loading: scheduleLoading } = useScheduleWithResults();

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                return (
                    <DashboardOverview
                        nextRace={nextRace}
                        countdown={countdown}
                        nextRaceLoading={nextRaceLoading}
                        lastRace={lastRace}
                        lastRaceLoading={lastRaceLoading}
                        driverStandings={driverStandings}
                        driverLoading={driverLoading}
                        constructorStandings={constructorStandings}
                        constructorLoading={constructorLoading}
                    />
                );
            case 'Drivers':
                return <DriverStandingsCard standings={driverStandings} loading={driverLoading} />;
            case 'Constructors':
                return <ConstructorStandingsCard standings={constructorStandings} loading={constructorLoading} />;
            case 'Calendar':
                return <RaceCalendarEnhanced schedule={schedule} loading={scheduleLoading} />;
            case 'Season Analysis':
                return <SeasonAnalysis />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans" style={{background: 'radial-gradient(circle, rgba(23,23,33,1) 0%, rgba(17,24,39,1) 100%)'}}>
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="container mx-auto p-4 sm:p-6 lg:p-8 mb-20 md:mb-0">
                {renderContent()}
            </main>

            <footer className="text-center py-6 text-sm text-gray-500">
                <p>F1 STATS Dashboard | Data from <a href="https://api.jolpi.ca/ergast/" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">Ergast API</a></p>
                <p>This is a concept and not an official F1 product.</p>
            </footer>

            {/* Mobile Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700 flex justify-around p-2 z-20">
                 {[
                    { name: 'Dashboard', icon: <HomeIcon /> },
                    { name: 'Drivers', icon: <UsersIcon /> },
                    { name: 'Constructors', icon: <TrophyIcon /> },
                    { name: 'Calendar', icon: <CalendarIcon /> },
                    { name: 'Season Analysis', icon: <TrendIcon /> }
                ].map((tab) => (
                    <button
                        key={tab.name}
                        onClick={() => setActiveTab(tab.name)}
                        className={`flex flex-col items-center justify-center text-xs py-1 px-2 rounded-md transition-colors ${
                            activeTab === tab.name ? 'text-red-500' : 'text-gray-400'
                        }`}
                    >
                        {tab.icon}
                        <span className="mt-1">{tab.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
