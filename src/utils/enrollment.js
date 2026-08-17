const prisma = require("../config/db");

// Enrolls a student into every course offered for their class. Called
// whenever a student is created with a class, or moved to a new class.
// skipDuplicates makes this safe to call repeatedly.
async function enrollStudentInClassCourses(studentId, classId) {
  if (!classId) return;
  const courses = await prisma.course.findMany({ where: { classId }, select: { id: true } });
  if (!courses.length) return;
  await prisma.enrollment.createMany({
    data: courses.map((c) => ({ studentId, courseId: c.id })),
    skipDuplicates: true,
  });
}

// Enrolls every student already in a class into a newly-created course
// offering for that class (e.g. admin adds "Chemistry — Grade 8").
async function enrollClassInCourse(classId, courseId) {
  const students = await prisma.student.findMany({ where: { classId }, select: { id: true } });
  if (!students.length) return;
  await prisma.enrollment.createMany({
    data: students.map((s) => ({ studentId: s.id, courseId })),
    skipDuplicates: true,
  });
}

module.exports = { enrollStudentInClassCourses, enrollClassInCourse };
