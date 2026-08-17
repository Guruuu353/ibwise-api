const router = require("express").Router();
const controller = require("./submissions.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");

router.use(authenticate);

router.post("/", requireRole("STUDENT"), upload.array("files", 5), controller.submit);
router.get("/all", requireRole("ADMIN"), controller.listAll);
router.get("/assignment/:assignmentId", requireRole("TEACHER", "ADMIN"), controller.listForAssignment);
router.patch("/:id/review", requireRole("TEACHER"), controller.markReviewed);

module.exports = router;
