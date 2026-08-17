const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/apiResponse");
const service = require("./notifications.service");

module.exports = {
  mine: asyncHandler(async (req, res) => ok(res, await service.listForUser(req.user.id))),
  markRead: asyncHandler(async (req, res) => { await service.markRead(req.params.id, req.user.id); return ok(res, { read: true }); }),
  markAllRead: asyncHandler(async (req, res) => { await service.markAllRead(req.user.id); return ok(res, { read: true }); }),
};
