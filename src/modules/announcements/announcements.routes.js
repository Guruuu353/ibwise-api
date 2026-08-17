const router = require("express").Router();
const controller = require("./announcements.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.use(authenticate);
router.get("/mine", controller.mine);
router.get("/all", requireRole("ADMIN"), controller.listAll);
router.post("/", requireRole("ADMIN"), controller.create);

module.exports = router;
