const { body } = require("express-validator");

const markRules = [
  body("courseId").notEmpty().withMessage("courseId is required."),
  body("date").isISO8601().withMessage("A valid date is required."),
  body("records").isArray({ min: 1 }).withMessage("records must be a non-empty array."),
  body("records.*.studentId").notEmpty(),
  body("records.*.status").isIn(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
];

module.exports = { markRules };
