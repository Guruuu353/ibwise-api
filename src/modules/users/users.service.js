const prisma = require("../../config/db");
const { hashPassword } = require("../../utils/hash");
const { ApiError } = require("../../utils/apiResponse");
const { sanitizeUser } = require("../auth/auth.service");
const { enrollStudentInClassCourses } = require("../../utils/enrollment");

async function list({ role, page = 1, pageSize = 20 }) {
  const where = role ? { role } : {};
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { student: { include: { class: true } }, teacher: true, parent: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { items: items.map(sanitizeUser), total, page: Number(page), pageSize: Number(pageSize) };
}

async function getById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { student: true, teacher: true, parent: true },
  });
  if (!user) throw new ApiError(404, "User not found.");
  return sanitizeUser(user);
}

// Admin-created accounts (proposal: admin manages users/teachers/students).
// Teachers created here are approved immediately — the approval gate only
// applies to self-registration (see auth.service.js).
async function create({ email, password, firstName, lastName, role, phone, classId }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const passwordHash = await hashPassword(password);
  const { user, student } = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({ data: { email, passwordHash, firstName, lastName, role, phone } });
    let studentRecord = null;
    if (role === "STUDENT") {
      studentRecord = await tx.student.create({
        data: { userId: created.id, admissionNo: `IB-${Date.now().toString().slice(-6)}`, classId: classId || null },
      });
    }
    if (role === "TEACHER") await tx.teacher.create({ data: { userId: created.id, staffNo: `T-${Date.now().toString().slice(-6)}`, isApproved: true } });
    if (role === "PARENT") await tx.parent.create({ data: { userId: created.id } });
    return { user: created, student: studentRecord };
  });

  if (student?.classId) await enrollStudentInClassCourses(student.id, student.classId);

  return { ...sanitizeUser(user), student };
}

// The list of self-registered teachers still waiting on approval.
const listPendingTeachers = () =>
  prisma.teacher.findMany({ where: { isApproved: false }, include: { user: true } });

async function approveTeacher(teacherId) {
  const teacher = await prisma.teacher.update({ where: { id: teacherId }, data: { isApproved: true } });
  return teacher;
}

async function update(id, data) {
  const { email, firstName, lastName, phone, isActive, classId } = data;
  const user = await prisma.user.update({
    where: { id },
    data: { email, firstName, lastName, phone, isActive },
  });

  // classId is only meaningful for students — passed from the admin's edit
  // form when they change a student's class assignment.
  if (classId !== undefined) {
    const student = await prisma.student.findUnique({ where: { userId: id } });
    if (student) {
      await prisma.student.update({ where: { id: student.id }, data: { classId: classId || null } });
      if (classId) await enrollStudentInClassCourses(student.id, classId);
    }
  }

  return sanitizeUser(user);
}

// Soft delete — deactivate rather than hard-delete, so history (grades,
// audit logs, blog authorship) stays intact.
async function deactivate(id) {
  const user = await prisma.user.update({ where: { id }, data: { isActive: false } });
  return sanitizeUser(user);
}

module.exports = { list, getById, create, update, deactivate, listPendingTeachers, approveTeacher };
