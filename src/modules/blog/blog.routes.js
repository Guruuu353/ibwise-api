const router = require("express").Router();
const controller = require("./blog.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

// Public — no auth — for the marketing site's blog feed.
router.get("/", controller.listPublished);
router.get("/categories", controller.listCategories);
router.get("/post/:slug", controller.getBySlug);

router.use(authenticate);
router.post("/categories", requireRole("ADMIN"), controller.createCategory);
router.get("/moderation", requireRole("ADMIN"), controller.listForModeration);
router.post("/", requireRole("TEACHER", "ADMIN"), controller.create);
router.patch("/:id/approve", requireRole("ADMIN"), controller.approve);
router.patch("/:id/reject", requireRole("ADMIN"), controller.reject);

module.exports = router;
