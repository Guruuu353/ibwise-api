const router = require("express").Router();
const controller = require("./media.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");
const upload = require("../../middleware/upload.middleware");

router.use(authenticate, requireRole("ADMIN", "TEACHER"));

router.get("/", controller.list);
router.post("/", upload.single("file"), controller.upload);
router.delete("/:id", requireRole("ADMIN"), controller.remove);

module.exports = router;
