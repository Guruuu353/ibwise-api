const asyncHandler = require("../../utils/asyncHandler");
const { ok, created, noContent } = require("../../utils/apiResponse");
const service = require("./lessons.service");

module.exports = {
  create: asyncHandler(async (req, res) => created(res, await service.create({ ...req.body, teacherId: req.user.teacher.id }))),
  listForCourse: asyncHandler(async (req, res) => ok(res, await service.listForCourse(req.query.courseId))),
  mine: asyncHandler(async (req, res) => {
    if (req.user.role === "STUDENT") return ok(res, await service.listForStudent(req.user.student.id));
    return ok(res, []);
  }),
  remove: asyncHandler(async (req, res) => { await service.remove(req.params.id, req.user.teacher.id); return noContent(res); }),
};
