const { body } = require("express-validator");

const createRules = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("courseId").notEmpty().withMessage("Course is required."),
  body("dueDate").isISO8601().withMessage("A valid due date is required."),
  body("instructions").optional().isString(),
];

module.exports = { createRules };
