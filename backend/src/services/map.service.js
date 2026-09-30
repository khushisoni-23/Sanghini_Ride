import { calculateHaversineDistance, resolveCoordinates } from '../utils/rideCalculator.js';

/**
 * Fetch real driving route from OSRM / OpenStreetMap Routing API
 * @param {[number, number]} startCoords - [longitude, latitude]
 * @param {[number, number]} endCoords - [longitude, latitude]
 * @returns {Promise<{ geometry: number[][], distanceKm: number, durationMins: number }>}
 */
export async function fetchDrivingRoute(startCoords, endCoords) {
  const [lng1, lat1] = startCoords;
  const [lng2, lat2] = endCoords;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SanghiniRide-Udaipur/1.0',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry = route.geometry.coordinates; // Array of [lng, lat]
        const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
        const durationMins = Math.max(1, Math.round(route.duration / 60));

        return {
          geometry,
          distanceKm,
          durationMins,
          source: 'osrm',
        };
      }
    }
  } catch (error) {
    // Fallback if network or timeout fails
  }

  // Fallback: Generate interpolated waypoints between start and end coordinates
  const distanceKm = calculateHaversineDistance(startCoords, endCoords);
  const durationMins = Math.round(distanceKm * 2.8 + 3);

  const steps = 15;
  const geometry = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    // Add small curve deviation for natural road feel
    const curveOffset = Math.sin(fraction * Math.PI) * 0.002;
    const lng = lng1 + (lng2 - lng1) * fraction + curveOffset;
    const lat = lat1 + (lat2 - lat1) * fraction;
    geometry.push([parseFloat(lng.toFixed(6)), parseFloat(lat.toFixed(6))]);
  }

  return {
    geometry,
    distanceKm,
    durationMins,
    source: 'fallback',
  };
}

/**
 * Calculate live ETA and remaining distance between driver position and target point
 * @param {[number, number]} driverCoords - [lng, lat]
 * @param {[number, number]} targetCoords - [lng, lat]
 * @param {number} [avgSpeedKmh=28] - Average speed in km/h
 */
export function calculateLiveETA(driverCoords, targetCoords, avgSpeedKmh = 28) {
  if (!driverCoords || !targetCoords || driverCoords.length < 2 || targetCoords.length < 2) {
    return { remainingDistanceKm: 0, etaMinutes: 0 };
  }

  const remainingDistanceKm = calculateHaversineDistance(driverCoords, targetCoords);
  // Time in minutes = (distance / speed) * 60 + 1 min buffer
  const etaMinutes = Math.max(1, Math.round((remainingDistanceKm / avgSpeedKmh) * 60 + 1));

  return {
    remainingDistanceKm: parseFloat(remainingDistanceKm.toFixed(2)),
    etaMinutes,
  };
}
