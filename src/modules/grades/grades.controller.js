const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./grades.service");
const { logAction } = require("../../utils/audit");

const gradeSubmission = asyncHandler(async (req, res) => {
  const grade = await service.gradeSubmission({ ...req.body, teacherId: req.user.teacher.id });
  await logAction({ userId: req.user.id, action: "grade.create", entity: "Grade", entityId: grade.id });
  return created(res, grade);
});

const myGrades = asyncHandler(async (req, res) => ok(res, await service.listForStudent(req.user.student.id)));

const teacherGrades = asyncHandler(async (req, res) => ok(res, await service.listForTeacher(req.user.teacher.id)));

const allGrades = asyncHandler(async (req, res) => ok(res, await service.listAll()));

module.exports = { gradeSubmission, myGrades, teacherGrades, allGrades };
