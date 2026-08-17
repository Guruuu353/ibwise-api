// Small, consistent response shape so the frontend never has to guess
// where data lives on success vs. error.

function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

function created(res, data) {
  return res.status(201).json({ success: true, data });
}

function noContent(res) {
  return res.status(204).send();
}

class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = { ok, created, noContent, ApiError };
