const { body } = require("express-validator");

const registerRules = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),
  body("role").isIn(["ADMIN", "TEACHER", "STUDENT", "PARENT"]).withMessage("Invalid role."),
];

const loginRules = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

const forgotPasswordRules = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
];

module.exports = { registerRules, loginRules, forgotPasswordRules };
