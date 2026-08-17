const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const authService = require("./auth.service");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return created(res, user);
});

const login = asyncHandler(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  return ok(res, { token, user });
});

const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is a client-side token discard. This endpoint
  // exists so the frontend has a single consistent call, and so a future
  // token-blocklist (e.g. for "log out everywhere") has somewhere to live.
  return ok(res, { message: "Logged out." });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body);
  return ok(res, result);
});

const me = asyncHandler(async (req, res) => {
  return ok(res, require("./auth.service").sanitizeUser(req.user));
});

const updateMe = asyncHandler(async (req, res) => ok(res, await authService.updateOwnProfile(req.user.id, req.body)));

module.exports = { register, login, logout, forgotPassword, me, updateMe };
