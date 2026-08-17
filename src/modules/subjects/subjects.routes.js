const router = require("express").Router();
const controller = require("./subjects.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

router.use(authenticate);
router.get("/", controller.list);
router.post("/", requireRole("ADMIN"), controller.create);
router.put("/:id", requireRole("ADMIN"), controller.update);
router.delete("/:id", requireRole("ADMIN"), controller.remove);

// Course offerings (class + subject + teacher)
router.get("/courses", controller.listCourses);
router.post("/courses", requireRole("ADMIN"), controller.createCourse);
router.put("/courses/:courseId", requireRole("ADMIN"), controller.updateCourse);
router.delete("/courses/:courseId", requireRole("ADMIN"), controller.removeCourse);

module.exports = router;
