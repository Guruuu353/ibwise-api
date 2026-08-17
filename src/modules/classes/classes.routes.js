const router = require("express").Router();
const controller = require("./classes.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.use(authenticate);
router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", requireRole("ADMIN"), controller.create);
router.put("/:id", requireRole("ADMIN"), controller.update);
router.delete("/:id", requireRole("ADMIN"), controller.remove);

module.exports = router;
