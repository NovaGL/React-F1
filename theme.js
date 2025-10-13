// Shared styling configuration for the React F1 dashboard
// Centralizes team branding, color utilities, and media helpers

export const DEFAULT_TEAM_COLOR = '#6b7280'; // Tailwind slate-500

export const TEAM_COLORS = {
  red_bull: '#4781D7', // Official 2025: Navy blue
  mercedes: '#27F2CD', // Bright Petronas teal (distinct from Aston)
  ferrari: '#ED1131', // Official 2025: Bright red
  mclaren: '#F47600', // Official 2025: Papaya orange
  aston_martin: '#00594F', // Darker British Racing Green
  alpine: '#F282B4', // Official 2025: Pink
  williams: '#1868DB', // Official 2025: Blue
  haas: '#9C9FA2', // Official 2025: Gray
  rb: '#6C98FF', // Official 2025: Light blue
  racingbulls: '#6C98FF', // Alias for RB
  racing_bulls: '#6C98FF', // Alias for RB
  sauber: '#01C00E', // Official 2025: Bright green
  kick_sauber: '#01C00E', // Kick Sauber green
  alfa_romeo: '#900000', // Legacy support
  alphatauri: '#2B4562', // Legacy support
  renault: '#FFED00', // Legacy support
  toro_rosso: '#00327D' // Legacy support
};

export const TEAM_LOGOS = {
  red_bull: '/red-bull.svg',
  // rb and racing_bulls will use Cloudinary (handled in getTeamLogoUrl)
  ferrari: 'https://www.f1manager.com/_nuxt/img/ferrari.a3fea9f.svg',
  haas: 'https://www.f1manager.com/_nuxt/img/haas.210c7ac.svg',
  mercedes: 'https://cdn.brandfetch.io/idsWGwlSmy/theme/light/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1728451883920',
  sauber: 'https://www.f1manager.com/_nuxt/img/sauber.b72322a.svg',
  kick_sauber: 'https://www.f1manager.com/_nuxt/img/sauber.b72322a.svg',
  alpine:
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NzcuNTggMjQwLjI4Ij4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik03My45NSwyNDAuMjRsNjQuMjIsLjA1LDY4Ljc2LTUzLjE1aDExNi43NWwtMTcuMzIsNTMuMTVoNTEuOTRsMTcuMjEtNTMuMTVoNTguNTNsNDMuNTQtMzMuNzJoLTkxLjAxTDQzNi41MiwwaC01MkwxODYuMjMsMTUzLjQySDEwNy44NWwyMS42Mi02Ni40TDAsMTg3LjE0SDE0Mi42MmwtNjguNjcsNTMuMVpNMzYyLjk2LDY2LjQ1bC0yOC4yNyw4Ni45N2gtODQuMTdsMTEyLjQzLTg2Ljk3WiIvPgo8L3N2Zz4=',
  williams:
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MC4xNCA0My44NSI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDIuNzksMTguODVMNDkuOCwwaDEwLjM0bC0xMS41NiwzMS4xMi01Ljc4LTEyLjI2aDBabS0yNS40NS0uMDFMMTAuMzQsMEgwTDExLjU2LDMxLjEybDUuNzgtMTIuMjZoMFpNMzAuOTgsMGgtMS44MkwxMi44NywzNC42MWwzLjQzLDkuMjRoMS42MWwxMi4xNS0yNS43OCwxMi4xNSwyNS43OGgxLjYxbDMuNDMtOS4yNEwzMC45OCwwWiIvPgo8L3N2Zz4=',
  aston_martin: 'https://cdn.brandfetch.io/ido6hOFCnF/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1668081343694',
  mclaren:
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NC45OSAzMC4xNyI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogI2ZmZmZmZjsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDYuMjIsMGMtNS45LDAtMTQuMjEsMS43Ni0yMy4yMiw1LjA2QzE0Ljk0LDcuOTksNy4yMywxMS43OSwwLDE2LjM5YzYuOTQtMi41NSwxNC4yNS0zLjkyLDIxLjY0LTQuMDUsMTAuMzQsMCwxNy43LDQsNi44MywxNy44M0M2MC40Nyw5LjE3LDU5LjY0LC4wNSw0Ni4yMiwuMDUiLz4KPC9zdmc+',
  alfa_romeo: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/team%20logos/alfa%20romeo',
  alphatauri: 'https://media.formula1.com/image/upload/f_auto,c_limit,q_auto,w_1320/content/dam/fom-website/2018-redesign-assets/team%20logos/alphatauri',
  renault: 'https://cdn.brandfetch.io/id9Ki3CXMR/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1728592494660',
  toro_rosso: 'https://cdn.brandfetch.io/idN4wVWWBt/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1728592526608'
};

