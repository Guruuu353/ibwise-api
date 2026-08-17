const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

// Teachers only see/manage assignments for courses they actually teach —
// this is enforced here, not just hidden in the UI.
async function assertOwnsCourse(teacherId, courseId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Course not found.");
  if (course.teacherId !== teacherId) throw new ApiError(403, "You don't teach this course.");
  return course;
}

async function create({ teacherId, title, description, instructions, courseId, dueDate, status }) {
  await assertOwnsCourse(teacherId, courseId);

  return prisma.$transaction(async (tx) => {
    const assignment = await tx.assignment.create({
      data: { title, description, instructions, courseId, teacherId, dueDate: new Date(dueDate), status: status || "PUBLISHED" },
    });

    // Seed a PENDING submission row per enrolled student so "my assignments"
    // queries for a student are a single simple lookup instead of a
    // left-join-and-coalesce every time.
    const enrollments = await tx.enrollment.findMany({ where: { courseId } });
    if (enrollments.length) {
      await tx.submission.createMany({
        data: enrollments.map((e) => ({ assignmentId: assignment.id, studentId: e.studentId, status: "PENDING" })),
        skipDuplicates: true,
      });
    }
    return assignment;
  });
}

const listForCourse = (courseId) =>
  prisma.assignment.findMany({ where: { courseId }, orderBy: { dueDate: "asc" }, include: { attachments: true } });

const listForTeacher = (teacherId) =>
  prisma.assignment.findMany({
    where: { teacherId },
    orderBy: { dueDate: "asc" },
    include: { course: { include: { class: true, subject: true } }, _count: { select: { submissions: true } } },
  });

const listForStudent = async (studentId) => {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new ApiError(404, "Student not found.");
  return prisma.submission.findMany({
    where: { studentId },
    include: { assignment: { include: { course: { include: { subject: true } } } }, grade: true, feedback: true },
    orderBy: { assignment: { dueDate: "asc" } },
  });
};

const getById = async (id) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { attachments: true, course: { include: { class: true, subject: true } }, rubric: { include: { criteria: { orderBy: { order: "asc" } } } } },
  });
  if (!assignment) throw new ApiError(404, "Assignment not found.");
  return assignment;
};

// Admin oversight — every assignment across every course.
const listAll = () =>
  prisma.assignment.findMany({
    include: { course: { include: { class: true, subject: true } }, teacher: { include: { user: true } }, _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

async function update(id, teacherId, data) {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) throw new ApiError(404, "Assignment not found.");
  if (assignment.teacherId !== teacherId) throw new ApiError(403, "You don't own this assignment.");
  return prisma.assignment.update({ where: { id }, data });
}

async function addAttachment(assignmentId, file) {
  return prisma.assignmentAttachment.create({
    data: {
      assignmentId,
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      fileType: file.mimetype,
      size: file.size,
    },
  });
}

module.exports = { create, listForCourse, listForTeacher, listForStudent, getById, update, addAttachment, listAll };
