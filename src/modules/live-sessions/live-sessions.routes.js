const router = require("express").Router();
const { body } = require("express-validator");
const controller = require("./live-sessions.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");

const scheduleRules = [
  body("courseId").notEmpty(),
  body("title").trim().notEmpty(),
  body("scheduledAt").isISO8601(),
];

router.use(authenticate);

router.get("/mine/teaching", requireRole("TEACHER"), controller.mineAsTeacher);
router.get("/mine/joining", requireRole("STUDENT"), controller.mineAsStudent);
router.get("/:id", controller.getById);

router.post("/", requireRole("TEACHER"), scheduleRules, validate, controller.schedule);
router.patch("/:id/start", requireRole("TEACHER"), controller.start);
router.patch("/:id/end", requireRole("TEACHER"), controller.end);
router.patch("/:id/cancel", requireRole("TEACHER"), controller.cancel);

module.exports = router;
