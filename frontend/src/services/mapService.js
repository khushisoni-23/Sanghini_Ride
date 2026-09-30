/**
 * Frontend Map Service — Nominatim (OSM) Geocoding + OSRM Routing
 * Completely FREE, no API keys required.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

// Rate limit guard — Nominatim allows 1 req/s
let lastNominatimCallAt = 0;
const NOMINATIM_INTERVAL_MS = 1100;

async function nominatimThrottledFetch(url) {
  const now = Date.now();
  const wait = NOMINATIM_INTERVAL_MS - (now - lastNominatimCallAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimCallAt = Date.now();
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'SanghiniRide-Udaipur/1.0 (contact@sanghiniride.in)',
    },
  });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return res.json();
}

// Curated database of major Udaipur landmarks and hubs for instant, zero-latency matching
export const UDAIPUR_MAJOR_LANDMARKS = [
  {
    name: 'Surajpole',
    aliases: ['surajpole', 'suraj pole', 'surajpol', 'surajpole circle'],
    shortName: 'Surajpole Circle, Udaipur',
    displayName: 'Surajpole Circle, Old City Wall Gate, Central Udaipur, Rajasthan 313001',
    lat: 24.5801,
    lng: 73.6963,
  },
  {
    name: 'Udiapole',
    aliases: ['udiapole', 'udia pole', 'udiapol', 'central bus stand', 'roadways bus stand'],
    shortName: 'Udiapole (Central Bus Station), Udaipur',
    displayName: 'Udiapole Circle & Central Bus Stand, City Center, Udaipur, Rajasthan 313001',
    lat: 24.5752,
    lng: 73.6998,
  },
  {
    name: 'Hathipole',
    aliases: ['hathipole', 'hathi pole', 'hathipol', 'hathipole market'],
    shortName: 'Hathipole Market, Udaipur',
    displayName: 'Hathipole Bazar & Heritage Gate, Old City, Udaipur, Rajasthan 313001',
    lat: 24.5898,
    lng: 73.6875,
  },
  {
    name: 'Delhi Gate',
    aliases: ['delhi gate', 'delhigate', 'delhi gate circle'],
    shortName: 'Delhi Gate Circle, Udaipur',
    displayName: 'Delhi Gate Chouraha, Bapu Bazaar Link, Udaipur, Rajasthan 313001',
    lat: 24.5855,
    lng: 73.6922,
  },
  {
    name: 'Chetak Circle',
    aliases: ['chetak circle', 'chetak chouraha', 'chetak circle udaipur'],
    shortName: 'Chetak Circle, Udaipur',
    displayName: 'Chetak Circle, Near MB Hospital & Ashoka Cinema, Udaipur, Rajasthan 313001',
    lat: 24.5936,
    lng: 73.6872,
  },
  {
    name: 'Court Circle',
    aliases: ['court circle', 'collectorate', 'court chouraha'],
    shortName: 'Court Circle (Collectorate), Udaipur',
    displayName: 'Court Circle, District Collectorate & Sessions Court, Udaipur, Rajasthan 313001',
    lat: 24.5885,
    lng: 73.6985,
  },
  {
    name: 'Sukhadia Circle',
    aliases: ['sukhadia circle', 'sukhadia fountain', 'panchwati'],
    shortName: 'Sukhadia Circle, Udaipur',
    displayName: 'Sukhadia Circle Fountain, Panchwati & Fatehpura, Udaipur, Rajasthan 313001',
    lat: 24.6062,
    lng: 73.6883,
  },
  {
    name: 'Fatehsagar Lake',
    aliases: ['fatehsagar', 'fateh sagar', 'fateh sagar lake', 'fs lake', 'moti magri'],
    shortName: 'Fatehsagar Lake (Chowpatty), Udaipur',
    displayName: 'Fateh Sagar Lake Promenade & Chowpatty, Udaipur, Rajasthan 313001',
    lat: 24.6033,
    lng: 73.6738,
  },
  {
    name: 'City Palace',
    aliases: ['city palace', 'city palace udaipur', 'maharana mewar'],
    shortName: 'City Palace Complex, Udaipur',
    displayName: 'The City Palace Complex, Lake Pichola East Bank, Udaipur, Rajasthan 313001',
    lat: 24.5764,
    lng: 73.6835,
  },
  {
    name: 'Jagdish Temple',
    aliases: ['jagdish temple', 'jagdish chowk'],
    shortName: 'Jagdish Temple, Old City',
    displayName: 'Shri Jagdish Temple, Jagdish Chowk, Old City, Udaipur, Rajasthan 313001',
    lat: 24.5797,
    lng: 73.6839,
  },
  {
    name: 'Saheliyon Ki Bari',
    aliases: ['saheliyon ki bari', 'saheli nagar'],
    shortName: 'Saheliyon Ki Bari Garden, Udaipur',
    displayName: 'Saheliyon Ki Bari Historic Garden, Saheli Marg, Udaipur, Rajasthan 313001',
    lat: 24.6055,
    lng: 73.6946,
  },
  {
    name: 'Lake Pichola',
    aliases: ['lake pichola', 'pichola', 'gangaur ghat', 'ambrai ghat'],
    shortName: 'Lake Pichola (Gangaur Ghat), Udaipur',
    displayName: 'Lake Pichola, Gangaur Ghat & Ambrai Ghat, Udaipur, Rajasthan 313001',
    lat: 24.5778,
    lng: 73.6784,
  },
  {
    name: 'Udaipur City Railway Station',
    aliases: ['railway station', 'udaipur station', 'train station', 'udaipur city railway station'],
    shortName: 'Udaipur City Railway Station (UDZ)',
    displayName: 'Udaipur City Railway Station (UDZ), Station Road, Udaipur, Rajasthan 313001',
    lat: 24.5684,
    lng: 73.7029,
  },
  {
    name: 'Rana Pratap Nagar Railway Station',
    aliases: ['rana pratap nagar station', 'thokar chouraha railway station'],
    shortName: 'Rana Pratap Nagar Station (RPZ)',
    displayName: 'Rana Pratap Nagar Railway Station (RPZ), Airport Road, Udaipur, Rajasthan 313001',
    lat: 24.5902,
    lng: 73.7291,
  },
  {
    name: 'Maharana Pratap Airport (Dabok)',
    aliases: ['airport', 'dabok airport', 'udaipur airport', 'maharana pratap airport'],
    shortName: 'Maharana Pratap Airport Dabok (UDR)',
    displayName: 'Maharana Pratap Airport (UDR), Dabok Highway, Udaipur, Rajasthan 313022',
    lat: 24.6177,
    lng: 73.8961,
  },
  {
    name: 'Celebration Mall',
    aliases: ['celebration mall', 'nexus celebration mall', 'bhuwana mall'],
    shortName: 'Celebration Mall, Bhuwana',
    displayName: 'Nexus Celebration Mall, NH-8, Bhuwana, Udaipur, Rajasthan 313004',
    lat: 24.6225,
    lng: 73.7092,
  },
  {
    name: 'Bapu Bazaar',
    aliases: ['bapu bazaar', 'bapu bazar', 'bank tiraha'],
    shortName: 'Bapu Bazaar, Udaipur',
    displayName: 'Bapu Bazaar Shopping Market, City Center, Udaipur, Rajasthan 313001',
    lat: 24.5835,
    lng: 73.6938,
  },
  {
    name: 'Sajjangarh Monsoon Palace',
    aliases: ['sajjangarh', 'monsoon palace', 'sajjan garh fort'],
    shortName: 'Sajjangarh (Monsoon Palace), Udaipur',
    displayName: 'Sajjangarh Biological Park & Monsoon Palace, Bansdara Peak, Udaipur, Rajasthan 313001',
    lat: 24.5894,
    lng: 73.6358,
  },
  {
    name: 'Goverdhan Vilas',
    aliases: ['goverdhan vilas', 'goverdhan sagar', 'sector 14 bypass'],
    shortName: 'Goverdhan Vilas, Udaipur',
    displayName: 'Goverdhan Vilas & Goverdhan Sagar Lake, Ahmedabad Highway, Udaipur, Rajasthan 313002',
    lat: 24.5452,
    lng: 73.6821,
  },
  {
    name: 'Hiran Magri Sector 14',
    aliases: ['sector 14', 'hiran magri sector 14', 'sec 14'],
    shortName: 'Sector 14, Hiran Magri, Udaipur',
    displayName: 'Hiran Magri Sector 14 Residential Colony, Udaipur, Rajasthan 313002',
    lat: 24.5488,
    lng: 73.7032,
  },
  {
    name: 'Hiran Magri Sector 4 / 5',
    aliases: ['sector 4', 'sector 5', 'hiran magri', 'satellite hospital'],
    shortName: 'Sector 4/5, Hiran Magri, Udaipur',
    displayName: 'Hiran Magri Sector 4 & 5, Near Satellite Hospital, Udaipur, Rajasthan 313002',
    lat: 24.5712,
    lng: 73.7225,
  },
  {
    name: 'Shobhagpura Circle',
    aliases: ['shobhagpura', 'shobhagpura circle', '100 feet road'],
    shortName: 'Shobhagpura Circle, Udaipur',
    displayName: 'Shobhagpura Circle & 100 Feet Road Hub, Udaipur, Rajasthan 313001',
    lat: 24.6189,
    lng: 73.7145,
  },
  {
    name: 'Nathdwara (Shrinathji Temple)',
    aliases: ['nathdwara', 'shrinathji', 'shrinathji temple'],
    shortName: 'Nathdwara Temple Town, Rajsamand',
    displayName: 'Shri Shrinathji Temple, Nathdwara, Rajsamand District, Rajasthan 313301',
    lat: 24.9315,
    lng: 73.8184,
  },
  {
    name: 'Chittorgarh Fort',
    aliases: ['chittorgarh', 'chittor', 'chittorgarh fort'],
    shortName: 'Chittorgarh Fort, Rajasthan',
    displayName: 'Chittorgarh Fort Heritage Complex, Chittorgarh, Rajasthan 312001',
    lat: 24.8879,
    lng: 74.6453,
  },
  {
    name: 'Mount Abu',
    aliases: ['mount abu', 'nakki lake', 'dilwara'],
    shortName: 'Mount Abu (Nakki Lake), Sirohi',
    displayName: 'Mount Abu Hill Station & Nakki Lake, Sirohi, Rajasthan 307501',
    lat: 24.5926,
    lng: 72.7156,
  },
  {
    name: 'Jaipur Junction / Sindhi Camp',
    aliases: ['jaipur', 'jaipur junction', 'sindhi camp'],
    shortName: 'Jaipur Junction & Sindhi Camp, Jaipur',
    displayName: 'Jaipur Junction Railway Station & Central Bus Terminal, Jaipur, Rajasthan 302006',
    lat: 26.9208,
    lng: 75.7873,
  },
  {
    name: 'Jodhpur Railway Station',
    aliases: ['jodhpur', 'jodhpur station', 'clock tower jodhpur'],
    shortName: 'Jodhpur Central & Clock Tower, Jodhpur',
    displayName: 'Jodhpur Railway Station & Ghanta Ghar, Jodhpur, Rajasthan 342001',
    lat: 26.2845,
    lng: 73.0234,
  },
  {
    name: 'Ahmedabad Kalupur Station',
    aliases: ['ahmedabad', 'ahmedabad station', 'kalupur'],
    shortName: 'Ahmedabad Junction (Kalupur), Gujarat',
    displayName: 'Ahmedabad Junction Railway Station, Kalupur, Ahmedabad, Gujarat 380002',
    lat: 23.0272,
    lng: 72.6012,
  },
  {
    name: 'New Delhi IGI Airport / NDLS',
    aliases: ['delhi', 'new delhi', 'igi airport', 'ndls'],
    shortName: 'New Delhi Central (NDLS / IGI Airport)',
    displayName: 'New Delhi Railway Station & IGI Airport Terminal 3, New Delhi, Delhi 110037',
    lat: 28.6431,
    lng: 77.2197,
  },
];

/**
 * Search places by text query.
 * First checks curated Udaipur landmarks, then searches OpenStreetMap Nominatim
 * for Udaipur and across India (Jaipur, Jodhpur, Delhi, Mumbai, Ahmedabad, etc.).
 * Returns array of { displayName, shortName, lat, lng, placeId }
 */
