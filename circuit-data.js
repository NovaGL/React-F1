// Circuit data with images, descriptions, and lap counts
export const CIRCUIT_DATA = {
  'bahrain': {
    imageKey: 'Bahrain',
    laps: 57,
    description: 'The Bahrain International Circuit in Sakhir is known for its challenging layout and dramatic desert setting. Night races here provide spectacular racing with long straights and tight technical sections.'
  },
  'jeddah': {
    imageKey: 'Saudi_Arabia',
    laps: 50,
    description: 'The Jeddah Corniche Circuit is one of the fastest street circuits in F1, featuring high-speed corners along the Red Sea coast with stunning views and challenging blind corners.'
  },
  'albert_park': {
    imageKey: 'Australia',
    laps: 58,
    description: 'Albert Park Circuit in Melbourne is a street circuit set around a picturesque lake, offering a mix of high-speed sections and slower technical corners through the park.'
  },
  'suzuka': {
    imageKey: 'Japan',
    laps: 53,
    description: 'Suzuka International Racing Course is a legendary figure-eight layout that tests every aspect of a driver\'s skill with its challenging corners and elevation changes.'
  },
  'shanghai': {
    imageKey: 'China',
    laps: 56,
    description: 'Shanghai International Circuit features a unique snail-shaped first corner and a long back straight, designed to showcase spectacular racing in China.'
  },
  'miami': {
    imageKey: 'Miami',
    laps: 57,
    description: 'Miami International Autodrome brings F1 racing to South Florida with a purpose-built circuit around Hard Rock Stadium, featuring high-speed sections and technical corners.'
  },
  'imola': {
    imageKey: 'Italy',
    laps: 63,
    description: 'Autodromo Enzo e Dino Ferrari at Imola is a historic circuit with challenging chicanes and elevation changes, steeped in F1 history and tradition.'
  },
  'monaco': {
    imageKey: 'Monaco',
    laps: 78,
    description: 'Circuit de Monaco through Monte Carlo is the most iconic street circuit in motorsport, with narrow roads, tight corners, and minimal run-off making it the ultimate test of precision.'
  },
  'catalunya': {
    imageKey: 'Spain',
    laps: 66,
    description: 'Circuit de Barcelona-Catalunya is a technical circuit used for testing, featuring a mix of high-speed corners and slow sections that challenge both car and driver.'
  },
  'villeneuve': {
    imageKey: 'Canada',
    laps: 70,
    description: 'Circuit Gilles Villeneuve on Notre Dame Island in Montreal is known for its wall-lined straights, heavy braking zones, and unpredictable weather.'
  },
  'red_bull_ring': {
    imageKey: 'Austria',
    laps: 71,
    description: 'Red Bull Ring in Spielberg is a short, fast circuit in the Austrian Alps featuring dramatic elevation changes and high-speed corners with stunning mountain backdrops.'
  },
  'silverstone': {
    imageKey: 'Great_Britain',
    laps: 52,
    description: 'Silverstone Circuit is the home of British motorsport, featuring high-speed corners like Copse and Maggots-Becketts that demand exceptional bravery and skill.'
  },
  'spa': {
    imageKey: 'Belgium',
    laps: 44,
    description: 'Circuit de Spa-Francorchamps in the Ardennes forest is the longest circuit on the calendar, famous for Eau Rouge and unpredictable weather conditions.'
  },
  'hungaroring': {
    imageKey: 'Hungary',
    laps: 70,
    description: 'Hungaroring near Budapest is a twisty, technical circuit often compared to Monaco, where overtaking is difficult and track position is crucial.'
  },
  'zandvoort': {
    imageKey: 'Netherlands',
    laps: 72,
    description: 'Circuit Zandvoort features unique banked corners and flows through the Dutch dunes near the North Sea, creating a challenging and atmospheric racing experience.'
  },
  'monza': {
    imageKey: 'Italy',
    laps: 53,
    description: 'Autodromo Nazionale di Monza is the Temple of Speed, with long straights and chicanes that produce the highest average speeds of the season in the historic Parco di Monza.'
  },
  'baku': {
    imageKey: 'Baku',
    laps: 51,
    description: 'Baku City Circuit winds through the streets of Azerbaijan\'s capital, combining a narrow old town section with one of the longest straights in F1.'
  },
  'marina_bay': {
    imageKey: 'Singapore',
    laps: 62,
    description: 'Marina Bay Street Circuit hosts F1\'s original night race, featuring a bumpy street circuit with 23 corners around Singapore\'s spectacular waterfront.'
  },
  'americas': {
    imageKey: 'USA',
    laps: 56,
    description: 'Circuit of the Americas in Austin, Texas features a dramatic uphill first sector and a mix of high-speed and technical sections inspired by famous corners from around the world.'
  },
  'rodriguez': {
    imageKey: 'Mexico',
    laps: 71,
    description: 'Autódromo Hermanos Rodríguez in Mexico City sits at high altitude, affecting car performance with thinner air, and features a unique stadium section.'
  },
  'interlagos': {
    imageKey: 'Brazil',
    laps: 71,
    description: 'Autódromo José Carlos Pace at Interlagos in São Paulo runs counter-clockwise with dramatic elevation changes and unpredictable weather creating memorable races.'
  },
  'vegas': {
    imageKey: 'Las_Vegas',
    laps: 50,
    description: 'Las Vegas Strip Circuit brings F1 to the heart of the entertainment capital, featuring high-speed racing past iconic casinos and the famous Las Vegas Strip at night.'
  },
  'losail': {
    imageKey: 'Qatar',
    laps: 57,
    description: 'Losail International Circuit near Doha features a challenging mix of medium and high-speed corners under floodlights in the desert.'
  },
  'yas_marina': {
    imageKey: 'Abu_Dhabi',
    laps: 58,
    description: 'Yas Marina Circuit in Abu Dhabi is known for its twilight racing, iconic pit lane exit that goes under the track, and often deciding championship battles.'
  }
};

// Get circuit data by ID
export function getCircuitData(circuitId) {
  return CIRCUIT_DATA[circuitId] || {
    imageKey: 'Australia',
    description: 'A challenging Formula 1 circuit with a unique character and rich racing history.'
  };
}

// Get circuit image URL
export function getCircuitImageUrl(circuitId) {
  const data = getCircuitData(circuitId);
  return `https://media.formula1.com/image/upload/c_fit,h_704/q_auto/v1740000000/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${data.imageKey}_Circuit.webp`;
}