const CLOUDINARY_LOGO_MAP = {
  rb: 'rb',
  racing_bulls: 'rb',
  red_bull: 'redbullracing'  
};

const TEAM_ALIAS = {};

const registerAliases = (canonicalId, aliases) => {
  aliases.forEach((alias) => {
    if (!alias) return;
    const lowered = alias.toLowerCase();
    const underscore = lowered.replace(/[^a-z0-9]+/g, '_');
    const compact = lowered.replace(/[^a-z0-9]/g, '');
    TEAM_ALIAS[lowered] = canonicalId;
    TEAM_ALIAS[underscore] = canonicalId;
    TEAM_ALIAS[compact] = canonicalId;
  });
};

registerAliases('red_bull', [
  'oracle red bull racing',
  'red bull racing',
  'red bull',
  'redbull',
  'oracleredbullracing'
]);
registerAliases('rb', [
  'visa cash app rb formula one team',
  'visa cash app rb',
  'visa cash app rb f1 team',
  'rb formula one team',
  'rb f1 team',
  'rb f1',
  'racing bulls',
  'visa rb',
  'vcarrb'
]);
registerAliases('ferrari', ['scuderia ferrari', 'ferrari sf1', 'scuderia']);
registerAliases('mercedes', [
  'mercedes-amg petronas formula one team',
  'mercedes amg petronas',
  'mercedes-amg',
  'mercedes benz',
  'mercedes-benz',
  'mercedes'
]);
registerAliases('mclaren', ['mclaren formula 1 team', 'mclaren f1 team', 'mclaren racing', 'mclaren']);
registerAliases('aston_martin', [
  'aston martin aramco cognizant formula one team',
  'aston martin aramco',
  'aston martin f1 team',
  'aston martin'
]);
registerAliases('alpine', ['bwt alpine f1 team', 'alpine f1 team', 'alpine']);
registerAliases('williams', ['williams racing', 'williams grand prix engineering', 'williams']);
registerAliases('haas', ['moneygram haas f1 team', 'haas f1 team', 'haas formula 1 team']);
registerAliases('kick_sauber', [
  'stake f1 team kick sauber',
  'stake f1 team',
  'kick sauber',
  'kick sauber f1 team'
]);
registerAliases('sauber', ['sauber f1 team', 'sauber formula 1 team', 'sauber']);
registerAliases('alphatauri', ['alpha tauri', 'alpha-tauri', 'scuderia alphatauri', 'alphatauri', 'alphatauri honda']);
registerAliases('toro_rosso', ['toro rosso', 'scuderia toro rosso', 'tororosso']);
registerAliases('alfa_romeo', ['alfa romeo', 'alfa-romeo', 'alfaromeo', 'alfa romeo racing', 'alfa']);

export const sanitizeTeamKey = (value) => {
  if (!value) return '';
  return value.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
};

export const normalizeTeamId = (team) => {
  if (!team) return null;

  if (typeof team === 'object') {
    const candidates = [
      team.constructorId,
      team.teamId,
      team.team,
      team.name,
      team.constructor?.constructorId,
      team.constructor?.name,
      team.teamName,
      team.Constructor?.constructorId,
      team.Constructor?.name,
      team.Constructor?.teamName
    ];

    for (const candidate of candidates) {
      const normalized = normalizeTeamId(candidate);
      if (normalized) return normalized;
    }

    return null;
  }

  const raw = team.toString().trim();
  if (!raw) return null;

  const lowered = raw.toLowerCase();

  // Special case: Ergast API returns 'alfa' for Alfa Romeo
  if (lowered === 'alfa') return 'alfa_romeo';

  if (TEAM_COLORS[lowered]) return lowered;
  if (TEAM_ALIAS[lowered]) return TEAM_ALIAS[lowered];

  const underscore = lowered.replace(/[^a-z0-9]+/g, '_');
  if (TEAM_COLORS[underscore]) return underscore;
  if (TEAM_ALIAS[underscore]) return TEAM_ALIAS[underscore];

  const compact = lowered.replace(/[^a-z0-9]/g, '');
  if (TEAM_COLORS[compact]) return compact;
  if (TEAM_ALIAS[compact]) return TEAM_ALIAS[compact];

  return TEAM_ALIAS[lowered] || TEAM_ALIAS[underscore] || TEAM_ALIAS[compact] || null;
};

