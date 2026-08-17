const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/apiResponse");
const service = require("./attendance.service");
const { logAction } = require("../../utils/audit");

module.exports = {
  mark: asyncHandler(async (req, res) => {
    const records = await service.markAttendance({ ...req.body, teacherId: req.user.teacher.id });
    await logAction({ userId: req.user.id, action: "attendance.mark", entity: "Course", entityId: req.body.courseId, meta: { date: req.body.date, count: records.length } });
    return ok(res, records);
  }),
  listForCourse: asyncHandler(async (req, res) => ok(res, await service.listForCourse(req.query.courseId, req.query.date))),
  mine: asyncHandler(async (req, res) => ok(res, await service.listForStudent(req.user.student.id))),
  mySummary: asyncHandler(async (req, res) => ok(res, await service.summaryForStudent(req.user.student.id))),
};
