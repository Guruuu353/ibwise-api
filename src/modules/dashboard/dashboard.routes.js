const router = require("express").Router();
const controller = require("./dashboard.controller");
const { authenticate } = require("../../middleware/auth.middleware");

router.get("/stats", authenticate, controller.stats);
router.get("/reports", authenticate, controller.reports);

module.exports = router;
