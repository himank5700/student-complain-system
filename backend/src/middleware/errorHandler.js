/**
 * Centralized Error Handling Middleware
 * Catches all unhandled errors in route handlers and formats a consistent JSON error response.
 */
function errorHandler(err, req, res, next) {
  console.error('[Error Details]:', err.stack || err.message);

  // Default status code: 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(statusCode).json({
    success: false,
    message: message,
    // Only show stack trace in development mode for easier debugging
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Route Not Found Middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
