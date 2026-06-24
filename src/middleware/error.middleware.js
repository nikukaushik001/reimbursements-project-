/**
 * Global error handling middleware for Express.
 * Catches any unhandled errors and formats them consistently.
 *
 * Response format matches the success format:
 *   Success → { status: 'success', data: { ... } }
 *   Error   → { status: 'error',   message: '...' }
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message,
  });
};

module.exports = {
  errorHandler
};
