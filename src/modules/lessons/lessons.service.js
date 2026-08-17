const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

async function assertOwnsCourse(teacherId, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found.");
  if (course.teacherId !== teacherId) throw new ApiError(403, "You don't teach this course.");
}

async function create({ teacherId, courseId, title, contentType, body, url }) {
  await assertOwnsCourse(teacherId, courseId);
  return prisma.lesson.create({ data: { teacherId, courseId, title, contentType, body, url } });
}

const listForCourse = (courseId) =>
  prisma.lesson.findMany({ where: { courseId }, orderBy: { createdAt: "desc" } });

// Every lesson across every course the student is enrolled in — powers the
// "My Classes" content feed on the student dashboard.
const listForStudent = async (studentId) => {
  const enrollments = await prisma.enrollment.findMany({ where: { studentId }, select: { courseId: true } });
  const courseIds = enrollments.map((e) => e.courseId);
  return prisma.lesson.findMany({
    where: { courseId: { in: courseIds } },
    include: { course: { include: { subject: true, class: true } } },
    orderBy: { createdAt: "desc" },
  });
};

async function remove(id, teacherId) {
  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) throw new ApiError(404, "Lesson not found.");
  if (lesson.teacherId !== teacherId) throw new ApiError(403, "Not your lesson.");
  return prisma.lesson.delete({ where: { id } });
}

module.exports = { create, listForCourse, listForStudent, remove };
