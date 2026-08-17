const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

function letterFor(score, maxScore) {
  const pct = (score / maxScore) * 100;
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "E";
}

// A single call records the grade AND the accompanying feedback, then flips
// the submission to GRADED — mirrors proposal §9 ("teacher provides grade
// and feedback") as one teacher action instead of two separate screens.
//
// rubricScores (optional): [{ criterionId, points, comment }] — when the
// assignment has a rubric, the overall score/maxScore are computed from
// these instead of being passed in directly, and each criterion's score is
// persisted so students see a breakdown, not just a single number.
async function gradeSubmission({ teacherId, submissionId, score, maxScore = 100, comment, rubricScores }) {
  const submission = await prisma.submission.findUnique({ where: { id: submissionId }, include: { assignment: { include: { rubric: { include: { criteria: true } } } } } });
  if (!submission) throw new ApiError(404, "Submission not found.");
  if (submission.assignment.teacherId !== teacherId) throw new ApiError(403, "Not your assignment.");

  let finalScore = score;
  let finalMaxScore = maxScore;

  if (rubricScores?.length) {
    const rubric = submission.assignment.rubric;
    if (!rubric) throw new ApiError(400, "This assignment has no rubric to grade against.");
    const criteriaById = new Map(rubric.criteria.map((c) => [c.id, c]));
    for (const rs of rubricScores) {
      const criterion = criteriaById.get(rs.criterionId);
      if (!criterion) throw new ApiError(400, `Unknown rubric criterion ${rs.criterionId}.`);
      if (rs.points < 0 || rs.points > criterion.maxPoints) {
        throw new ApiError(400, `${criterion.title}: points must be between 0 and ${criterion.maxPoints}.`);
      }
    }
    finalScore = rubricScores.reduce((sum, rs) => sum + rs.points, 0);
    finalMaxScore = rubric.criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  }

  const letter = letterFor(finalScore, finalMaxScore);

  return prisma.$transaction(async (tx) => {
    const grade = await tx.grade.upsert({
      where: { submissionId },
      update: { score: finalScore, maxScore: finalMaxScore, letter, teacherId },
      create: { submissionId, teacherId, score: finalScore, maxScore: finalMaxScore, letter },
    });

    if (rubricScores?.length) {
      await tx.rubricScore.deleteMany({ where: { gradeId: grade.id } });
      await tx.rubricScore.createMany({
        data: rubricScores.map((rs) => ({ gradeId: grade.id, criterionId: rs.criterionId, points: rs.points, comment: rs.comment || null })),
      });
    }

    if (comment) {
      await tx.feedback.create({ data: { submissionId, teacherId, comment } });
    }
    await tx.submission.update({ where: { id: submissionId }, data: { status: "GRADED" } });
    return tx.grade.findUnique({ where: { id: grade.id }, include: { rubricScores: { include: { criterion: true } } } });
  });
}

const listForStudent = (studentId) =>
  prisma.grade.findMany({
    where: { submission: { studentId } },
    include: {
      rubricScores: { include: { criterion: true } },
      submission: { include: { assignment: { include: { course: { include: { subject: true, class: true } } } }, feedback: true } },
    },
    orderBy: { gradedAt: "desc" },
  });

// Admin oversight — every grade across every course.
const listAll = () =>
  prisma.grade.findMany({
    include: {
      teacher: { include: { user: true } },
      submission: { include: { student: { include: { user: true } }, assignment: true } },
    },
    orderBy: { gradedAt: "desc" },
    take: 200,
  });

// Teacher's own view — every grade they've personally given.
const listForTeacher = (teacherId) =>
  prisma.grade.findMany({
    where: { teacherId },
    include: {
      submission: {
        include: {
          student: { include: { user: true } },
          assignment: { include: { course: { include: { class: true, subject: true } } } },
          feedback: true,
        },
      },
    },
    orderBy: { gradedAt: "desc" },
  });

module.exports = { gradeSubmission, listForStudent, listAll, listForTeacher };
