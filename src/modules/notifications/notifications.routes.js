const router = require("express").Router();
const controller = require("./notifications.controller");
const { authenticate } = require("../../middleware/auth.middleware");

router.use(authenticate);
router.get("/mine", controller.mine);
router.patch("/:id/read", controller.markRead);
router.patch("/read-all", controller.markAllRead);

module.exports = router;
