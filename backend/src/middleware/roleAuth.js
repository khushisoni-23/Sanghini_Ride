/**
 * Role-based authorization middleware foundation.
 *
 * Phase 0: Structure only — no JWT verification yet.
 * Phase 2+ will add actual token verification and role checking.
 *
 * Usage (future):
 *   router.get('/admin/dashboard', authorize('ADMIN'), controller)
 *   router.get('/driver/rides', authorize('DRIVER', 'ADMIN'), controller)
 */

// User roles
export const ROLES = {
  PASSENGER: 'PASSENGER',
  DRIVER: 'DRIVER',
  ADMIN: 'ADMIN',
};

/**
 * Creates an authorization middleware for the given roles.
 * Currently returns a placeholder that passes through.
 * Will be implemented with JWT verification in Phase 2.
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Phase 2: This will verify JWT token and check user role
    // For now, this is a structural placeholder
    //
    // Future implementation:
    // 1. Extract token from Authorization header
    // 2. Verify token with JWT_SECRET
    // 3. Attach user to req.user
    // 4. Check if req.user.role is in allowedRoles
    // 5. Return 401/403 if unauthorized

    // Placeholder — remove in Phase 2
    next();
  };
};

export default { ROLES, authorize };
