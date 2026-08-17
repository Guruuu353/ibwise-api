const { ApiError } = require("../utils/apiResponse");

// Centralised error handler — every route can just `throw new ApiError(...)`
// or let Prisma/validation errors bubble up; this is the single place that
// decides status codes and response shape.
function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Prisma known errors (unique constraint, not found, etc.)
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(", ") || "value"} already exists.`,
    });
  }
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Record not found." });
  }

  console.error(err);
  const status = err.statusCode || 500;
  return res.status(status).json({
    success: false,
    message: status === 500 ? "Something went wrong on our end." : err.message,
  });
}

function notFoundMiddleware(req, res) {
  res.status(404).json({ success: false, message: `No route for ${req.method} ${req.originalUrl}` });
}

module.exports = { errorMiddleware, notFoundMiddleware };
