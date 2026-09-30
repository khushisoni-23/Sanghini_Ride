import jwt from 'jsonwebtoken';
import env from '../config/env.js';

/**
 * Generate a JWT token for a given user ID and role
 * @param {Object} payload { userId, role }
 * @returns {string} Signed JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Attach the JWT token to an HTTP-only cookie in the response
 * @param {Object} res Express response object
 * @param {string} token Signed JWT
 */
export const setTokenCookie = (res, token) => {
  // Use secure cookie in production, but allow it over HTTP in local dev
  const isProduction = env.NODE_ENV === 'production';
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction, 
    sameSite: isProduction ? 'strict' : 'lax', // strict for prod, lax for cross-origin dev
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });
};

export const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
};

export default generateToken;