export async function searchPlaces(query, limit = 8) {
  if (!query || query.trim().length < 2) return [];
  const qClean = query.trim().toLowerCase();

  // 1. Instant Curated Local Landmarks Match
  const localMatches = UDAIPUR_MAJOR_LANDMARKS.filter((item) => {
    return (
      item.name.toLowerCase().includes(qClean) ||
      item.shortName.toLowerCase().includes(qClean) ||
      item.aliases.some((alias) => alias.includes(qClean) || qClean.includes(alias))
    );
  }).map((item, idx) => ({
    displayName: item.displayName,
    shortName: item.shortName,
    lat: item.lat,
    lng: item.lng,
    placeId: `curated_${idx}_${item.name.replace(/\s+/g, '_')}`,
  }));

  // If we already have strong local matches, return them first or mix with geocoding
  if (localMatches.length >= limit) {
    return localMatches.slice(0, limit);
  }

  // 2. Dynamic OpenStreetMap Nominatim Geocoding (All India & Udaipur detailing)
  try {
    const isCitySpecified = /jaipur|jodhpur|delhi|mumbai|ahmedabad|kota|bikaner|ajmer|pune|bengaluru|bangalore/i.test(qClean);
    const searchQuery = isCitySpecified ? query.trim() : `${query.trim()}, India`;

    const params = new URLSearchParams({
      q: searchQuery,
      format: 'json',
      addressdetails: '1',
      limit: String(limit),
      countrycodes: 'in',
    });

    const data = await nominatimThrottledFetch(`${NOMINATIM_BASE}/search?${params}`);
    const remoteMatches = (data || []).map((item) => ({
      displayName: item.display_name,
      shortName: buildShortName(item),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      placeId: item.place_id,
    }));

    // Merge curated matches first, then remote matches (avoiding duplicate names)
    const combined = [...localMatches];
    const seenCoordinates = new Set(localMatches.map((m) => `${m.lat.toFixed(3)},${m.lng.toFixed(3)}`));

    for (const item of remoteMatches) {
      const coordKey = `${item.lat.toFixed(3)},${item.lng.toFixed(3)}`;
      if (!seenCoordinates.has(coordKey)) {
        seenCoordinates.add(coordKey);
        combined.push(item);
      }
    }

    return combined.slice(0, limit);
  } catch (err) {
    console.warn('[mapService] searchPlaces error:', err);
    return localMatches;
  }
}

