const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./assignments.service");
const { logAction } = require("../../utils/audit");

const create = asyncHandler(async (req, res) => {
  const assignment = await service.create({ ...req.body, teacherId: req.user.teacher.id });
  await logAction({ userId: req.user.id, action: "assignment.create", entity: "Assignment", entityId: assignment.id });
  return created(res, assignment);
});

const listForCourse = asyncHandler(async (req, res) => ok(res, await service.listForCourse(req.query.courseId)));
const myAssignments = asyncHandler(async (req, res) => {
  if (req.user.role === "TEACHER") return ok(res, await service.listForTeacher(req.user.teacher.id));
  if (req.user.role === "STUDENT") return ok(res, await service.listForStudent(req.user.student.id));
  return ok(res, []);
});
const getById = asyncHandler(async (req, res) => ok(res, await service.getById(req.params.id)));

const update = asyncHandler(async (req, res) => {
  const assignment = await service.update(req.params.id, req.user.teacher.id, req.body);
  return ok(res, assignment);
});

const uploadAttachment = asyncHandler(async (req, res) => {
  const attachment = await service.addAttachment(req.params.id, req.file);
  return created(res, attachment);
});

const listAll = asyncHandler(async (req, res) => ok(res, await service.listAll()));

module.exports = { create, listForCourse, myAssignments, getById, update, uploadAttachment, listAll };
