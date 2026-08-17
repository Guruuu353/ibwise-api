const asyncHandler = require("../../utils/asyncHandler");
const { ok, noContent } = require("../../utils/apiResponse");
const service = require("./rubrics.service");

module.exports = {
  getByAssignment: asyncHandler(async (req, res) => ok(res, await service.getByAssignment(req.params.assignmentId))),
  upsert: asyncHandler(async (req, res) =>
    ok(res, await service.upsert(req.params.assignmentId, req.user.teacher.id, req.body))
  ),
  remove: asyncHandler(async (req, res) => {
    await service.remove(req.params.assignmentId, req.user.teacher.id);
    return noContent(res);
  }),
};
