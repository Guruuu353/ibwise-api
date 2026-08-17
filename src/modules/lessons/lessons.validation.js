const { body } = require("express-validator");

const createRules = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("courseId").notEmpty().withMessage("courseId is required."),
  body("contentType").optional().isIn(["NOTE", "VIDEO", "FILE", "LINK"]),
];

module.exports = { createRules };
