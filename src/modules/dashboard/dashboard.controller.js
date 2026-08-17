const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/apiResponse");
const { ApiError } = require("../../utils/apiResponse");
const service = require("./dashboard.service");

const stats = asyncHandler(async (req, res) => {
  if (req.user.role === "ADMIN") return ok(res, await service.adminStats());
  if (req.user.role === "TEACHER") return ok(res, await service.teacherStats(req.user.teacher.id));
  if (req.user.role === "STUDENT") return ok(res, await service.studentStats(req.user.student.id));
  return ok(res, {});
});

const reports = asyncHandler(async (req, res) => {
  if (req.user.role !== "ADMIN") throw new ApiError(403, "Admin only.");
  return ok(res, await service.adminReports());
});

module.exports = { stats, reports };
