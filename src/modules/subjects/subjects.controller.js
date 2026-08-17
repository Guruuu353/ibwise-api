const asyncHandler = require("../../utils/asyncHandler");
const { ok, created, noContent } = require("../../utils/apiResponse");
const service = require("./subjects.service");

module.exports = {
  list: asyncHandler(async (req, res) => ok(res, await service.list())),
  create: asyncHandler(async (req, res) => created(res, await service.create(req.body))),
  update: asyncHandler(async (req, res) => ok(res, await service.update(req.params.id, req.body))),
  remove: asyncHandler(async (req, res) => { await service.remove(req.params.id); return noContent(res); }),
  listCourses: asyncHandler(async (req, res) => ok(res, await service.listCourses(req.query))),
  createCourse: asyncHandler(async (req, res) => created(res, await service.createCourse(req.body))),
  updateCourse: asyncHandler(async (req, res) => ok(res, await service.updateCourse(req.params.courseId, req.body))),
  removeCourse: asyncHandler(async (req, res) => { await service.removeCourse(req.params.courseId); return noContent(res); }),
};
