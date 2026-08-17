const router = require("express").Router();
const controller = require("./lessons.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { createRules } = require("./lessons.validation");

router.use(authenticate);

router.get("/", controller.listForCourse);      // ?courseId=
router.get("/mine", controller.mine);            // student's content feed
router.post("/", requireRole("TEACHER"), createRules, validate, controller.create);
router.delete("/:id", requireRole("TEACHER"), controller.remove);

module.exports = router;
