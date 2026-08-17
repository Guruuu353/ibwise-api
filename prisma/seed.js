// Seeds enough data to demo every role end-to-end.
// Run with: npm run seed
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Passw0rd!", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@ibwise.example", passwordHash: password, role: "ADMIN", firstName: "Admin", lastName: "User" },
  });

  const teacherUser = await prisma.user.create({
    data: { email: "achieng@ibwise.example", passwordHash: password, role: "TEACHER", firstName: "Achieng", lastName: "Otieno" },
  });
  const teacher = await prisma.teacher.create({ data: { userId: teacherUser.id, staffNo: "T-000001", isApproved: true } });

  // A second, self-registered-style teacher still awaiting approval — lets
  // you demo the Users > Pending Teachers approval flow immediately.
  const pendingTeacherUser = await prisma.user.create({
    data: { email: "newteacher@ibwise.example", passwordHash: password, role: "TEACHER", firstName: "Kiplangat", lastName: "Rono" },
  });
  await prisma.teacher.create({ data: { userId: pendingTeacherUser.id, staffNo: "T-000002", isApproved: false } });

  const cls = await prisma.class.create({
    data: { name: "Grade 7", curriculum: "CBC", levelName: "Junior Secondary", homeroomTeacherId: teacher.id },
  });
  await prisma.class.create({ data: { name: "IGCSE Year 10", curriculum: "CAMBRIDGE", levelName: "Cambridge IGCSE" } });
  await prisma.class.create({ data: { name: "Diploma in Business — Year 1", curriculum: "DIPLOMA", levelName: "Diploma" } });

  const subject = await prisma.subject.create({ data: { name: "Mathematics", code: "MATH7" } });
  const course = await prisma.course.create({ data: { classId: cls.id, subjectId: subject.id, teacherId: teacher.id } });

  const studentUser = await prisma.user.create({
    data: { email: "faith@ibwise.example", passwordHash: password, role: "STUDENT", firstName: "Faith", lastName: "Njeri" },
  });
  const student = await prisma.student.create({ data: { userId: studentUser.id, admissionNo: "IB-000001", classId: cls.id } });
  await prisma.enrollment.create({ data: { studentId: student.id, courseId: course.id } });

  const category = await prisma.blogCategory.create({ data: { name: "School News", slug: "school-news" } });
  await prisma.blogPost.create({
    data: {
      title: "Welcome to the new term",
      slug: "welcome-to-the-new-term",
      authorId: admin.id,
      categoryId: category.id,
      body: "Term 2 begins Monday — here's what's new on the portal.",
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  const feeStructure = await prisma.feeStructure.create({
    data: { classId: cls.id, term: "Term 2 2026", amount: 15000, dueDate: new Date("2026-09-01") },
  });
  await prisma.invoice.create({
    data: { studentId: student.id, feeStructureId: feeStructure.id, amount: 15000, balance: 15000, dueDate: feeStructure.dueDate },
  });

  console.log("Seeded. Login as admin@ibwise.example / achieng@ibwise.example / faith@ibwise.example — password: Passw0rd!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => prisma.$disconnect());
