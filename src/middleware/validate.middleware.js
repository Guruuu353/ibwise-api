const { validationResult } = require("express-validator");
const { ApiError } = require("../utils/apiResponse");

// Runs after an express-validator chain; turns validation failures into
// a single consistent 422 instead of each route handling it separately.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(422, "Validation failed.", errors.array().map((e) => ({ field: e.path, message: e.msg })));
  }
  next();
}

module.exports = validate;
