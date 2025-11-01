/**
 * @typedef {Object} AIOrg
 * @property {string} id - Unique identifier
 * @property {string} name - Organization name
 * @property {string} city - City location
 * @property {string} country - Country location
 * @property {number} [lat] - Latitude (required if plottable)
 * @property {number} [lon] - Longitude (required if plottable)
 * @property {number|string} [founded] - Year founded
 * @property {string} summary - Short description/tagline
 * @property {boolean} [distributed] - If true, no map pin
 */

/**
 * @type {AIOrg[]}
 */
export const aiOrgs = [
  // Existing (corrected coordinates)
  { 
    id: "closedai", 
    name: "ClosedAI", 
    city: "San Francisco", 
    country: "USA", 
    lat: 37.7749, 
    lon: -122.4194, 
    founded: 2015, 
    summary: "Black-box orchestration systems; heavy on NDAs." 
  },
  { 
    id: "deepthink", 
    name: "DeepThink", 
    city: "London", 
    country: "UK", 
    lat: 51.5074, 
    lon: -0.1278, 
    founded: 2010, 
    summary: "Classic lab culture with a taste for giant language models." 
  },
  { 
    id: "anthropic-ish", 
    name: "Anthropic-ish", 
    city: "San Francisco", 
    country: "USA", 
    lat: 37.7925, 
    lon: -122.3930, 
    founded: 2021, 
    summary: "Alignment-forward; red-teaming as a lifestyle." 
  },
  { 
    id: "mistrial", 
    name: "Mistrial AI", 
    city: "Paris", 
    country: "France", 
    lat: 48.8566, 
    lon: 2.3522, 
    founded: 2023, 
    summary: "Fast, open(ish) weights; café-powered iteration." 
  },
  { 
    id: "eleuther-ish", 
    name: "Eleuther-ish", 
    city: "Distributed", 
    country: "Global", 
    distributed: true, 
    summary: "Open research collective; nodes everywhere." 
  },

  // New (one per continent where possible)
  { 
    id: "witsai", 
    name: "WitsAI", 
    city: "Johannesburg", 
    country: "South Africa", 
    lat: -26.1900, 
    lon: 28.0260, 
    founded: 1922, 
    summary: "Research lab tied to Wits University; applied AI for public good." 
  },
  { 
    id: "tokyo-cog", 
    name: "Tokyo Cognitive Systems", 
    city: "Tokyo", 
    country: "Japan", 
    lat: 35.6762, 
    lon: 139.6503, 
    founded: 2012, 
    summary: "Robotics + control; factory swarms." 
  },
  { 
    id: "reefmind", 
    name: "ReefMind Labs", 
    city: "Sydney", 
    country: "Australia", 
    lat: -33.8688, 
    lon: 151.2093, 
    founded: 2016, 
    summary: "Ocean/climate modeling with reef-scale sims." 
  },
  { 
    id: "saologic", 
    name: "SãoLogic AI", 
    city: "São Paulo", 
    country: "Brazil", 
    lat: -23.5505, 
    lon: -46.6333, 
    founded: 2014, 
    summary: "Urban demand prediction at megacity scale." 
  },
  { 
    id: "naibi", 
    name: "Naibi Neural", 
    city: "Nairobi", 
    country: "Kenya", 
    lat: -1.2921, 
    lon: 36.8219, 
    founded: 2018, 
    summary: "Crop yield + climate resilience models." 
  },
  { 
    id: "oasis", 
    name: "Oasis Data Systems", 
    city: "Dubai", 
    country: "UAE", 
    lat: 25.2048, 
    lon: 55.2708, 
    founded: 2011, 
    summary: "Behavior modelling and citywide telemetry." 
  },
  { 
    id: "boreal", 
    name: "Boreal Networks", 
    city: "Toronto", 
    country: "Canada", 
    lat: 43.6532, 
    lon: -79.3832, 
    founded: 2009, 
    summary: "Genomics and healthcare inference." 
  },
  { 
    id: "denkwerk", 
    name: "Denkwerk AGI", 
    city: "Berlin", 
    country: "Germany", 
    lat: 52.5200, 
    lon: 13.4050, 
    founded: 2013, 
    summary: "Ethics engines and policy sandboxes." 
  },
  { 
    id: "kaveri", 
    name: "Kaveri DeepWorks", 
    city: "Bengaluru", 
    country: "India", 
    lat: 12.9716, 
    lon: 77.5946, 
    founded: 2015, 
    summary: "Scaling data pipelines and foundation models." 
  },
  { 
    id: "hansyn", 
    name: "HanSynthesis AI", 
    city: "Seoul", 
    country: "South Korea", 
    lat: 37.5665, 
    lon: 126.9780, 
    founded: 2017, 
    summary: "Autonomous systems + simulators." 
  }
];

