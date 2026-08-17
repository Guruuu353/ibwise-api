const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

// Each report returns { title, columns, rows } — the same shape the Excel
// and PDF exporters expect, and what the frontend table view renders too.

async function studentsReport({ classId } = {}) {
  const students = await prisma.student.findMany({
    where: classId ? { classId } : {},
    include: { user: true, class: true },
    orderBy: { user: { lastName: "asc" } },
  });
  return {
    title: "Students Roster",
    columns: [
      { key: "name", header: "Name", width: 26 },
      { key: "admissionNo", header: "Admission No", width: 16 },
      { key: "email", header: "Email", width: 28 },
      { key: "class", header: "Class", width: 20 },
      { key: "curriculum", header: "Curriculum", width: 14 },
      { key: "status", header: "Status", width: 12 },
    ],
    rows: students.map((s) => ({
      name: `${s.user.firstName} ${s.user.lastName}`,
      admissionNo: s.admissionNo,
      email: s.user.email,
      class: s.class?.name || "Unassigned",
      curriculum: s.class?.curriculum || "",
      status: s.user.isActive ? "Active" : "Inactive",
    })),
  };
}

async function teachersReport() {
  const teachers = await prisma.teacher.findMany({
    include: { user: true, courses: { include: { subject: true, class: true } } },
    orderBy: { user: { lastName: "asc" } },
  });
  return {
    title: "Teachers & Assignments",
    columns: [
      { key: "name", header: "Name", width: 26 },
      { key: "staffNo", header: "Staff No", width: 14 },
      { key: "email", header: "Email", width: 28 },
      { key: "courses", header: "Assigned Courses", width: 44 },
      { key: "status", header: "Status", width: 14 },
    ],
    rows: teachers.map((t) => ({
      name: `${t.user.firstName} ${t.user.lastName}`,
      staffNo: t.staffNo,
      email: t.user.email,
      courses: t.courses.map((c) => `${c.subject.name} — ${c.class.name}`).join("; ") || "None",
      status: t.isApproved ? (t.user.isActive ? "Active" : "Inactive") : "Pending approval",
    })),
  };
}

async function attendanceReport({ classId, from, to } = {}) {
  const where = {
    ...(classId ? { course: { classId } } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
      : {}),
  };
  const records = await prisma.attendance.findMany({
    where,
    include: { student: { include: { user: true } }, course: { include: { subject: true, class: true } } },
    orderBy: { date: "desc" },
  });
  return {
    title: "Attendance Report",
    columns: [
      { key: "date", header: "Date", width: 14 },
      { key: "student", header: "Student", width: 24 },
      { key: "class", header: "Class", width: 18 },
      { key: "subject", header: "Subject", width: 18 },
      { key: "status", header: "Status", width: 12 },
    ],
    rows: records.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      student: `${r.student.user.firstName} ${r.student.user.lastName}`,
      class: r.course.class.name,
      subject: r.course.subject.name,
      status: r.status,
    })),
  };
}

async function gradesReport({ classId, subjectId } = {}) {
  const grades = await prisma.grade.findMany({
    where: {
      submission: {
        assignment: {
          ...(classId ? { course: { classId } } : {}),
          ...(subjectId ? { course: { subjectId } } : {}),
        },
      },
    },
    include: {
      teacher: { include: { user: true } },
      submission: {
        include: {
          student: { include: { user: true } },
          assignment: { include: { course: { include: { subject: true, class: true } } } },
        },
      },
    },
    orderBy: { gradedAt: "desc" },
  });
  return {
    title: "Grades Report",
    columns: [
      { key: "student", header: "Student", width: 24 },
      { key: "class", header: "Class", width: 16 },
      { key: "subject", header: "Subject", width: 16 },
      { key: "assignment", header: "Assignment", width: 24 },
      { key: "score", header: "Score", width: 10 },
      { key: "letter", header: "Grade", width: 8 },
      { key: "teacher", header: "Teacher", width: 22 },
      { key: "gradedAt", header: "Graded At", width: 14 },
    ],
    rows: grades.map((g) => ({
      student: `${g.submission.student.user.firstName} ${g.submission.student.user.lastName}`,
      class: g.submission.assignment.course.class.name,
      subject: g.submission.assignment.course.subject.name,
      assignment: g.submission.assignment.title,
      score: `${g.score}/${g.maxScore}`,
      letter: g.letter,
      teacher: `${g.teacher.user.firstName} ${g.teacher.user.lastName}`,
      gradedAt: g.gradedAt ? g.gradedAt.toISOString().slice(0, 10) : "",
    })),
  };
}

async function feesReport({ status } = {}) {
  const invoices = await prisma.invoice.findMany({
    where: status ? { status } : {},
    include: { student: { include: { user: true, class: true } }, feeStructure: { include: { class: true } } },
    orderBy: { dueDate: "desc" },
  });
  return {
    title: "Fees Report",
    columns: [
      { key: "student", header: "Student", width: 24 },
      { key: "class", header: "Class", width: 16 },
      { key: "term", header: "Term", width: 14 },
      { key: "amount", header: "Amount", width: 12 },
      { key: "balance", header: "Balance", width: 12 },
      { key: "status", header: "Status", width: 12 },
      { key: "dueDate", header: "Due Date", width: 14 },
    ],
    rows: invoices.map((i) => ({
      student: `${i.student.user.firstName} ${i.student.user.lastName}`,
      class: i.student.class?.name || i.feeStructure?.class?.name || "",
      term: i.feeStructure?.term || "",
      amount: i.amount,
      balance: i.balance,
      status: i.status,
      dueDate: i.dueDate ? i.dueDate.toISOString().slice(0, 10) : "",
    })),
  };
}

const REPORTS = {
  students: studentsReport,
  teachers: teachersReport,
  attendance: attendanceReport,
  grades: gradesReport,
  fees: feesReport,
};

async function build(type, params) {
  const fn = REPORTS[type];
  if (!fn) throw new ApiError(404, `Unknown report type "${type}". Available: ${Object.keys(REPORTS).join(", ")}`);
  return fn(params);
}

module.exports = { build, REPORTS: Object.keys(REPORTS) };
