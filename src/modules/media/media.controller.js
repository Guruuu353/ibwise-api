const asyncHandler = require("../../utils/asyncHandler");
const { ok, created, noContent } = require("../../utils/apiResponse");
const service = require("./media.service");

module.exports = {
  list: asyncHandler(async (req, res) => ok(res, await service.list())),
  upload: asyncHandler(async (req, res) => created(res, await service.record({ file: req.file, uploadedById: req.user.id }))),
  remove: asyncHandler(async (req, res) => { await service.remove(req.params.id); return noContent(res); }),
};
