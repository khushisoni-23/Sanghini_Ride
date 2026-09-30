import env from '../config/env.js';

/**
 * Centralized error handler middleware.
 * Catches all errors passed via next(err) and returns a safe JSON response.
 */
const errorHandler = (err, req, res, _next) => {
  // Default to 500 if no status code set
  const statusCode = err.statusCode || 500;

  // Log the full error in development only
  if (env.isDevelopment) {
    console.error(`❌ [${req.method}] ${req.originalUrl}:`, err);
  } else {
    // In production, log only the message (no stack traces)
    console.error(`❌ [${req.method}] ${req.originalUrl}: ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : err.message,
    // Only include stack trace in development
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

export default errorHandler;
