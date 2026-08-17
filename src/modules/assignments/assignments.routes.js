const router = require("express").Router();
const controller = require("./assignments.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const upload = require("../../middleware/upload.middleware");
const { createRules } = require("./assignments.validation");

router.use(authenticate);

router.get("/", controller.listForCourse);          // ?courseId=
router.get("/mine", controller.myAssignments);       // role-aware: teacher's created, or student's assigned
router.get("/all", requireRole("ADMIN"), controller.listAll);
router.get("/:id", controller.getById);
router.post("/", requireRole("TEACHER"), createRules, validate, controller.create);
router.put("/:id", requireRole("TEACHER"), controller.update);
router.post("/:id/attachments", requireRole("TEACHER"), upload.single("file"), controller.uploadAttachment);

module.exports = router;
