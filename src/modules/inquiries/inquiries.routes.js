const router = require("express").Router();
const controller = require("./inquiries.controller");
const validate = require("../../middleware/validate.middleware");
const { createRules } = require("./inquiries.validation");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

// Public — this is the site's "chat with admissions" popup, no login needed.
router.post("/", createRules, validate, controller.create);

router.get("/", authenticate, requireRole("ADMIN"), controller.list);
router.patch("/:id/respond", authenticate, requireRole("ADMIN"), controller.respond);

module.exports = router;
