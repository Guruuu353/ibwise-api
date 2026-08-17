const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./inquiries.service");

module.exports = {
  create: asyncHandler(async (req, res) => created(res, await service.create(req.body))),
  list: asyncHandler(async (req, res) => ok(res, await service.list())),
  respond: asyncHandler(async (req, res) => ok(res, await service.markResponded(req.params.id))),
};
