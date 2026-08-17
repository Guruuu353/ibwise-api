const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./live-sessions.service");

module.exports = {
  schedule: asyncHandler(async (req, res) =>
    created(res, await service.schedule({ ...req.body, teacherId: req.user.teacher.id }))
  ),
  start: asyncHandler(async (req, res) => ok(res, await service.start(req.params.id, req.user.teacher.id))),
  end: asyncHandler(async (req, res) => ok(res, await service.end(req.params.id, req.user.teacher.id))),
  cancel: asyncHandler(async (req, res) => ok(res, await service.cancel(req.params.id, req.user.teacher.id))),
  mineAsTeacher: asyncHandler(async (req, res) => ok(res, await service.listForTeacher(req.user.teacher.id))),
  mineAsStudent: asyncHandler(async (req, res) => ok(res, await service.listForStudent(req.user.student.id))),
  getById: asyncHandler(async (req, res) => ok(res, await service.getById(req.params.id))),
};
