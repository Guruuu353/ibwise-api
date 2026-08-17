const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./blog.service");
const { logAction } = require("../../utils/audit");

module.exports = {
  listPublished: asyncHandler(async (req, res) => ok(res, await service.listPublished(req.query))),
  getBySlug: asyncHandler(async (req, res) => ok(res, await service.getBySlug(req.params.slug))),
  listCategories: asyncHandler(async (req, res) => ok(res, await service.listCategories())),
  createCategory: asyncHandler(async (req, res) => created(res, await service.createCategory(req.body))),
  listForModeration: asyncHandler(async (req, res) => ok(res, await service.listForModeration())),
  create: asyncHandler(async (req, res) => created(res, await service.create({ ...req.body, authorId: req.user.id, authorRole: req.user.role }))),
  approve: asyncHandler(async (req, res) => {
    const post = await service.setStatus(req.params.id, "PUBLISHED");
    await logAction({ userId: req.user.id, action: "blog.approve", entity: "BlogPost", entityId: post.id });
    return ok(res, post);
  }),
  reject: asyncHandler(async (req, res) => {
    const post = await service.setStatus(req.params.id, "REJECTED");
    await logAction({ userId: req.user.id, action: "blog.reject", entity: "BlogPost", entityId: post.id });
    return ok(res, post);
  }),
};
