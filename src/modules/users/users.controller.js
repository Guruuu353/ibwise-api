const asyncHandler = require("../../utils/asyncHandler");
const { ok, created, noContent } = require("../../utils/apiResponse");
const service = require("./users.service");
const { logAction } = require("../../utils/audit");

const list = asyncHandler(async (req, res) => {
  const result = await service.list(req.query);
  return ok(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
});

const getById = asyncHandler(async (req, res) => ok(res, await service.getById(req.params.id)));

const create = asyncHandler(async (req, res) => {
  const user = await service.create(req.body);
  await logAction({ userId: req.user.id, action: "user.create", entity: "User", entityId: user.id });
  return created(res, user);
});

const update = asyncHandler(async (req, res) => {
  const user = await service.update(req.params.id, req.body);
  await logAction({ userId: req.user.id, action: "user.update", entity: "User", entityId: user.id, meta: req.body });
  return ok(res, user);
});

const deactivate = asyncHandler(async (req, res) => {
  await service.deactivate(req.params.id);
  await logAction({ userId: req.user.id, action: "user.deactivate", entity: "User", entityId: req.params.id });
  return noContent(res);
});

const pendingTeachers = asyncHandler(async (req, res) => ok(res, await service.listPendingTeachers()));

const approveTeacher = asyncHandler(async (req, res) => {
  const teacher = await service.approveTeacher(req.params.teacherId);
  await logAction({ userId: req.user.id, action: "teacher.approve", entity: "Teacher", entityId: teacher.id });
  return ok(res, teacher);
});

module.exports = { list, getById, create, update, deactivate, pendingTeachers, approveTeacher };
