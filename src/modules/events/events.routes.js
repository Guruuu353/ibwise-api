const router = require("express").Router();
const controller = require("./events.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.get("/", controller.list); // public
router.use(authenticate, requireRole("ADMIN"));
router.get("/all", controller.listAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
