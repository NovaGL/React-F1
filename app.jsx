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
import { LAP_TIME_DRIVER_LIMIT } from './config';

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
        ErgastAPI.getNextRace()
            .then(race => {
                setNextRace(race);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching next race:', err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!nextRace) return;

        const interval = setInterval(() => {
            const now = new Date();
            const raceDate = new Date(nextRace.date + 'T' + nextRace.time);
            const diff = raceDate - now;

            if (diff > 0) {
                setCountdown({
                    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((diff / 1000 / 60) % 60),
                    seconds: Math.floor((diff / 1000) % 60)
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [nextRace]);

    return { nextRace, countdown, loading };
};

// Hook for Last Race Results
const useLastRace = () => {
    const [lastRace, setLastRace] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ErgastAPI.getLastRaceResults()
            .then(race => {
                setLastRace(race);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching last race:', err);
                setLoading(false);
            });
    }, []);

    return { lastRace, loading };
};

// Hook for Driver Standings (Ergast)
const useDriverStandingsErgast = () => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ErgastAPI.getDriverStandings()
            .then(data => {
                setStandings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching driver standings:', err);
                setLoading(false);
            });
    }, []);

    return { standings, loading };
};

// Hook for Constructor Standings
const useConstructorStandings = () => {
    const [standings, setStandings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        ErgastAPI.getConstructorStandings()
            .then(data => {
                setStandings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching constructor standings:', err);
                setLoading(false);
            });
    }, []);

    return { standings, loading };
};

// Hook for Schedule with Results
const useScheduleWithResults = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchScheduleWithResults = async () => {
            try {
                const races = await ErgastAPI.getCurrentSchedule();

                const racesWithData = [];

                for (const race of races) {
                    const now = new Date();
                    const raceDate = new Date(race.date + 'T' + race.time);
                    const isPast = raceDate < now;

                    let results = null;

                    if (isPast) {
                        try {
                            const raceResults = await ErgastAPI.getRaceResults(race.season, race.round);
                            results = raceResults?.Results || null;
                        } catch (err) {
                            console.log(`No current results for ${race.raceName}`);
                        }
                    }

                    if (!results) {
                        try {
                            const prevRace = await ErgastAPI.getPreviousYearRace(race.Circuit.circuitId, parseInt(race.season, 10));
                            results = prevRace?.Results || null;
                        } catch (err) {
                            console.log(`No previous year results for ${race.raceName}`);
                        }
                    }

                    racesWithData.push({ ...race, results, isPast });
                }

                setSchedule(racesWithData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching schedule:', err);
                setLoading(false);
            }
        };

        fetchScheduleWithResults();
    }, []);

    return { schedule, loading };
};

// --- COMPONENTS ---

