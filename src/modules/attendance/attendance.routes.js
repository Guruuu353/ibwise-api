const router = require("express").Router();
const controller = require("./attendance.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { markRules } = require("./attendance.validation");

router.use(authenticate);

router.post("/mark", requireRole("TEACHER"), markRules, validate, controller.mark);
router.get("/course", requireRole("TEACHER", "ADMIN"), controller.listForCourse); // ?courseId=&date=
router.get("/mine", requireRole("STUDENT"), controller.mine);
router.get("/mine/summary", requireRole("STUDENT"), controller.mySummary);

module.exports = router;