export const getTeamColor = (team, fallback = DEFAULT_TEAM_COLOR) => {
  const normalized = normalizeTeamId(team);
  if (normalized && TEAM_COLORS[normalized]) {
    return TEAM_COLORS[normalized];
  }

  // Allow team objects with a predefined teamColor field to pass through
  if (typeof team === 'object' && team?.teamColor) {
    return team.teamColor;
  }

  return fallback;
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const withAlpha = (hexColor, alpha = 0.15) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return `rgba(107,114,128,${clamp01(alpha)})`;
  }

  const hex = hexColor.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const component = normalized.slice(0, 6);
  const alphaHex = Math.round(clamp01(alpha) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${component}${alphaHex}`;
};

const adjustColor = (hexColor, amount) => {
  if (!hexColor || typeof hexColor !== 'string') {
    return DEFAULT_TEAM_COLOR;
  }

  const hex = hexColor.replace('#', '');
  const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (normalized.length !== 6) {
    return hexColor;
  }

  const channels = normalized.match(/.{2}/g);
  if (!channels) return hexColor;

  const adjusted = channels
    .map((channel) => {
      const value = parseInt(channel, 16);
      if (Number.isNaN(value)) return channel;
      const delta = amount < 0 ? value * amount : (255 - value) * amount;
      const next = Math.round(Math.min(255, Math.max(0, value + delta)));
      return next.toString(16).padStart(2, '0');
    })
    .join('');

  return `#${adjusted}`;
};

export const darkenColor = (hexColor, amount = 0.35) => adjustColor(hexColor, -Math.abs(amount));

export const lightenColor = (hexColor, amount = 0.35) => adjustColor(hexColor, Math.abs(amount));

export const driverCloudinaryMap = {
  GAS: { code: 'piegas', team: 'alpine' },
  COL: { code: 'fracol', team: 'alpine' },
  DOO: { code: 'jacdoo', team: 'alpine' },
  OCO: { code: 'estoco', team: 'haas' },
  BEA: { code: 'olibea', team: 'haas' },
  NOR: { code: 'lannor', team: 'mclaren' },
  PIA: { code: 'oscpia', team: 'mclaren' },
  LEC: { code: 'chalec', team: 'ferrari' },
  HAM: { code: 'lewham', team: 'ferrari' },
  VER: { code: 'maxver', team: 'redbullracing' },
  TSU: { code: 'yuktsu', team: 'redbullracing' },
  RUS: { code: 'georus', team: 'mercedes' },
  ANT: { code: 'andant', team: 'mercedes' },
  ALO: { code: 'feralo', team: 'astonmartin' },
  STR: { code: 'lanstr', team: 'astonmartin' },
  SAI: { code: 'carsai', team: 'williams' },
  ALB: { code: 'alealb', team: 'williams' },
  LAW: { code: 'lialaw', team: 'racingbulls' },
  HAD: { code: 'isahad', team: 'racingbulls' },
  HUL: { code: 'nichul', team: 'kicksauber' },
  BOR: { code: 'gabbor', team: 'kicksauber' }
};

export const getDriverCloudinaryUrl = (driverCode, width = 720) => {
  if (!driverCode) return null;
  const lookupKey = driverCode.toString().toUpperCase();
  const driverInfo = driverCloudinaryMap[lookupKey];
  if (!driverInfo) return null;

  const { code, team } = driverInfo;
  // Note: v1740000000 is the Cloudinary version timestamp
  return `https://media.formula1.com/image/upload/c_fill,w_${width}/q_auto/v1740000000/common/f1/2025/${team}/${code}01/2025${team}${code}01right.webp`;
};

