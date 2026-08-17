const router = require("express").Router();
const controller = require("./grades.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const validate = require("../../middleware/validate.middleware");
const { gradeRules } = require("./grades.validation");

router.use(authenticate);

router.post("/", requireRole("TEACHER"), gradeRules, validate, controller.gradeSubmission);
router.get("/mine", requireRole("STUDENT"), controller.myGrades);
router.get("/teacher", requireRole("TEACHER"), controller.teacherGrades);
router.get("/", requireRole("ADMIN"), controller.allGrades);

module.exports = router;
