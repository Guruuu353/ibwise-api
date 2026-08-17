const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

async function getByAssignment(assignmentId) {
  return prisma.rubric.findUnique({
    where: { assignmentId },
    include: { criteria: { orderBy: { order: "asc" } } },
  });
}

// Creates or fully replaces the rubric for an assignment — editing a
// rubric is rare enough that "delete criteria, recreate" is simpler and
// safer than diffing, and any existing RubricScores cascade-delete with
// their criterion so a re-grade is required after a rubric edit (correct:
// old scores don't make sense against changed criteria).
async function upsert(assignmentId, teacherId, { title, criteria }) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new ApiError(404, "Assignment not found.");
  if (assignment.teacherId !== teacherId) throw new ApiError(403, "Not your assignment.");
  if (!criteria?.length) throw new ApiError(400, "A rubric needs at least one criterion.");

  return prisma.$transaction(async (tx) => {
    const rubric = await tx.rubric.upsert({
      where: { assignmentId },
      update: { title: title || "Grading rubric" },
      create: { assignmentId, title: title || "Grading rubric" },
    });
    await tx.rubricCriterion.deleteMany({ where: { rubricId: rubric.id } });
    await tx.rubricCriterion.createMany({
      data: criteria.map((c, i) => ({
        rubricId: rubric.id,
        title: c.title,
        description: c.description || null,
        maxPoints: c.maxPoints,
        order: i,
      })),
    });
    return tx.rubric.findUnique({ where: { id: rubric.id }, include: { criteria: { orderBy: { order: "asc" } } } });
  });
}

async function remove(assignmentId, teacherId) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new ApiError(404, "Assignment not found.");
  if (assignment.teacherId !== teacherId) throw new ApiError(403, "Not your assignment.");
  await prisma.rubric.deleteMany({ where: { assignmentId } });
}

module.exports = { getByAssignment, upsert, remove };
