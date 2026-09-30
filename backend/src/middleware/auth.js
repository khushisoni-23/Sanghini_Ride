import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import env from '../config/env.js';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Read token from cookie (preferred) or Authorization header (fallback)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. No token provided.' });
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // 3. Find user and attach to request
    const currentUser = await User.findById(decoded.userId).select('+isActive');
    
    if (!currentUser) {
      return res.status(401).json({ success: false, message: 'The user belonging to this token no longer exists.' });
    }

    if (!currentUser.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated.' });
    }

    // Attach safe user profile to request
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route. Token is invalid or expired.' });
  }
};

/**
 * Authorize roles - Grant access to specific roles
 * @param  {...string} roles 
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role '${req.user?.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};
