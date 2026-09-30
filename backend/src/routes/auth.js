import { Router } from 'express';
import { 
  registerUser, 
  sendOtp,
  verifyOtpAndRegister,
  loginUser, 
  logoutUser, 
  getMe,
  updateProfile,
  deleteAccount,
  seedAdmin 
} from '../controllers/auth.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// OTP Verification & Registration Endpoints
router.post('/send-otp', apiLimiter, sendOtp);
router.post('/verify-otp-register', apiLimiter, verifyOtpAndRegister);

// Apply rate limiting to login and register to prevent brute-force
router.post('/register', apiLimiter, registerUser);
router.post('/login', apiLimiter, loginUser);
router.post('/logout', logoutUser);

// Development seeder for Admin
router.post('/admin-seed', seedAdmin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/account', protect, deleteAccount);

// Test Protected Endpoint
router.get('/protected', protect, (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'You have accessed a protected route!',
    user: req.user.toSafeProfile()
  });
});

// Test Role Authorization Endpoints
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Admin access granted' });
});

export default router;
