const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

async function assertOwnsCourse(teacherId, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found.");
  if (course.teacherId !== teacherId) throw new ApiError(403, "You don't teach this course.");
}

// Marks a whole class's attendance for one day in a single call — records
// is [{ studentId, status }], one entry per enrolled student. Upsert so
// re-submitting the same day corrects rather than duplicates.
async function markAttendance({ teacherId, courseId, date, records }) {
  await assertOwnsCourse(teacherId, courseId);
  const day = new Date(date);

  return prisma.$transaction(
    records.map((r) =>
      prisma.attendance.upsert({
        where: { courseId_studentId_date: { courseId, studentId: r.studentId, date: day } },
        update: { status: r.status, teacherId },
        create: { courseId, studentId: r.studentId, date: day, status: r.status, teacherId },
      })
    )
  );
}

const listForCourse = (courseId, date) =>
  prisma.attendance.findMany({
    where: { courseId, ...(date ? { date: new Date(date) } : {}) },
    include: { student: { include: { user: true } } },
    orderBy: { date: "desc" },
  });

const listForStudent = (studentId) =>
  prisma.attendance.findMany({
    where: { studentId },
    include: { course: { include: { subject: true, class: true } } },
    orderBy: { date: "desc" },
    take: 60,
  });

async function summaryForStudent(studentId) {
  const records = await prisma.attendance.findMany({ where: { studentId } });
  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  return { total, present, rate: total ? Math.round((present / total) * 100) : null };
}

module.exports = { markAttendance, listForCourse, listForStudent, summaryForStudent };
