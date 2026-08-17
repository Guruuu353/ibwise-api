const { verifyToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const prisma = require("../config/db");

// Verifies the bearer token and attaches the current user to req.user.
// Downstream handlers/role guards read req.user — never trust a role
// claimed in the request body.
const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) throw new ApiError(401, "Authentication required.");

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired session — please log in again.");
  }

  // Include role profiles so downstream handlers can use req.user.teacher.id /
  // req.user.student.id directly without a second lookup in every controller.
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { teacher: true, student: true, parent: true },
  });
  if (!user || !user.isActive) throw new ApiError(401, "Account not found or deactivated.");

  req.user = user;
  next();
};

// Restricts a route to one or more roles: requireRole("ADMIN", "TEACHER")
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) throw new ApiError(401, "Authentication required.");
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, "You don't have permission to do that.");
  }
  next();
};

module.exports = { authenticate, requireRole };
