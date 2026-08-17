const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./announcements.service");

module.exports = {
  create: asyncHandler(async (req, res) => created(res, await service.create({ ...req.body, authorId: req.user.id }))),
  mine: asyncHandler(async (req, res) => ok(res, await service.listForRole(req.user.role))),
  listAll: asyncHandler(async (req, res) => ok(res, await service.listAll())),
};
