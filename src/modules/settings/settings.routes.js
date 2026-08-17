const router = require("express").Router();
const controller = require("./settings.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.use(authenticate, requireRole("ADMIN"));
router.get("/", controller.getAll);
router.put("/", controller.update);

module.exports = router;
