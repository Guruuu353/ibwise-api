const router = require("express").Router();
const controller = require("./rubrics.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.use(authenticate);
router.get("/:assignmentId", controller.getByAssignment);
router.put("/:assignmentId", requireRole("TEACHER"), controller.upsert);
router.delete("/:assignmentId", requireRole("TEACHER"), controller.remove);

module.exports = router;
