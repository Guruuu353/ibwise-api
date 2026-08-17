const router = require("express").Router();
const controller = require("./users.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

// Every route here is admin-only — user management is an admin function
// throughout the proposal (§6 Admin Dashboard).
router.use(authenticate, requireRole("ADMIN"));

router.get("/", controller.list);
router.get("/teachers/pending", controller.pendingTeachers);
router.patch("/teachers/:teacherId/approve", controller.approveTeacher);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.deactivate);

module.exports = router;