/**
 * Reverse geocode GPS coordinates into a human-readable address.
 * Returns { displayName, shortAddress, lat, lng } or null on failure.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      addressdetails: '1',
      zoom: '17',
    });
    const data = await nominatimThrottledFetch(`${NOMINATIM_BASE}/reverse?${params}`);
    const addr = data.address || {};
    const shortAddress = buildShortAddress(addr, data.display_name);
    return {
      displayName: data.display_name,
      shortAddress,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
    };
  } catch (err) {
    console.warn('[mapService] reverseGeocode error:', err);
    return null;
  }
}

/**
 * Get real driving route between two coordinate pairs via OSRM.
 * Returns { geometry: [[lng,lat],...], distanceKm, durationMins, source }
 */
export async function fetchDrivingRoute(startLng, startLat, endLng, endLat) {
  try {
    const url = `${OSRM_BASE}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.length > 0) {
      const route = data.routes[0];
      return {
        geometry: route.geometry.coordinates,
        distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
        durationMins: Math.max(1, Math.round(route.duration / 60)),
        source: 'osrm',
      };
    }
    throw new Error('No route found');
  } catch (err) {
    console.warn('[mapService] fetchDrivingRoute error:', err);
    return null;
  }
}

/**
 * Get user's current GPS position and reverse-geocode it to an address.
 * Returns { lat, lng, address } or throws an Error.
 */
export async function getCurrentLocationAddress() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const result = await reverseGeocode(lat, lng);
        if (result) {
          resolve({ lat, lng, address: result.shortAddress || result.displayName });
        } else {
          resolve({ lat, lng, address: `Near ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E` });
        }
      },
      (error) => {
        const messages = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Unable to detect your location. Please try again.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(messages[error.code] || 'Location detection failed.'));
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  });
}

// ─── Private Helpers ─────────────────────────────────────────────

function buildShortName(item) {
  const addr = item.address || {};
  const parts = [
    addr.amenity || addr.road || addr.neighbourhood || addr.suburb,
    addr.city || addr.town || addr.village,
  ].filter(Boolean);
  return parts.length > 0
    ? parts.join(', ')
    : item.display_name.split(',').slice(0, 2).join(',').trim();
}

function buildShortAddress(addr, fullDisplay) {
  const parts = [
    addr.amenity || addr.tourism || addr.leisure || addr.building,
    addr.road || addr.neighbourhood,
    addr.suburb || addr.city_district,
    addr.city || addr.town || addr.village || 'Udaipur',
  ].filter(Boolean);
  return parts.length >= 2
    ? parts.join(', ')
    : fullDisplay?.split(',').slice(0, 3).join(',').trim();
}
