const { body } = require("express-validator");

const createRules = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("message").trim().notEmpty().withMessage("Message is required."),
  body("phone").optional().isString(),
];

module.exports = { createRules };
