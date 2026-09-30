/**
 * Centralized Authoritative Fare Calculator for Sanghini Ride (Udaipur)
 */

export const VEHICLE_PRICING = {
  auto: {
    id: 'auto',
    name: 'Sanghini Auto',
    capacity: '3 Seats',
    baseFare: 40,
    baseDistanceKm: 1.5,
    perKm: 12,
    perMin: 1.0,
    platformFee: 0, // Free for Udaipur pilot launch
    taxRate: 0.05, // 5% GST
  },
  go: {
    id: 'go',
    name: 'Sanghini Go',
    capacity: '4 Seats',
    baseFare: 60,
    baseDistanceKm: 2.0,
    perKm: 16,
    perMin: 1.2,
    platformFee: 0,
    taxRate: 0.05,
  },
  premier: {
    id: 'premier',
    name: 'Sanghini Premier',
    capacity: '4 Premium',
    baseFare: 90,
    baseDistanceKm: 2.5,
    perKm: 22,
    perMin: 1.8,
    platformFee: 0,
    taxRate: 0.05,
  },
  scooter: {
    id: 'scooter',
    name: 'Sanghini Scooter',
    capacity: '1 Seat',
    baseFare: 25,
    baseDistanceKm: 1.0,
    perKm: 8,
    perMin: 0.5,
    platformFee: 0,
    taxRate: 0.05,
  },
};

/**
 * Authoritative calculation of detailed fare breakdown and total amount
 * @param {Object} params
 * @param {number} params.distanceKm - Trip distance in kilometers
 * @param {number} params.durationMins - Trip duration in minutes
 * @param {string} [params.vehicleType='auto'] - Vehicle tier
 * @param {number} [params.discount=0] - Discount/Coupon in Rupees
 * @returns {Object} Complete detailed fare breakdown
 */
export function calculateAuthoritativeFare({
  distanceKm,
  durationMins,
  vehicleType = 'auto',
  discount = 0,
}) {
  const pricing = VEHICLE_PRICING[vehicleType] || VEHICLE_PRICING.auto;
  const validDistance = Math.max(1.0, parseFloat(distanceKm) || 1.0);
  const validDuration = Math.max(1, Math.round(durationMins) || 5);

  const extraDistance = Math.max(0, validDistance - pricing.baseDistanceKm);
  const distanceFare = Math.round(extraDistance * pricing.perKm);
  const timeFare = Math.round(validDuration * pricing.perMin);

  const subtotal = pricing.baseFare + distanceFare + timeFare;
  const platformFee = pricing.platformFee;
  const tax = Math.round(subtotal * pricing.taxRate);
  const validDiscount = Math.min(subtotal, Math.max(0, parseFloat(discount) || 0));

  const totalFare = Math.max(pricing.baseFare, Math.round(subtotal + platformFee + tax - validDiscount));

  return {
    baseFare: pricing.baseFare,
    distanceFare,
    timeFare,
    platformFee,
    tax,
    discount: validDiscount,
    totalFare,
    currency: 'INR',
    vehicleType: pricing.id,
    vehicleName: pricing.name,
    distanceKm: parseFloat(validDistance.toFixed(2)),
    durationMins: validDuration,
  };
}

/**
 * Generate unique professional Invoice Number
 * e.g., INV-SR-2026-948210
 */
export function generateInvoiceNumber(rideId) {
  const timestampPart = Date.now().toString().slice(-4);
  const ridePart = rideId ? rideId.toString().slice(-4).toUpperCase() : Math.floor(1000 + Math.random() * 9000);
  return `INV-SR-${new Date().getFullYear()}-${ridePart}${timestampPart}`;
}
