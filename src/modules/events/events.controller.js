const asyncHandler = require("../../utils/asyncHandler");
const { ok, created, noContent } = require("../../utils/apiResponse");
const service = require("./events.service");

module.exports = {
  list: asyncHandler(async (req, res) => ok(res, await service.listUpcoming())),
  listAll: asyncHandler(async (req, res) => {
    const result = await service.listAll(req.query);
    return ok(res, result.items, { total: result.total, page: result.page, pageSize: result.pageSize });
  }),
  getById: asyncHandler(async (req, res) => ok(res, await service.getById(req.params.id))),
  create: asyncHandler(async (req, res) => created(res, await service.create(req.body))),
  update: asyncHandler(async (req, res) => ok(res, await service.update(req.params.id, req.body))),
  remove: asyncHandler(async (req, res) => { await service.remove(req.params.id); return noContent(res); }),
};
