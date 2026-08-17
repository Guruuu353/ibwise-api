// Wraps async route handlers so rejected promises reach the error middleware
// instead of crashing the process. (express-async-errors also patches this
// globally, but explicit wrapping keeps intent obvious in each route file.)
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
