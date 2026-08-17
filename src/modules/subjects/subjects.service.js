const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");
const { enrollClassInCourse } = require("../../utils/enrollment");

const list = () => prisma.subject.findMany({ orderBy: { name: "asc" } });
const create = (data) => prisma.subject.create({ data });
const update = (id, data) => prisma.subject.update({ where: { id }, data });
const remove = (id) => prisma.subject.delete({ where: { id } });

// "Courses" = a subject taught to a class by a teacher (see schema comment).
const listCourses = ({ classId, teacherId }) =>
  prisma.course.findMany({
    where: { ...(classId ? { classId } : {}), ...(teacherId ? { teacherId } : {}) },
    include: { class: true, subject: true, teacher: { include: { user: true } } },
  });

async function createCourse({ classId, subjectId, teacherId }) {
  const [cls, subject, teacher] = await Promise.all([
    prisma.class.findUnique({ where: { id: classId } }),
    prisma.subject.findUnique({ where: { id: subjectId } }),
    prisma.teacher.findUnique({ where: { id: teacherId } }),
  ]);
  if (!cls || !subject || !teacher) throw new ApiError(404, "Class, subject or teacher not found.");
  const course = await prisma.course.create({ data: { classId, subjectId, teacherId } });
  await enrollClassInCourse(classId, course.id);
  return course;
}

// Reassign the teacher on an existing course offering.
async function updateCourse(id, { teacherId }) {
  if (teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new ApiError(404, "Teacher not found.");
  }
  return prisma.course.update({ where: { id }, data: { teacherId } });
}

// Unassign — removes the course offering entirely (and its enrollments/lessons/assignments via cascade).
const removeCourse = (id) => prisma.course.delete({ where: { id } });

module.exports = { list, create, update, remove, listCourses, createCourse, updateCourse, removeCourse };
