const crypto = require("crypto");
const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

// Jitsi Meet's public instance needs no API key/signup and supports
// iframe embedding out of the box — a real, working video room, not a
// placeholder. The room name just needs to be hard to guess.
function generateRoomName(courseId) {
  return `ibwise-${courseId.slice(-6)}-${crypto.randomBytes(6).toString("hex")}`;
}

const include = {
  course: { include: { subject: true, class: true } },
  teacher: { include: { user: true } },
};

async function schedule({ courseId, teacherId, title, scheduledAt }) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new ApiError(404, "Class not found.");
  if (course.teacherId !== teacherId) throw new ApiError(403, "You can only schedule sessions for your own classes.");

  return prisma.liveSession.create({
    data: { courseId, teacherId, title, scheduledAt: new Date(scheduledAt), roomName: generateRoomName(courseId) },
    include,
  });
}

// Flips a session live and notifies every enrolled student — this is what
// makes "the teacher started class" actually show up on students' screens.
async function start(id, teacherId) {
  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.teacherId !== teacherId) throw new ApiError(403, "Not your session.");

  const updated = await prisma.liveSession.update({
    where: { id },
    data: { status: "LIVE", startedAt: new Date() },
    include,
  });

  const enrollments = await prisma.enrollment.findMany({ where: { courseId: session.courseId }, include: { student: true } });
  if (enrollments.length) {
    await prisma.notification.createMany({
      data: enrollments.map((e) => ({
        userId: e.student.userId,
        type: "LIVE_SESSION",
        title: `Live class started: ${updated.title}`,
        body: `${updated.course.subject?.name || "Class"} is live now — join from My Classes.`,
      })),
    });
  }

  return updated;
}

async function end(id, teacherId) {
  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.teacherId !== teacherId) throw new ApiError(403, "Not your session.");
  return prisma.liveSession.update({ where: { id }, data: { status: "ENDED", endedAt: new Date() }, include });
}

async function cancel(id, teacherId) {
  const session = await prisma.liveSession.findUnique({ where: { id } });
  if (!session) throw new ApiError(404, "Session not found.");
  if (session.teacherId !== teacherId) throw new ApiError(403, "Not your session.");
  return prisma.liveSession.update({ where: { id }, data: { status: "CANCELLED" }, include });
}

// Every session (scheduled/live/ended) for a teacher's own courses.
const listForTeacher = (teacherId) =>
  prisma.liveSession.findMany({ where: { teacherId }, include, orderBy: { scheduledAt: "desc" } });

// A student's live sessions — every course they're enrolled in, upcoming
// and currently-live ones first.
const listForStudent = (studentId) =>
  prisma.liveSession.findMany({
    where: { course: { enrollments: { some: { studentId } } }, status: { in: ["SCHEDULED", "LIVE"] } },
    include,
    orderBy: { scheduledAt: "asc" },
  });

async function getById(id) {
  const session = await prisma.liveSession.findUnique({ where: { id }, include });
  if (!session) throw new ApiError(404, "Session not found.");
  return session;
}

module.exports = { schedule, start, end, cancel, listForTeacher, listForStudent, getById };
