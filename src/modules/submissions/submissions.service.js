const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

// A submission row already exists (created PENDING when the assignment was
// published) — submitting means filling it in, not creating a new row.
// That keeps "who hasn't submitted yet" a trivial query.
async function submit({ studentId, assignmentId, content, files = [] }) {
  const submission = await prisma.submission.findUnique({ where: { assignmentId_studentId: { assignmentId, studentId } } });
  if (!submission) throw new ApiError(404, "No submission slot found for this assignment — are you enrolled in this course?");

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  const isLate = assignment && new Date() > assignment.dueDate;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.submission.update({
      where: { id: submission.id },
      data: { content, status: isLate ? "LATE" : "SUBMITTED", submittedAt: new Date() },
    });
    if (files.length) {
      await tx.submissionFile.createMany({
        data: files.map((f) => ({
          submissionId: submission.id,
          url: `/uploads/${f.filename}`,
          filename: f.originalname,
          fileType: f.mimetype,
          size: f.size,
        })),
      });
    }
    return updated;
  });
}

const listForAssignment = (assignmentId) =>
  prisma.submission.findMany({
    where: { assignmentId },
    include: { student: { include: { user: true } }, files: true, grade: true, feedback: true },
    orderBy: { submittedAt: "asc" },
  });

// Admin oversight — every submission across every assignment.
const listAll = () =>
  prisma.submission.findMany({
    include: {
      student: { include: { user: true } },
      assignment: { include: { course: { include: { class: true, subject: true } } } },
      grade: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

async function markReviewed(id, teacherId) {
  // Ownership check: only the teacher of the parent course can touch this.
  const submission = await prisma.submission.findUnique({ where: { id }, include: { assignment: true } });
  if (!submission) throw new ApiError(404, "Submission not found.");
  if (submission.assignment.teacherId !== teacherId) throw new ApiError(403, "Not your assignment.");
  return prisma.submission.update({ where: { id }, data: { status: "REVIEWED" } });
}

module.exports = { submit, listForAssignment, markReviewed, listAll };
