/**
 * Utility functions for Haversine distance calculation and authoritative fare estimation.
 */

// Known Udaipur reference points with lat/lng coordinates (expanded)
export const UDAIPUR_LOCATIONS = {
  'Sukhadia Circle, Panchwati, Udaipur': { lat: 24.6008, lng: 73.6914 },
  'Fateh Sagar Lake Paal, Udaipur': { lat: 24.5960, lng: 73.6763 },
  'City Palace, Old City, Udaipur': { lat: 24.5764, lng: 73.6835 },
  'Lake Pichola / City Palace Gate, Udaipur': { lat: 24.5764, lng: 73.6822 },
  'Udaipur City Railway Station': { lat: 24.5701, lng: 73.6976 },
  'Sahelion Ki Bari, New Bhupalpura, Udaipur': { lat: 24.6062, lng: 73.6917 },
  'Saheliyon Ki Bari, New Bhupalpura, Udaipur': { lat: 24.6062, lng: 73.6917 },
  'Celebration Mall, Bhuwana, Udaipur': { lat: 24.6180, lng: 73.7142 },
  'MLSU Campus, University Road, Udaipur': { lat: 24.5932, lng: 73.7175 },
  'MLSU Campus Gate 1, Udaipur': { lat: 24.5932, lng: 73.7175 },
  'RNT Medical College Hospital': { lat: 24.5802, lng: 73.6942 },
  'RNT Medical College & Hospital, Udaipur': { lat: 24.5802, lng: 73.6942 },
  'Fatehpura Main Road, Udaipur (Current Location)': { lat: 24.6050, lng: 73.6940 },
  'Chetak Circle, Madhuban, Udaipur': { lat: 24.5830, lng: 73.7100 },
  'Delhi Gate, Bapu Bazaar, Udaipur': { lat: 24.5780, lng: 73.6890 },
  'Hiran Magri Sector 4, Udaipur': { lat: 24.6150, lng: 73.7280 },
  'Hiran Magri Sector 14, Udaipur': { lat: 24.6200, lng: 73.7350 },
  'Maharana Pratap Airport (Dabok), Udaipur': { lat: 24.6177, lng: 73.8940 },
  'Goverdhan Vilas, NH 8, Udaipur': { lat: 24.6300, lng: 73.7600 },
  'Shobhagpura 100 Feet Road, Udaipur': { lat: 24.5950, lng: 73.7050 },
  'Titardi Chauraha, Udaipur': { lat: 24.5870, lng: 73.7180 },
};

/**
 * Resolve coordinates from address string or explicit coords.
 * Tries: 1) explicit coords 2) known Udaipur lookup 3) Nominatim geocoding 4) hash-based fallback
 */
export async function resolveCoordinatesAsync(address, providedCoords) {
  // 1. Use explicitly provided non-zero coordinates
  if (
    providedCoords &&
    Array.isArray(providedCoords) &&
    providedCoords.length === 2 &&
    (providedCoords[0] !== 0 || providedCoords[1] !== 0)
  ) {
    return providedCoords; // [lng, lat]
  }

  // 2. Known Udaipur location lookup
  const known = UDAIPUR_LOCATIONS[address];
  if (known) return [known.lng, known.lat];

  // 3. Nominatim geocoding (real OSM data)
  try {
    const params = new URLSearchParams({
      q: `${address}, Udaipur, Rajasthan, India`,
      format: 'json',
      limit: '1',
      countrycodes: 'in',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'SanghiniRide-Udaipur/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        const { lon, lat } = data[0];
        return [parseFloat(lon), parseFloat(lat)];
      }
    }
  } catch (_) { /* fall through */ }

  // 4. Hash-based deterministic fallback around central Udaipur (24.5854° N, 73.6826° E)
  return resolveCoordinates(address, null);
}

// Synchronous fallback: resolve coordinates from a known list or hash
export function resolveCoordinates(address, providedCoords) {
  if (
    providedCoords &&
    Array.isArray(providedCoords) &&
    providedCoords.length === 2 &&
    (providedCoords[0] !== 0 || providedCoords[1] !== 0)
  ) {
    return providedCoords; // [lng, lat]
  }

  // Look up in known Udaipur locations
  const known = UDAIPUR_LOCATIONS[address];
  if (known) {
    return [known.lng, known.lat];
  }

  // Hash address string to produce deterministic coordinate offset around central Udaipur (24.5854° N, 73.6826° E)
  let hash = 0;
  for (let i = 0; i < (address || '').length; i++) {
    hash = (hash << 5) - hash + address.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.001;
  const lngOffset = ((Math.abs(hash % 97) - 48)) * 0.001;

  return [73.6826 + lngOffset, 24.5854 + latOffset];
}


// Calculate Haversine distance in kilometers between two [lng, lat] points
export function calculateHaversineDistance([lng1, lat1], [lng2, lat2]) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Minimum distance threshold of 1.2 km for realistic ride estimation
  return Math.max(1.2, parseFloat(distance.toFixed(1)));
}

// Vehicle pricing tiers
export const VEHICLE_RATES = {
  auto: { name: 'Sanghini Auto', baseFare: 40, perKm: 12, capacity: '3 Seats' },
  go: { name: 'Sanghini Go', baseFare: 60, perKm: 16, capacity: '4 Seats' },
  premier: { name: 'Sanghini Premier', baseFare: 90, perKm: 22, capacity: '4 Premium' },
  scooter: { name: 'Sanghini Scooter', baseFare: 25, perKm: 8, capacity: '1 Seat' },
};

// Authoritative calculation of distance, duration and fare
export function calculateRideMetrics(pickupCoords, dropoffCoords, vehicleType = 'auto') {
  const distanceKm = calculateHaversineDistance(pickupCoords, dropoffCoords);
  const durationMins = Math.round(distanceKm * 2.8 + 3);

  const vehicle = VEHICLE_RATES[vehicleType] || VEHICLE_RATES.auto;
  const rawFare = vehicle.baseFare + distanceKm * vehicle.perKm;
  const fare = Math.round(rawFare);

  return {
    distanceKm,
    durationMins,
    fare,
    vehicleType: VEHICLE_RATES[vehicleType] ? vehicleType : 'auto',
    vehicleName: vehicle.name,
  };
}

// Generate 4-digit numeric OTP for ride verification
export function generateRideOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