// Drivers who don't have 2025 headshots - map to their last active season
const DRIVER_LAST_SEASON = {
  'colapinto': '2024',
  'perez': '2024',      // Sergio Pérez (left Red Bull after 2024)
  'bottas': '2024',     // Valtteri Bottas (left Sauber after 2024)
  'ricciardo': '2024',  // Daniel Ricciardo (left RB after 2024)
  'zhou': '2024',       // Zhou Guanyu (left Sauber after 2024)
  'magnussen': '2024',  // Kevin Magnussen (left Haas after 2024)
  'sargeant': '2024',   // Logan Sargeant (left Williams during 2024)
  'devries': '2023',    // Nyck de Vries (left AlphaTauri in 2023)
  'schumacher': '2022', // Mick Schumacher (left Haas after 2022)
  'vettel': '2022',     // Sebastian Vettel (retired after 2022)
  'latifi': '2022'      // Nicholas Latifi (left Williams after 2022)
};

const buildF1HeadshotUrl = (season, slug) =>
  `https://www.formula1.com/content/dam/fom-website/drivers/${season}Drivers/${slug}.png.transform/2col/image.png`;

// Normalize driver names for URL slugs
const normalizeDriverSlug = (name) => {
  if (!name) return null;

  return name
    .toLowerCase()
    .normalize('NFD')  // Normalize Unicode characters (é -> e)
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .replace(/\s+/g, '')  // Remove all spaces (de vries -> devries)
    .replace(/[^a-z0-9]/g, '');  // Remove any other non-alphanumeric chars
};

export const getDriverHeadshotUrl = (driver, options = {}) => {
  const { width = 720 } = options;

  if (!driver) return null;

  let lastName;

  // Handle string input (driver name)
  if (typeof driver === 'string') {
    lastName = driver.split(' ').pop();
  } else {
    // Extract family name from driver object
    lastName =
      driver.familyName ||
      driver.lastName ||
      driver.Driver?.familyName ||
      driver.driver?.familyName ||
      driver.name?.split(' ').pop();
  }

  if (!lastName) return null;

  const slug = normalizeDriverSlug(lastName);
  // Use the driver's last active season, or default to 2025 for current drivers
  const primarySeason = DRIVER_LAST_SEASON[slug] || '2025';
  return buildF1HeadshotUrl(primarySeason, slug);
};

// Full-color team logos (for special sections like Last Race podium)
export const TEAM_LOGOS_COLOR = {
  red_bull: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/redbullracing/2025redbullracinglogo.webp',
  ferrari: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/ferrari/2025ferrarilogo.webp',
  mercedes: 'https://cdn.brandfetch.io/idsWGwlSmy/theme/light/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1728451883920', // Keep the teal one
  mclaren: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/mclaren/2025mclarenlogo.webp',
  aston_martin: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/astonmartin/2025astonmartinlogo.webp',
  alpine: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/alpine/2025alpinelogo.webp',
  williams: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/williams/2025williamslogo.webp',
  haas: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/haas/2025haaslogo.webp',
  rb: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/racingbulls/2025racingbullslogo.webp',
  racing_bulls: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/racingbulls/2025racingbullslogo.webp',
  sauber: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/kicksauber/2025kicksauberlogo.webp',
  kick_sauber: 'https://media.formula1.com/image/upload/c_lfill,w_96/q_auto/v1740000000/common/f1/2025/kicksauber/2025kicksauberlogo.webp',
};

export const getTeamLogoUrl = (team, width = 48, options = {}) => {
  const { fullColor = false } = options;
  const teamId = normalizeTeamId(team);
  if (!teamId) return null;

  // If full color requested, use color logos
  if (fullColor && TEAM_LOGOS_COLOR[teamId]) {
    return TEAM_LOGOS_COLOR[teamId];
  }

  // Red Bull uses local logo, Racing Bulls uses Cloudinary
  if (teamId === 'red_bull') {
    return TEAM_LOGOS[teamId] || null;
  }

  // Racing Bulls (rb, racing_bulls) uses Cloudinary
  const cloudinaryTeams = {
    'rb': 'racingbulls',
    'racing_bulls': 'racingbulls'
  };

  const cloudinaryTeam = cloudinaryTeams[teamId];
  if (cloudinaryTeam) {
    return `https://media.formula1.com/image/upload/c_lfill,w_${width}/q_auto/v1740000000/common/f1/2025/${cloudinaryTeam}/2025${cloudinaryTeam}logowhite.webp`;
  }

  // Check other local logos
  if (TEAM_LOGOS[teamId]) {
    return TEAM_LOGOS[teamId];
  }

  return null;
};
