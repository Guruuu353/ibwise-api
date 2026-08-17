const router = require("express").Router();
const controller = require("./reports.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.use(authenticate, requireRole("ADMIN"));
router.get("/", controller.listTypes);
router.get("/:type", controller.generate);

module.exports = router;