const Header = ({ activeTab, setActiveTab }) => (
    <header className="bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
       <div className="flex items-center">
    <h1 className="text-2xl font-bold text-white tracking-wider flex items-center">
        <F1Logo height={18} />
        <span className="f1-stats text-white italic" style={{marginLeft: '-1px', transform: 'translateX(-1px)'}}>
           STATS
        </span>
    </h1>                    
</div>

                <nav className="hidden md:flex items-center space-x-2">
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
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center ${
                                activeTab === tab.name
                                    ? 'bg-red-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                        >
                            {tab.icon}
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    </header>
);

// Dashboard Overview Component
const DashboardOverview = ({ nextRace, countdown, nextRaceLoading, lastRace, lastRaceLoading, driverStandings, driverLoading, constructorStandings, constructorLoading }) => {
    if (nextRaceLoading || lastRaceLoading || driverLoading || constructorLoading) {
        return <div className="text-center p-8 text-gray-300">Loading dashboard...</div>;
    }

    const raceDate = nextRace ? new Date(nextRace.date + 'T' + nextRace.time) : null;

    return (
        <div className="space-y-6">
            {/* Next Race Countdown - Hero Section */}
            {nextRace && (
                <div className="bg-gradient-to-r from-red-600/20 to-gray-800/50 rounded-lg shadow-xl overflow-hidden border border-red-500/20">
                    <div className="p-6">
                        <div className="flex items-center mb-4">
                            <ClockIcon />
                            <h2 className="text-2xl font-bold text-white">Next Race</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-3xl font-bold text-red-500 mb-2">{nextRace.raceName}</h3>
                                <p className="text-xl text-gray-300 mb-1">{nextRace.Circuit.circuitName}</p>
                                <p className="text-lg text-gray-400 mb-4">{nextRace.Circuit.Location.locality}, {nextRace.Circuit.Location.country}</p>
                                <p className="text-md text-gray-400 font-mono">
                                    {raceDate?.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="bg-gray-900/50 p-6 rounded-lg">
                                <h4 className="text-lg font-semibold text-gray-300 mb-4 text-center">Countdown</h4>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-500">{countdown.days}</div>
                                        <div className="text-xs text-gray-400 uppercase">Days</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-500">{countdown.hours}</div>
                                        <div className="text-xs text-gray-400 uppercase">Hours</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-500">{countdown.minutes}</div>
                                        <div className="text-xs text-gray-400 uppercase">Mins</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-red-500">{countdown.seconds}</div>
                                        <div className="text-xs text-gray-400 uppercase">Secs</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Championship Leaders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Driver Championship Leader */}
                {driverStandings.length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                        <div className="p-4 bg-gray-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <UsersIcon /> Driver Championship Leader
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center mb-4 transition-all duration-200 hover:shadow-lg rounded-lg"
                                style={{
                                    backgroundColor: `${getTeamColor(driverStandings[0].Constructors[0]?.constructorId)}15`,
                                    borderLeft: `4px solid ${getTeamColor(driverStandings[0].Constructors[0]?.constructorId)}`
                                }}>
                                <div className="p-3 flex items-center flex-1 gap-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-900 flex-shrink-0"
                                        style={{ borderColor: getTeamColor(driverStandings[0].Constructors[0]?.constructorId) }}>
                                        <img
                                            src={getDriverHeadshotUrl(driverStandings[0].Driver)}
                                            alt={driverStandings[0].Driver.familyName}
                                            className="w-full h-full object-contain"
                                            onError={(e) => handleDriverImageError(e, driverStandings[0].Driver, getTeamColor(driverStandings[0].Constructors[0]?.constructorId))}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-2xl font-bold text-white">
                                            {driverStandings[0].Driver.givenName} {driverStandings[0].Driver.familyName}
                                        </div>
                                        <div className="text-md text-gray-400">{driverStandings[0].Constructors[0]?.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-red-500">{driverStandings[0].points}</div>
                                        <div className="text-xs text-gray-400">POINTS</div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-gray-900/50 p-3 rounded">
                                    <div className="text-xl font-bold text-yellow-400">{driverStandings[0].wins}</div>
                                    <div className="text-xs text-gray-400">Wins</div>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded">
                                    <div className="text-xl font-bold text-gray-300">
                                        {driverStandings[1] ? parseInt(driverStandings[0].points) - parseInt(driverStandings[1].points) : 0}
                                    </div>
                                    <div className="text-xs text-gray-400">Lead</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Constructor Championship Leader */}
                {constructorStandings.length > 0 && (
                    <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                        <div className="p-4 bg-gray-900/50">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <TrophyIcon /> Constructor Championship Leader
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center mb-4 transition-all duration-200 hover:shadow-lg rounded-lg"
                                style={{
                                    backgroundColor: `${getTeamColor(constructorStandings[0].Constructor.constructorId)}15`,
                                    borderLeft: `4px solid ${getTeamColor(constructorStandings[0].Constructor.constructorId)}`
                                }}>
                                <div className="p-3 flex items-center flex-1 gap-4">
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center p-3 flex-shrink-0"
                                        style={{ backgroundColor: getTeamColor(constructorStandings[0].Constructor.constructorId) }}>
                                        {getTeamLogoUrl(constructorStandings[0].Constructor.constructorId) ? (
                                            <img
                                                src={getTeamLogoUrl(constructorStandings[0].Constructor.constructorId)}
                                                alt={constructorStandings[0].Constructor.name}
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `<span class="text-sm font-bold text-white">${constructorStandings[0].Constructor.name.slice(0, 3).toUpperCase()}</span>`;
                                                }}
                                            />
                                        ) : (
                                            <span className="text-sm font-bold text-white">
                                                {constructorStandings[0].Constructor.name.slice(0, 3).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-2xl font-bold text-white">{constructorStandings[0].Constructor.name}</div>
                                        <div className="text-md text-gray-400 flex items-center gap-2">
                                            <span className="text-lg">{getNationalityFlag(normalizeNationality(constructorStandings[0].Constructor.nationality))}</span>
                                            {constructorStandings[0].Constructor.nationality}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-bold text-red-500">{constructorStandings[0].points}</div>
                                        <div className="text-xs text-gray-400">POINTS</div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-gray-900/50 p-3 rounded">
                                    <div className="text-xl font-bold text-yellow-400">{constructorStandings[0].wins}</div>
                                    <div className="text-xs text-gray-400">Wins</div>
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded">
                                    <div className="text-xl font-bold text-gray-300">
                                        {constructorStandings[1] ? parseInt(constructorStandings[0].points) - parseInt(constructorStandings[1].points) : 0}
                                    </div>
                                    <div className="text-xs text-gray-400">Lead</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Last Race Results Summary */}
            {lastRace && (
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 bg-gray-900/50">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            <FlagIcon /> Last Race - {lastRace.raceName}
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {lastRace.Results?.slice(0, 3).map((result, index) => {
                                const teamColor = getTeamColor(result.Constructor.constructorId);
                                return (
                                    <div
                                        key={result.position}
                                        className="transition-all duration-200 hover:shadow-lg"
                                        style={{
                                            backgroundColor: `${teamColor}15`,
                                            borderLeft: `4px solid ${teamColor}`
                                        }}
                                    >
                                        <div className="p-4 flex items-center justify-between">
                                            <div className="flex items-center flex-1">
                                                <div className={`text-4xl font-bold mr-3 ${
                                                    index === 0 ? 'text-yellow-400' :
                                                    index === 1 ? 'text-gray-300' :
                                                    'text-orange-400'
                                                }`}>
                                                    {result.position}
                                                </div>
                                                <div className="flex-1 ml-3">
                                                    <div className="text-lg font-bold text-white">
                                                        {result.Driver.givenName} {result.Driver.familyName}
                                                    </div>
                                                    <div className="text-sm text-gray-400">{result.Constructor.name}</div>
                                                </div>
                                            </div>
                                            <img
                                                src={getTeamLogoUrl(result.Constructor.constructorId)}
                                                alt={result.Constructor.name}
                                                className="w-14 h-14 ml-3 rounded opacity-90 object-contain"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Top 5 Drivers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 bg-gray-900/50">
                        <h3 className="text-lg font-bold text-white">Top 5 Drivers</h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            {driverStandings.slice(0, 5).map((standing, index) => {
                                const teamColor = getTeamColor(standing.Constructors[0]?.constructorId);
                                return (
                                    <div key={standing.position}
                                        className="flex items-center p-3 transition-all duration-200 hover:shadow-lg rounded"
                                        style={{
                                            backgroundColor: `${teamColor}15`,
                                            borderLeft: `4px solid ${teamColor}`
                                        }}>
                                        <div className="w-8 text-center font-bold text-gray-400">{index + 1}</div>
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 mx-3"
                                            style={{ borderColor: teamColor }}>
                                            <img
                                                src={getDriverHeadshotUrl(standing.Driver)}
                                                alt={standing.Driver.familyName}
                                                className="w-full h-full object-contain"
                                                onError={(e) => handleDriverImageError(e, standing.Driver, getTeamColor(standing.Constructors[0]?.constructorId))}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white">
                                                {standing.Driver.givenName} {standing.Driver.familyName}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{standing.points}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Top 5 Constructors */}
                <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-4 bg-gray-900/50">
                        <h3 className="text-lg font-bold text-white">Top 5 Constructors</h3>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            {constructorStandings.slice(0, 5).map((standing, index) => {
                                const teamColor = getTeamColor(standing.Constructor.constructorId);
                                return (
                                    <div key={standing.position}
                                        className="flex items-center p-3 transition-all duration-200 hover:shadow-lg rounded"
                                        style={{
                                            backgroundColor: `${teamColor}15`,
                                            borderLeft: `4px solid ${teamColor}`
                                        }}>
                                        <div className="w-8 text-center font-bold text-gray-400">{index + 1}</div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center p-2 mx-3"
                                            style={{ backgroundColor: teamColor }}>
                                            {getTeamLogoUrl(standing.Constructor.constructorId) ? (
                                                <img
                                                    src={getTeamLogoUrl(standing.Constructor.constructorId)}
                                                    alt={standing.Constructor.name}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-white">${standing.Constructor.name.slice(0, 3).toUpperCase()}</span>`;
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-xs font-bold text-white">
                                                    {standing.Constructor.name.slice(0, 3).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-semibold text-white">{standing.Constructor.name}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{standing.points}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Enhanced Driver Standings Component with Multi-Year Tabs
const DriverStandingsCard = ({ standings, loading }) => {
    const [selectedYear, setSelectedYear] = useState(2025);
    const [yearStandings, setYearStandings] = useState({});
    const [loadingYear, setLoadingYear] = useState(false);
    const [expandedDriver, setExpandedDriver] = useState(null);
    // cache summaries by driverId: { loading: bool, text: string|null, wikiUrl: string|null }
    const [driverSummaries, setDriverSummaries] = useState({});

    const years = [2025, 2024, 2023];

    // When a driver is expanded, fetch a short summary (Wikipedia) if we don't have it cached
    useEffect(() => {
        let mounted = true;
        const loadSummary = async () => {
            if (!expandedDriver) return;

            // Find driver entry for the expanded driver id in currentStandings
            const driverEntry = currentStandings.find(s => s.Driver.driverId === expandedDriver);
            if (!driverEntry) return;

            const id = driverEntry.Driver.driverId;
            if (driverSummaries[id]) return; // already cached

            // mark loading
            setDriverSummaries(prev => ({ ...prev, [id]: { loading: true, text: null, wikiUrl: null } }));

            try {
                let summary = null;
                let wikiUrl = null;

                // Prefer Ergast-provided wiki url then fetch the summary if possible
                if (ErgastAPI.getDriverWikiUrlById) {
                    try {
                        wikiUrl = await ErgastAPI.getDriverWikiUrlById(driverEntry.Driver.driverId, selectedYear || 'current');
                        if (wikiUrl) {
                            // fetch summary via REST API using title from wikiUrl
                            const parts = wikiUrl.split('/');
                            const title = decodeURIComponent(parts[parts.length - 1]);
                            const wikiApi = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
                            const res = await fetch(wikiApi);
                            if (res.ok) {
                                const data = await res.json();
                                summary = data.extract || null;
                            }
                        }
                    } catch (err) {
                        console.warn('Error fetching summary from Ergast-provided wiki url', err);
                        wikiUrl = null;
                    }
                }

                // Fallback to getDriverSummaryById helper (which tries Ergast list + wiki REST) or name-based lookup
                if (!summary && ErgastAPI.getDriverSummaryById) {
                    try {
                        summary = await ErgastAPI.getDriverSummaryById(driverEntry.Driver.driverId, selectedYear || 'current');
                    } catch (err) {
                        console.warn('Error in getDriverSummaryById', err);
                    }
                }

                if (!summary && ErgastAPI.getDriverSummary) {
                    try {
                        summary = await ErgastAPI.getDriverSummary(driverEntry.Driver.givenName, driverEntry.Driver.familyName);
                        if (summary && !wikiUrl && ErgastAPI.buildWikiUrlForName) {
                            wikiUrl = ErgastAPI.buildWikiUrlForName(driverEntry.Driver.givenName, driverEntry.Driver.familyName);
                        }
                    } catch (err) {
                        console.warn('Error fetching name-based driver summary', err);
                    }
                }

                if (!mounted) return;
                setDriverSummaries(prev => ({ ...prev, [id]: { loading: false, text: summary || null, wikiUrl: wikiUrl || null } }));
            } catch (err) {
                console.warn('Error fetching driver summary', err);
                if (mounted) setDriverSummaries(prev => ({ ...prev, [id]: { loading: false, text: null, wikiUrl: null } }));
            }
        };

        loadSummary();

        return () => { mounted = false; };
    }, [expandedDriver]);

    // Load standings for a specific year
    useEffect(() => {
        if (!yearStandings[selectedYear]) {
            setLoadingYear(true);
            ErgastAPI.getDriverStandings(selectedYear)
                .then(data => {
                    setYearStandings(prev => ({ ...prev, [selectedYear]: data }));
                    setLoadingYear(false);
                })
                .catch(err => {
                    console.error(`Error fetching ${selectedYear} standings:`, err);
                    setLoadingYear(false);
                });
        }
    }, [selectedYear, yearStandings]);

    // Initialize current year standings from props
    useEffect(() => {
        if (standings && standings.length > 0 && !yearStandings[2025]) {
            setYearStandings(prev => ({ ...prev, 2025: standings }));
        }
    }, [standings, yearStandings]);

    const currentStandings = yearStandings[selectedYear] || [];
    const isLoading = loading || loadingYear;

    if (isLoading && currentStandings.length === 0) {
        return <div className="text-center p-8 text-gray-300">Loading driver standings...</div>;
    }

    return (
        <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold text-white flex items-center mb-4">
                    <UsersIcon /> Driver Championship
                </h2>

                {/* Year Tabs */}
                <div className="flex gap-2 mb-4">
                    {years.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                selectedYear === year
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile-friendly compact view */}
            <div className="block sm:hidden space-y-3 px-4 pb-4">
                {currentStandings.map((standing) => {
                    const teamColor = getTeamColor(standing.Constructors[0]?.constructorId);
                    const isExpanded = expandedDriver === standing.Driver.driverId;
                    const summaryObj = driverSummaries[standing.Driver.driverId] || { loading: false, text: null, wikiUrl: null };

                    return (
                        <div
                            key={standing.position}
                            className="rounded-lg overflow-hidden transition-all duration-200"
                            style={{
                                backgroundColor: `${teamColor}15`,
                                borderLeft: `4px solid ${teamColor}`
                            }}
                        >
                            <div
                                className="p-3 cursor-pointer"
                                onClick={() => setExpandedDriver(isExpanded ? null : standing.Driver.driverId)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-2xl font-bold text-white w-8 text-center">{standing.position}</div>
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-900">
                                        <img
                                            src={getDriverHeadshotUrl(standing.Driver)}
                                            alt={standing.Driver.familyName}
                                            className="w-full h-full object-contain"
                                            onError={(e) => handleDriverImageError(e, standing.Driver, getTeamColor(standing.Constructors[0]?.constructorId))}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white truncate">
                                            {standing.Driver.givenName} {standing.Driver.familyName}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-1">
                                            #{standing.Driver.permanentNumber}&nbsp; <span className="text-base">{getNationalityFlag(normalizeNationality(standing.Driver.nationality))}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 truncate">{standing.Constructors[0]?.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-white">{standing.points}</div>
                                        <div className="text-xs text-yellow-400">{standing.wins} wins</div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Info for Mobile */}
                            {isExpanded && (
                                <div className="px-3 pb-3 border-t border-gray-700/50">
                                    <div className="mt-3 space-y-3">
                                        {/* Team Info */}
                                        <div className="flex items-center gap-2 p-2 bg-gray-900/30 rounded">
                                            <div
                                                className="w-6 h-6 rounded-full flex items-center justify-center p-1"
                                                style={{ backgroundColor: teamColor }}
                                            >
                                                {getTeamLogoUrl(standing.Constructors[0]?.constructorId) ? (
                                                    <img
                                                        src={getTeamLogoUrl(standing.Constructors[0]?.constructorId)}
                                                        alt={standing.Constructors[0]?.name}
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-white">${standing.Constructors[0]?.name.slice(0, 3).toUpperCase()}</span>`;
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-xs font-bold text-white">
                                                        {standing.Constructors[0]?.name.slice(0, 3).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-gray-300">{standing.Constructors[0]?.name}</span>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="p-2 bg-gray-900/30 rounded">
                                                <div className="text-xs text-gray-400">Wins</div>
                                                <div className="text-sm font-bold text-yellow-400">{standing.wins}</div>
                                            </div>
                                            <div className="p-2 bg-gray-900/30 rounded">
                                                <div className="text-xs text-gray-400">Podiums</div>
                                                <div className="text-sm font-bold text-gray-300">
                                                    {parseInt(standing.wins) + (standing.podiums ? parseInt(standing.podiums) - parseInt(standing.wins) : 0)}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-gray-900/30 rounded">
                                                <div className="text-xs text-gray-400">Points</div>
                                                <div className="text-sm font-bold text-white">{standing.points}</div>
                                            </div>
                                        </div>

                                        {/* About Section */}
                                        <div className="mt-3 space-y-2">
                                            <h4 className="text-xs font-semibold text-gray-400 uppercase">About</h4>
                                            {summaryObj.loading ? (
                                                <p className="text-sm text-gray-400">Loading bio...</p>
                                            ) : (
                                                <>
                                                    {summaryObj.text && (
                                                        <p className="text-xs text-gray-300 leading-relaxed">{summaryObj.text}</p>
                                                    )}
                                                    {!summaryObj.text && (
                                                        <p className="text-xs text-gray-400 italic">
                                                            {standing.Driver.givenName} {standing.Driver.familyName} is a {standing.Driver.nationality} racing driver competing in Formula 1 for {standing.Constructors[0]?.name}.
                                                        </p>
                                                    )}
                                                    {summaryObj.wikiUrl && (
                                                        <a
                                                            href={summaryObj.wikiUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-400 hover:text-blue-300 hover:underline inline-block mt-1"
                                                        >
                                                            Read on Wikipedia 
                                                        </a>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Performance Charts */}
                                        <DriverIndividualCharts
                                            driver={standing.Driver}
                                            currentYear={selectedYear}
                                            teamColor={teamColor}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-900/70">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Driver</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Team</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Wins</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase hidden md:table-cell">Podiums</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Points</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Info</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentStandings.map((standing) => {
                            const teamColor = getTeamColor(standing.Constructors[0]?.constructorId);
                            const isExpanded = expandedDriver === standing.Driver.driverId;
                            const summaryObj = driverSummaries[standing.Driver.driverId] || { loading: false, text: null, wikiUrl: null };

                            return (
                                <React.Fragment key={standing.position}>
                                    <tr
                                        className="transition-all duration-200 border-b border-gray-700/50 hover:shadow-lg cursor-pointer"
                                        style={{
                                            backgroundColor: `${teamColor}15`,
                                            borderLeft: `4px solid ${teamColor}`
                                        }}
                                        onClick={() => setExpandedDriver(isExpanded ? null : standing.Driver.driverId)}
                                    >
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-xl font-bold text-white">{standing.position}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-900"
                                                    style={{ borderColor: teamColor }}>
                                                <img
    src={getDriverHeadshotUrl(standing.Driver)}
    alt={standing.Driver.familyName}
    className="w-full h-full object-contain"
    onError={(e) => handleDriverImageError(e, standing.Driver, getTeamColor(standing.Constructors[0]?.constructorId))}
/>

                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">
                                                        {standing.Driver.givenName} {standing.Driver.familyName}
                                                    </div>
                                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                                        #{standing.Driver.permanentNumber}&nbsp; <span className="text-base">{getNationalityFlag(normalizeNationality(standing.Driver.nationality))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                             {/* Team Logo with circular colored background */}
<div
    className="w-8 h-8 rounded-full flex items-center justify-center p-1.5"
    style={{ backgroundColor: getTeamColor(standing.Constructors[0]?.constructorId) }}
>
    {getTeamLogoUrl(standing.Constructors[0]?.constructorId) ? (
        <img
            src={getTeamLogoUrl(standing.Constructors[0]?.constructorId)}
            alt={standing.Constructors[0]?.name}
            className="w-full h-full object-contain"
            onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = `<span class="text-xs font-bold text-white">${standing.Constructors[0]?.name.slice(0, 3).toUpperCase()}</span>`;
            }}
        />
    ) : (
        <span className="text-xs font-bold text-white">
            {standing.Constructors[0]?.name.slice(0, 3).toUpperCase()}
        </span>
    )}
</div>


                                                <span className="text-sm text-gray-300">{standing.Constructors[0]?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <div className="text-sm font-bold text-yellow-400">{standing.wins}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right hidden md:table-cell">
                                            <div className="text-sm text-gray-300">
                                                {parseInt(standing.wins) + (standing.podiums ? parseInt(standing.podiums) - parseInt(standing.wins) : 0)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="text-lg font-bold text-white">{standing.points}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <button className="text-gray-400 hover:text-white transition-colors">
                                                <ChevronDownIcon />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded Driver Details */}
                                    {isExpanded && (
                                        <tr style={{ backgroundColor: `${teamColor}08` }}>
                                            <td colSpan="7" className="px-2 py-2 sm:px-6 sm:py-6">
                                                <div className="mb-6 flex flex-col md:flex-row gap-6 items-start ">
                                                    {/* Large Driver Photo */}
                                                    <div className="w-full md:w-48 flex-shrink-0">
                                                        <div className="relative rounded-lg overflow-hidden bg-gray-900">
{/* F1 Style Driver Photo with Number Background */}
<div className="relative w-48 h-[400px] rounded-lg overflow-hidden" style={{ backgroundColor: teamColor }}>
    
    {/* Large Driver Number Background (masked) - F1 Style */}
    <div 
        className="absolute inset-0 flex items-center justify-center opacity-30 z-0"
        style={{
            backgroundColor: 'white',
            maskImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='160' font-weight='900' font-family='Arial Black, sans-serif' font-style='italic' letter-spacing='-8' fill='white'>${standing.Driver.permanentNumber}</text></svg>")`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='160' font-weight='900' font-family='Arial Black, sans-serif' font-style='italic' letter-spacing='-8' fill='white'>${standing.Driver.permanentNumber}</text></svg>")`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center'
        }}
    />
    
    {/* Driver Photo - fills frame (will scale to fit) */}
    <img
        src={getDriverCloudinaryUrl(standing.Driver.code, 720) || getDriverHeadshotUrl(standing.Driver)}
        alt={`${standing.Driver.givenName} ${standing.Driver.familyName}`}
        className="absolute inset-0 w-full h-full object-cover object-top z-5"
        onError={(e) => {
            const attempt = parseInt(e.target.getAttribute('data-fallback-attempt') || '0');

            if (attempt === 0) {
                // Try 2024 as fallback
                e.target.setAttribute('data-fallback-attempt', '1');
                const familyName = standing.Driver.familyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
                e.target.src = `https://www.formula1.com/content/dam/fom-website/drivers/2024Drivers/${familyName}.png.transform/2col/image.png`;
            } else if (attempt === 1) {
                // Try 2023 as fallback (for older drivers like de Vries)
                e.target.setAttribute('data-fallback-attempt', '2');
                const familyName = standing.Driver.familyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
                e.target.src = `https://www.formula1.com/content/dam/fom-website/drivers/2023Drivers/${familyName}.png.transform/2col/image.png`;
            } else {
                // Hide if all fallbacks fail
                e.target.style.display = 'none';
            }
        }}
    />
    
    {/* Gradient overlay */}
    <div 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
            background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 70%, ${teamColor} 100%)`
        }}
    />
    
</div>


                                                        </div>                                                        
                                                    </div>

{/* Driver Bio */}
<div className="flex flex-col flex-1 self-stretch">
    
    {/* Top row: Name/Number and Logo */}
    <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>
                {standing.Driver.givenName} {standing.Driver.familyName}
            </span>
            <span 
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: `${teamColor}30`, color: teamColor }}
            >
                #{standing.Driver.permanentNumber}
            </span>
        </h3>

        {/* Team Logo aligned right */}
        <div className="rounded-lg p-3 flex items-center justify-center" style={{ minWidth: '160px', minHeight: '80px' }}>
            {getTeamLogoUrl(standing.Constructors[0]?.constructorId) && (
                <img 
                    src={getTeamLogoUrl(standing.Constructors[0]?.constructorId)}
                    alt={standing.Constructors[0]?.name}
                    className="object-contain"
                    style={{ maxHeight: '60px', maxWidth: '140px', width: 'auto', height: 'auto' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            )}
        </div>
    </div>
    
    {/* About section - grows to fill all remaining space */}
    <div className="bg-gray-900/50 p-4 rounded-lg flex-1">
        <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">About</h4>

        {/* Compute a reliable fallback bio */}
        {(() => {
            const id = standing.Driver.driverId;
            const given = standing.Driver.givenName;
            const family = standing.Driver.familyName;
            const nationality = standing.Driver.nationality;
            const teamName = standing.Constructors[0]?.name || '';
            const fallbackBio = `${given} ${family} is a ${nationality} racing driver competing in Formula 1 for ${teamName}. ${standing.wins > 0 ? `With ${standing.wins} race win${parseInt(standing.wins) !== 1 ? 's' : ''} this season, ` : ''}Currently holds P${standing.position} in the championship with ${standing.points} points.`;

            const bioText = summaryObj.text || fallbackBio;

            return (
                <div>
                    {summaryObj.loading && (
                        <div className="italic text-gray-400 mb-2">Loading biography...</div>
                    )}

                    <p className="text-sm text-gray-300 leading-relaxed">{bioText}</p>

                    {summaryObj.wikiUrl && (
                        <p className="mt-2 text-xs text-gray-400">
                            <a href={summaryObj.wikiUrl} target="_blank" rel="noreferrer" className="underline hover:text-white">Read on Wikipedia</a>
                        </p>
                    )}
                </div>
            );
        })()}
    </div>

</div>


                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                                        <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">Career Stats</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-400">DOB</span>
                                                                <span className="text-sm font-semibold text-white">
                                                                    {standing.Driver.dateOfBirth || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-400">Nationality</span>
                                                                <span className="px-3 py-1 rounded-full text-lg font-semibold flex items-center gap-2"
                                                                style={{ backgroundColor: `${teamColor}30`, color: teamColor }}>
                                                                {getNationalityFlag(normalizeNationality(standing.Driver.nationality))}
                                                                <span className="text-xs">{standing.Driver.nationality}</span>
                                                            </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                                        <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">Season {selectedYear}</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-400">Position</span>
                                                                <span className="text-sm font-semibold text-white">P{standing.position}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-400">Wins</span>
                                                                <span className="text-sm font-semibold text-yellow-400">{standing.wins}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-400">Points</span>
                                                                <span className="text-sm font-semibold text-white">{standing.points}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-gray-900/50 p-4 rounded-lg">
                                                        <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">Team Info</h4>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between">
                                                                <span className="text-sm text-gray-400">Constructor</span>
                                                                <span className="text-sm font-semibold text-white">
                                                                    {standing.Constructors[0]?.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-400">Nationality</span>
                                                                <span className="text-sm font-semibold text-white flex items-center gap-2">
                                                                    <span className="text-lg">{getNationalityFlag(normalizeNationality(standing.Constructors[0]?.nationality))}</span>
                                                                    {standing.Constructors[0]?.nationality}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Driver Performance Charts */}
                                                <DriverIndividualCharts driver={standing.Driver} currentYear={selectedYear} teamColor={teamColor} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Driver Individual Charts Component (for expander)
const DriverIndividualCharts = ({ driver, currentYear, teamColor }) => {
    const [comparisonData, setComparisonData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDriverComparison = async () => {
            try {
                const [currentStandings, previousStandings] = await Promise.all([
                    ErgastAPI.getDriverStandings(currentYear),
                    ErgastAPI.getDriverStandings(currentYear - 1)
                ]);

                const currentDriver = currentStandings.find(d => d.Driver.driverId === driver.driverId);
                const previousDriver = previousStandings.find(d => d.Driver.driverId === driver.driverId);

                setComparisonData({
                    current: {
                        wins: parseInt(currentDriver?.wins) || 0,
                        points: parseInt(currentDriver?.points) || 0,
                        position: parseInt(currentDriver?.position) || 0
                    },
                    previous: {
                        wins: parseInt(previousDriver?.wins) || 0,
                        points: parseInt(previousDriver?.points) || 0,
                        position: parseInt(previousDriver?.position) || 0
                    }
                });
            } catch (error) {
                console.error('Error fetching driver comparison:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDriverComparison();
    }, [driver.driverId, currentYear]);

    if (loading) {
        return <div className="text-gray-400 text-center py-4">Loading performance data...</div>;
    }

    if (!comparisonData) {
        return null;
    }

    const winsChartData = {
        labels: [`${currentYear - 1}`, `${currentYear}`],
        datasets: [
            {
                label: 'Race Wins',
                data: [comparisonData.previous.wins, comparisonData.current.wins],
                backgroundColor: [teamColor + '80', teamColor],
                borderColor: teamColor,
                borderWidth: 2
            }
        ]
    };

    const pointsChartData = {
        labels: [`${currentYear - 1}`, `${currentYear}`],
        datasets: [
            {
                label: 'Points',
                data: [comparisonData.previous.points, comparisonData.current.points],
                backgroundColor: [teamColor + '80', teamColor],
                borderColor: teamColor,
                borderWidth: 2
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: {
                display: false
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
                    font: { size: 10 }
                },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            x: {
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 }
                },
                grid: { display: false }
            }
        }
    };

    return (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Wins Comparison */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">
                    Wins Comparison
                </h4>
                <div style={{ height: '200px' }}>
                    <Bar data={winsChartData} options={chartOptions} />
                </div>
                <div className="mt-3 text-xs text-gray-400 text-center">
                    {comparisonData.current.wins > comparisonData.previous.wins ? (
                        <span className="text-green-400"> +{comparisonData.current.wins - comparisonData.previous.wins} wins vs last year</span>
                    ) : comparisonData.current.wins < comparisonData.previous.wins ? (
                        <span className="text-red-400"> {comparisonData.previous.wins - comparisonData.current.wins} fewer wins vs last year</span>
                    ) : (
                        <span className="text-gray-400"> Same as last year</span>
                    )}
                </div>
            </div>

            {/* Points Comparison */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">
                    Points Comparison
                </h4>
                <div style={{ height: '200px' }}>
                    <Bar data={pointsChartData} options={chartOptions} />
                </div>
                <div className="mt-3 text-xs text-gray-400 text-center">
                    {comparisonData.current.points > comparisonData.previous.points ? (
                        <span className="text-green-400"> +{comparisonData.current.points - comparisonData.previous.points} points vs last year</span>
                    ) : comparisonData.current.points < comparisonData.previous.points ? (
                        <span className="text-red-400"> {comparisonData.previous.points - comparisonData.current.points} fewer points vs last year</span>
                    ) : (
                        <span className="text-gray-400"> Same as last year</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// Constructor Details Expansion Component
const ConstructorDetails = ({ standing, teamColor }) => {
    const [drivers, setDrivers] = useState([]);
    const [yearComparison, setYearComparison] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeamData = async () => {
            try {
                const [driverStandings, current2025, previous2024] = await Promise.all([
                    ErgastAPI.getDriverStandings(),
                    ErgastAPI.getConstructorStandings(2025),
                    ErgastAPI.getConstructorStandings(2024)
                ]);

                const teamDrivers = driverStandings.filter(
                    d => d.Constructors[0]?.constructorId === standing.Constructor.constructorId
                );
                setDrivers(teamDrivers);

                // Get year comparison data
                const team2025 = current2025.find(t => t.Constructor.constructorId === standing.Constructor.constructorId);
                const team2024 = previous2024.find(t => t.Constructor.constructorId === standing.Constructor.constructorId);

                setYearComparison({
                    wins2025: parseInt(team2025?.wins || 0),
                    wins2024: parseInt(team2024?.wins || 0),
                    points2025: parseInt(team2025?.points || 0),
                    points2024: parseInt(team2024?.points || 0)
                });
            } catch (error) {
                console.error('Error fetching team data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeamData();
    }, [standing.Constructor.constructorId]);

    if (loading) {
        return <div className="text-gray-400 text-center py-4">Loading team details...</div>;
    }

    const winsChartData = yearComparison ? {
        labels: ['2024', '2025'],
        datasets: [{
            label: 'Race Wins',
            data: [yearComparison.wins2024, yearComparison.wins2025],
            backgroundColor: [darkenColor(teamColor), teamColor],
            borderColor: [darkenColor(teamColor), teamColor],
            borderWidth: 2
        }]
    } : null;

    const pointsChartData = yearComparison ? {
        labels: ['2024', '2025'],
        datasets: [{
            label: 'Points',
            data: [yearComparison.points2024, yearComparison.points2025],
            backgroundColor: [darkenColor(teamColor), teamColor],
            borderColor: [darkenColor(teamColor), teamColor],
            borderWidth: 2
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#fff',
                bodyColor: '#d1d5db'
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#9ca3af', font: { size: 10 } },
                grid: { color: 'rgba(75, 85, 99, 0.2)' }
            },
            x: {
                ticks: { color: '#9ca3af', font: { size: 10 } },
                grid: { display: false }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Team Summary as main header */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Season Position</h4>
                    <div className="text-3xl font-bold" style={{ color: teamColor }}>#{standing.position}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Season Points</h4>
                    <div className="text-3xl font-bold text-white">{standing.points}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Grand Prix Wins</h4>
                    <div className="text-3xl font-bold text-yellow-400">{standing.wins}</div>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Nationality</h4>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-2xl">{getNationalityFlag(normalizeNationality(standing.Constructor.nationality))}</span>
                        <span className="text-sm font-semibold text-white">{standing.Constructor.nationality}</span>
                    </div>
                </div>
            </div>

            {/* Year-over-Year Comparison Charts */}
            {yearComparison && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">
                            Wins Comparison
                        </h4>
                        <div style={{ height: '200px' }}>
                            <Bar data={winsChartData} options={chartOptions} />
                        </div>
                        <div className="mt-3 text-xs text-gray-400 text-center">
                            {yearComparison.wins2025 > yearComparison.wins2024 ? (
                                <span className="text-green-400"> +{yearComparison.wins2025 - yearComparison.wins2024} wins vs last year</span>
                            ) : yearComparison.wins2025 < yearComparison.wins2024 ? (
                                <span className="text-red-400"> {yearComparison.wins2024 - yearComparison.wins2025} fewer wins vs last year</span>
                            ) : (
                                <span className="text-gray-400"> Same as last year</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                        <h4 className="text-sm font-bold uppercase text-gray-200 mb-3 pb-2 border-b border-gray-600">
                            Points Comparison
                        </h4>
                        <div style={{ height: '200px' }}>
                            <Bar data={pointsChartData} options={chartOptions} />
                        </div>
                        <div className="mt-3 text-xs text-gray-400 text-center">
                            {yearComparison.points2025 > yearComparison.points2024 ? (
                                <span className="text-green-400"> +{yearComparison.points2025 - yearComparison.points2024} points vs last year</span>
                            ) : yearComparison.points2025 < yearComparison.points2024 ? (
                                <span className="text-red-400"> {yearComparison.points2024 - yearComparison.points2025} fewer points vs last year</span>
                            ) : (
                                <span className="text-gray-400"> Same as last year</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Team Drivers */}
            <div>
                <h3 className="text-sm font-bold uppercase text-gray-200 mb-3">Team Drivers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {drivers.map((driver) => (
                        <div
                            key={driver.Driver.driverId}
                            className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                    <img
                                        src={getDriverHeadshotUrl(driver.Driver)}
                                        alt={driver.Driver.familyName}
                                        className="w-full h-full object-contain"
                                        onError={(e) => handleDriverImageError(e, driver.Driver, teamColor)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-white text-base">
                                        {driver.Driver.givenName} {driver.Driver.familyName}
                                    </div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                        <span>#{driver.Driver.permanentNumber}</span>
                                        <span></span>
                                        <span className="text-base">{getNationalityFlag(normalizeNationality(driver.Driver.nationality))}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white">{driver.points}</div>
                                    <div className="text-xs text-gray-400">points</div>
                                    <div className="text-xs text-yellow-400 mt-1">{driver.wins} wins</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Constructor Standings Component (Full)
const ConstructorStandingsCard = ({ standings, loading }) => {
    const [expandedTeam, setExpandedTeam] = useState(null);

    if (loading) return <div className="text-center p-8 text-gray-300">Loading constructor standings...</div>;
    if (standings.length === 0) return <div className="text-center p-8 text-gray-400">No standings data available</div>;

    const toggleTeam = (teamId) => {
        setExpandedTeam(prev => (prev === teamId ? null : teamId));
    };

    return (
        <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
            <div className="p-4 sm:p-6">
                <h2 className="text-xl font-bold text-white flex items-center"><TrophyIcon /> Constructor Championship</h2>
            </div>

            {/* Mobile-friendly constructor standings */}
            <div className="sm:hidden space-y-3 px-4 pb-4">
                {standings.map((standing) => {
                    const teamColor = getTeamColor(standing.Constructor.constructorId);
                    const isExpanded = expandedTeam === standing.Constructor.constructorId;
                    const teamLogoUrl = getTeamLogoUrl(standing.Constructor.constructorId);

                    return (
                        <div
                            key={`mobile-${standing.position}`}
                            className="rounded-lg border border-gray-700/50 bg-gray-900/40 overflow-hidden transition-shadow hover:shadow-lg"
                            style={{
                                backgroundColor: `${teamColor}18`,
                                borderLeft: `4px solid ${teamColor}`
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => toggleTeam(standing.Constructor.constructorId)}
                                className="w-full text-left p-4 flex items-center gap-3"
                            >
                                <div className="text-2xl font-bold text-white w-10 text-center">
                                    {standing.position}
                                </div>
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center p-2 flex-shrink-0"
                                    style={{ backgroundColor: teamColor }}
                                >
                                    {teamLogoUrl ? (
                                        <img
                                            src={teamLogoUrl}
                                            alt={standing.Constructor.name}
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallback = document.createElement('span');
                                                fallback.className = 'text-xs font-bold text-white';
                                                fallback.textContent = standing.Constructor.name.slice(0, 3).toUpperCase();
                                                e.target.parentElement.appendChild(fallback);
                                            }}
                                        />
                                    ) : (
                                        <span className="text-xs font-bold text-white">
                                            {standing.Constructor.name.slice(0, 3).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white truncate">{standing.Constructor.name}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                                        <span className="text-lg">{getNationalityFlag(normalizeNationality(standing.Constructor.nationality))}</span>
                                        <span className="truncate">{standing.Constructor.nationality}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-white">{standing.points}</div>
                                    <div className="text-xs text-gray-400">points</div>
                                    <div className="text-xs text-yellow-400 mt-1">{standing.wins} wins</div>
                                </div>
                                <div className={`transform transition-transform duration-300 text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <ChevronDownIcon />
                                </div>
                            </button>
                            <div className="px-4 pb-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
                                    <div className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg">
                                        <span className="uppercase tracking-wide text-gray-500">Wins</span>
                                        <span className="font-semibold text-yellow-400">{standing.wins}</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-900/40 px-3 py-2 rounded-lg">
                                        <span className="uppercase tracking-wide text-gray-500">Points</span>
                                        <span className="font-semibold text-white">{standing.points}</span>
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="border-t border-gray-700/60 pt-3">
                                        <ConstructorDetails standing={standing} teamColor={teamColor} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/70">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Pos</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Team</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase hidden sm:table-cell">Nationality</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase">Wins</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Points</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800/60 divide-y divide-gray-700">
                        {standings.map((standing) => {
                            const teamColor = getTeamColor(standing.Constructor.constructorId);
                            const isExpanded = expandedTeam === standing.Constructor.constructorId;

                            return (
                                <React.Fragment key={standing.position}>
                                    <tr
                                        className="transition-all duration-200 hover:shadow-lg cursor-pointer"
                                        style={{
                                            backgroundColor: `${teamColor}15`,
                                            borderLeft: `4px solid ${teamColor}`
                                        }}
                                        onClick={() => toggleTeam(standing.Constructor.constructorId)}
                                    >
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">{standing.position}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center p-1.5 mr-3"
                                                    style={{ backgroundColor: teamColor }}>
                                                    {getTeamLogoUrl(standing.Constructor.constructorId) ? (
                                                        <img
                                                            src={getTeamLogoUrl(standing.Constructor.constructorId)}
                                                            alt={standing.Constructor.name}
                                                            className="w-full h-full object-contain"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                const fallback = document.createElement('span');
                                                                fallback.className = 'text-xs font-bold text-white';
                                                                fallback.textContent = standing.Constructor.name.slice(0, 3).toUpperCase();
                                                                e.target.parentElement.appendChild(fallback);
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white">
                                                            {standing.Constructor.name.slice(0, 3).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm font-semibold text-white">{standing.Constructor.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">
                                            <span className="flex items-center gap-2">
                                                <span className="text-xl">{getNationalityFlag(normalizeNationality(standing.Constructor.nationality))}</span>
                                                <span>{standing.Constructor.nationality}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-yellow-400 font-semibold text-right">{standing.wins}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right">{standing.points}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                            <div className={`transform transition-transform duration-300 inline-block ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDownIcon />
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr>
                                            <td colSpan="6" className="px-2 py-2 sm:px-6 sm:py-4" style={{ backgroundColor: `${teamColor}08` }}>
                                                <ConstructorDetails standing={standing} teamColor={teamColor} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Lap Time Chart Component with Driver Filtering
const LapTimeChart = ({ race }) => {
    const [lapData, setLapData] = useState([]);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
    const [allDrivers, setAllDrivers] = useState([]);
    const [driverOptions, setDriverOptions] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchLapTimes = async () => {
            if (!race.isPast || !race.results) return;

            setLoading(true);

            const baseDriverEntries = race.results.map(result => ({
                driver: result.Driver,
                constructor: result.Constructor,
                laps: [],
                hasLapData: false
            }));

            const entryMap = new Map(baseDriverEntries.map(entry => [entry.driver.driverId, entry]));

            let priorityStandings = [];
            try {
                if (typeof ErgastAPI.getDriverStandingsByRound === 'function') {
                    priorityStandings = await ErgastAPI.getDriverStandingsByRound(race.season, race.round);
                }

                if ((!priorityStandings || priorityStandings.length === 0) && typeof ErgastAPI.getDriverStandings === 'function') {
                    priorityStandings = await ErgastAPI.getDriverStandings(race.season);
                }
            } catch (err) {
                console.warn('Failed to load driver standings for prioritisation:', err);
            }

            const topSeasonDriverIds = (priorityStandings || [])
                .slice(0, 5)
                .map(standing => standing?.Driver?.driverId)
                .filter(Boolean);

            const configuredLimit = Math.max(
                1,
                Math.min(
                    typeof LAP_TIME_DRIVER_LIMIT === 'number' ? LAP_TIME_DRIVER_LIMIT : 10,
                    race.results.length
                )
            );

            const driversToFetchCount = Math.min(
                baseDriverEntries.length,
                Math.max(configuredLimit, topSeasonDriverIds.length)
            );

            const driversToFetch = [];
            const includedIds = new Set();
            const includeEntry = (entry) => {
                if (!entry || includedIds.has(entry.driver.driverId)) {
                    return;
                }
                driversToFetch.push(entry);
                includedIds.add(entry.driver.driverId);
            };

            topSeasonDriverIds.forEach(driverId => includeEntry(entryMap.get(driverId)));
            for (const entry of baseDriverEntries) {
                if (driversToFetch.length >= driversToFetchCount) break;
                includeEntry(entry);
            }

            setLoadingProgress({ current: 0, total: driversToFetch.length });

            try {
                for (let i = 0; i < driversToFetch.length; i++) {
                    const entry = driversToFetch[i];
                    setLoadingProgress({ current: i + 1, total: driversToFetch.length });

                    try {
                        const laps = await ErgastAPI.getLapTimes(race.season, race.round, entry.driver.driverId);
                        if (laps && laps.length > 0) {
                            entry.laps = laps;
                            entry.hasLapData = true;
                        }
                    } catch (err) {
                        console.warn(`No lap data for ${entry.driver.familyName}`);
                    }

                    if (i < driversToFetch.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }

                setLapData(baseDriverEntries.filter(entry => entry.hasLapData));
                setDriverOptions(baseDriverEntries);
                const driversWithDataIds = baseDriverEntries
                    .filter(entry => entry.hasLapData)
                    .map(entry => entry.driver.driverId);
                setAllDrivers(driversWithDataIds);

                const autoSelect = driversToFetch
                    .filter(entry => entry.hasLapData)
                    .slice(0, Math.min(5, driversToFetch.length))
                    .map(entry => entry.driver.driverId);
                const fallbackSelection = autoSelect.length > 0 ? autoSelect : driversWithDataIds.slice(0, 1);
                setSelectedDrivers(fallbackSelection);
            } catch (err) {
                console.error('Error fetching lap times:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLapTimes();
    }, [race.season, race.round, race.isPast]);

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
        return (
            <div className="text-gray-400 text-center py-8">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    </div>
                    <div>
                        <div className="text-white font-semibold mb-1">Loading lap time data...</div>
                        <div className="text-sm text-gray-500">
                            {loadingProgress.current} of {loadingProgress.total} drivers
                        </div>
                        <div className="w-64 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                            <div
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (lapData.length === 0) {
        return <div className="text-gray-400 text-center py-4">No lap time data available for this race</div>;
    }

    // Prepare chart data
    const filteredData = lapData.filter(d => selectedDrivers.includes(d.driver.driverId));
    
    const allLapNumbers = Array.from(new Set(
        filteredData.flatMap(driverData => driverData.laps.map(lap => lap.lap))
    )).sort((a, b) => a - b);

    const chartData = {
        labels: allLapNumbers,
        datasets: filteredData.map(driverData => {
            const teamColor = getTeamColor(driverData.constructor.constructorId);
            const lapTimeMap = new Map(
                driverData.laps.map(lap => {
                    const [minutesPart, secondsPart] = lap.time.split(':');
                    const minutes = parseInt(minutesPart, 10);
                    const seconds = parseFloat(secondsPart);
                    const totalSeconds = minutes * 60 + seconds;
                    return [lap.lap, totalSeconds];
                })
            );

            return {
                label: `${driverData.driver.givenName} ${driverData.driver.familyName}`,
                data: allLapNumbers.map(lapNumber => lapTimeMap.has(lapNumber) ? lapTimeMap.get(lapNumber) : null),
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
                        if (context.parsed?.y == null) {
                            return `${context.dataset.label}: —`;
                        }

                        const seconds = Number(context.parsed.y);
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
        const option = driverOptions.find(d => d.driver.driverId === driverId);
        if (!option?.hasLapData) {
            return;
        }

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

    const driversWithoutData = driverOptions.filter(d => !d.hasLapData);
    const selectedWithoutData = selectedDriversData.filter(d => !d.hasLapData);

    return (
        <div className="mt-6">
            <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                <span>📊</span> Lap Time Analysis
            </h4>

            {/* Tag Picker */}
            <div className="relative mb-4">
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
                                        {driverData.driver.code || `${driverData.driver.givenName} ${driverData.driver.familyName}`}
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
                                    disabled={!driverData.hasLapData}
                                    className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${driverData.hasLapData ? 'hover:bg-gray-700' : 'opacity-60 cursor-not-allowed'}`}
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

            {driversWithoutData.length > 0 && (
                <p className="mt-2 text-xs text-yellow-400">
                    Lap time data is not provided by the API for {driversWithoutData.length} drivers. They remain listed but cannot be added to the chart.
                </p>
            )}

            {selectedWithoutData.length > 0 && (
                <div className="mt-2 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                    {selectedWithoutData.length === 1 ? 'Lap data is unavailable for the selected driver.' : 'Lap data is unavailable for some of the selected drivers.'}
                </div>
            )}

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
        return (
            <div className="bg-gray-800/50 rounded-lg shadow-xl overflow-hidden">
                <div className="p-10 flex flex-col items-center justify-center text-gray-300">
                    <div className="relative w-16 h-16 mb-4">
                        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="text-lg font-semibold text-white">Loading race calendar…</div>
                    <p className="text-sm text-gray-400 mt-2 text-center max-w-xs">
                        Fetching the latest schedule and results from the Ergast API.
                    </p>
                </div>
            </div>
        );
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
