const { body } = require("express-validator");

const gradeRules = [
  body("submissionId").notEmpty().withMessage("submissionId is required."),
  body("score").optional().isFloat({ min: 0 }).withMessage("Score must be a non-negative number."),
  body("maxScore").optional().isFloat({ min: 1 }),
  body("comment").optional().isString(),
  body("rubricScores").optional().isArray({ min: 1 }),
  body("rubricScores.*.criterionId").optional().notEmpty(),
  body("rubricScores.*.points").optional().isFloat({ min: 0 }),
  body().custom((value) => {
    if (value.score === undefined && !(value.rubricScores?.length)) {
      throw new Error("Provide either a score or rubricScores.");
    }
    return true;
  }),
];

module.exports = { gradeRules };
