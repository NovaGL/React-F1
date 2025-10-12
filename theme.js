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
  red_bull: 'https://www.f1manager.com/_nuxt/img/redbull.1c78ea1.svg',
  rb: 'https://www.f1manager.com/_nuxt/img/rb.bbcc36f.svg',
  racing_bulls: 'https://www.f1manager.com/_nuxt/img/rb.bbcc36f.svg',
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
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NC45OSAzMC4xNyI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogI2ZmODAwMDsKICAgICAgfQogICAgPC9zdHlsZT4KICA8L2RlZnM+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDYuMjIsMGMtNS45LDAtMTQuMjEsMS43Ni0yMy4yMiw1LjA2QzE0Ljk0LDcuOTksNy4yMywxMS43OSwwLDE2LjM5YzYuOTQtMi41NSwxNC4yNS0zLjkyLDIxLjY0LTQuMDUsMTAuMzQsMCwxNy43LDQsNi44MywxNy44M0M2MC40Nyw5LjE3LDU5LjY0LC4wNSw0Ni4yMiwuMDUiLz4KPC9zdmc+',
  alfa_romeo: 'https://www.f1manager.com/_nuxt/img/alfaromeo.210c7ac.svg',
  alphatauri: 'https://www.f1manager.com/_nuxt/img/alphatauri.50d5226.svg',
  renault: 'https://cdn.brandfetch.io/id9Ki3CXMR/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1728592494660',
  toro_rosso: 'https://cdn.brandfetch.io/idN4wVWWBt/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1728592526608'
};

const CLOUDINARY_LOGO_MAP = {
  rb: 'rb',
  racing_bulls: 'rb',
  red_bull: 'redbullracing',
  mclaren: 'mclaren'
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
registerAliases('alphatauri', ['alpha tauri', 'alpha-tauri', 'scuderia alphatauri', 'alphatauri']);
registerAliases('toro_rosso', ['toro rosso', 'scuderia toro rosso', 'tororosso']);
registerAliases('alfa_romeo', ['alfa romeo', 'alfa-romeo', 'alfaromeo']);

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

export const getDriverHeadshotUrl = (driver, options = {}) => {
  const { width = 720 } = options;

  if (!driver) return null;

  // Handle string input (driver name)
  if (typeof driver === 'string') {
    const lastName = driver.split(' ').pop();
    if (!lastName) return null;
    // Try 2025 first, with 2024 as fallback in onError handler
    return `https://www.formula1.com/content/dam/fom-website/drivers/2025Drivers/${lastName.toLowerCase()}.png.transform/2col/image.png`;
  }

  // Extract family name for fallback
  const familyName =
    driver.familyName ||
    driver.lastName ||
    driver.Driver?.familyName ||
    driver.driver?.familyName ||
    driver.name?.split(' ').pop();

  if (!familyName) return null;

  // Return 2025 URL - components will handle fallback to 2024 in onError
  return `https://www.formula1.com/content/dam/fom-website/drivers/2025Drivers/${familyName.toLowerCase()}.png.transform/2col/image.png`;
};

export const getTeamLogoUrl = (team, width = 48) => {
  const teamId = normalizeTeamId(team);
  if (!teamId) return null;

  // Cloudinary teams with white logos for better visibility on colored backgrounds
  const cloudinaryTeams = {
    'rb': 'rb',
    'racing_bulls': 'rb',
    'red_bull': 'redbullracing',
    'mclaren': 'mclaren'
  };

  const cloudinaryTeam = cloudinaryTeams[teamId];
  if (cloudinaryTeam) {
    return `https://media.formula1.com/image/upload/c_lfill,w_${width}/q_auto/v1740000000/common/f1/2025/${cloudinaryTeam}/2025${cloudinaryTeam}logowhite.webp`;
  }

  return TEAM_LOGOS[teamId] || null;
};
