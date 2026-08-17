const prisma = require("../../config/db");

// Powers the Admin overview stat cards (proposal §6) with real counts
// instead of the frontend faking numbers.
async function adminStats() {
  const [students, teachers, classes, openAssignments, pendingBlog] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.assignment.count({ where: { status: "PUBLISHED" } }),
    prisma.blogPost.count({ where: { status: "PENDING_REVIEW" } }),
  ]);
  return { students, teachers, classes, openAssignments, pendingBlog };
}

async function teacherStats(teacherId) {
  const [classCount, assignmentCount, ungraded] = await Promise.all([
    prisma.course.count({ where: { teacherId } }),
    prisma.assignment.count({ where: { teacherId } }),
    prisma.submission.count({ where: { assignment: { teacherId }, status: { in: ["SUBMITTED", "LATE"] } } }),
  ]);
  return { classCount, assignmentCount, ungraded };
}

async function studentStats(studentId) {
  const [pending, graded] = await Promise.all([
    prisma.submission.count({ where: { studentId, status: "PENDING" } }),
    prisma.submission.count({ where: { studentId, status: "GRADED" } }),
  ]);
  return { pending, graded };
}

module.exports = { adminStats, teacherStats, studentStats, adminReports };

// Broader aggregate view for the admin Reports page — grade distribution,
// fee collection, attendance and curriculum mix. Kept as one call so the
// Reports page doesn't need to fire five separate requests.
async function adminReports() {
  const [gradeAgg, invoiceAgg, attendanceAgg, classesByCurriculum, submissionsByStatus] = await Promise.all([
    prisma.grade.aggregate({ _avg: { score: true }, _count: true }),
    prisma.invoice.groupBy({ by: ["status"], _count: true, _sum: { amount: true, balance: true } }),
    prisma.attendance.groupBy({ by: ["status"], _count: true }),
    prisma.class.groupBy({ by: ["curriculum"], _count: true }),
    prisma.submission.groupBy({ by: ["status"], _count: true }),
  ]);

  return {
    averageGrade: gradeAgg._avg.score ? Math.round(gradeAgg._avg.score) : null,
    gradedCount: gradeAgg._count,
    invoicesByStatus: invoiceAgg,
    attendanceByStatus: attendanceAgg,
    classesByCurriculum,
    submissionsByStatus,
  };
}
