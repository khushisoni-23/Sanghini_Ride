import { Router } from 'express';
import mongoose from 'mongoose';

// Import models to ensure they are registered
import '../models/User.js';
import '../models/Driver.js';
import '../models/Vehicle.js';
import '../models/Ride.js';
import '../models/Payment.js';
import '../models/SafetyIncident.js';
import '../models/Otp.js';
import '../models/Notification.js';
import '../models/TrustedContact.js';
import '../models/Rating.js';
import '../models/SafeHaven.js';
import '../models/CommunitySignal.js';
import '../models/JourneyBuddy.js';

const router = Router();

/**
 * GET /api/health
 * Returns API health, database connection status, and registered models.
 */
router.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  let dbStatus = 'disconnected';
  if (dbState === 1) dbStatus = 'connected';
  else if (dbState === 2) dbStatus = 'connecting';
  else if (dbState === 3) dbStatus = 'disconnecting';

  res.status(200).json({
    success: true,
    message: 'Sanghini Ride API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    models: mongoose.modelNames(), // List all compiled models
  });
});

export default router;
