const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/apiResponse");
const service = require("./settings.service");
const { logAction } = require("../../utils/audit");

module.exports = {
  getAll: asyncHandler(async (req, res) => ok(res, await service.getAll())),
  update: asyncHandler(async (req, res) => {
    await service.setMany(req.body);
    await logAction({ userId: req.user.id, action: "settings.update", entity: "Setting", meta: req.body });
    return ok(res, await service.getAll());
  }),
};
