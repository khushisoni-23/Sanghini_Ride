/**
 * Verhoeff Checksum Algorithm for Genuine Indian Aadhaar Card Validation
 * Officially used by UIDAI for 12-digit Aadhaar validation.
 */

// Verhoeff multiplication table (d)
const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Verhoeff permutation table (p)
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/**
 * Validates whether a given string is a genuine 12-digit Indian Aadhaar card number.
 * @param {string|number} aadhaarStr
 * @returns {boolean}
 */
export function validateAadhaarNumber(aadhaarStr) {
  if (!aadhaarStr) return false;
  const clean = String(aadhaarStr).replace(/[\s-]/g, '');

  // Must be exactly 12 digits
  if (!/^\d{12}$/.test(clean)) return false;

  // UIDAI specs: Aadhaar numbers never start with '0' or '1'
  if (clean.startsWith('0') || clean.startsWith('1')) return false;

  // Reject repeating digits like 222222222222, 555555555555
  if (/^(\d)\1{11}$/.test(clean)) return false;

  // Reject obvious test sequences like 123456789012 or 987654321098
  if (clean === '123456789012' || clean === '987654321098') return false;

  // Verhoeff algorithm calculation
  let c = 0;
  const myArray = clean.split('').map(Number).reverse();

  for (let i = 0; i < myArray.length; i++) {
    c = d[c][p[i % 8][myArray[i]]];
  }

  return c === 0;
}

export default validateAadhaarNumber;
