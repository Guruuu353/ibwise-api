const prisma = require("../../config/db");
const { hashPassword, comparePassword } = require("../../utils/hash");
const { signToken } = require("../../utils/jwt");
const { ApiError } = require("../../utils/apiResponse");
const { logAction } = require("../../utils/audit");

// Registration is deliberately admin-gated for TEACHER/STUDENT/PARENT in
// production (an admin creates staff/student accounts) — but self-registration
// is left open here behind the role check so the flow is easy to demo and to
// restrict later with a single guard in auth.routes.js.
async function register({ email, password, firstName, lastName, role, phone }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { email, passwordHash, firstName, lastName, role, phone },
    });

    // Create the matching role profile row so the rest of the app can
    // always join User -> Student/Teacher/Parent without null-checking.
    if (role === "STUDENT") {
      await tx.student.create({
        data: { userId: created.id, admissionNo: `IB-${Date.now().toString().slice(-6)}` },
      });
    } else if (role === "TEACHER") {
      // Self-registered teachers start unapproved (Teacher.isApproved: false)
      // — an admin must approve them (see users.service.js `approveTeacher`)
      // before they're treated as active staff. Admin-created teachers skip
      // this via users.service.js `create`, which sets isApproved: true.
      await tx.teacher.create({
        data: { userId: created.id, staffNo: `T-${Date.now().toString().slice(-6)}`, isApproved: false },
      });
    } else if (role === "PARENT") {
      await tx.parent.create({ data: { userId: created.id } });
    }

    return created;
  });

  await logAction({ userId: user.id, action: "auth.register", entity: "User", entityId: user.id });

  return sanitizeUser(user);
}

async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email }, include: { teacher: true } });
  if (!user || !user.isActive) throw new ApiError(401, "Invalid email or password.");

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password.");

  if (user.role === "TEACHER" && user.teacher && !user.teacher.isApproved) {
    throw new ApiError(403, "Your teacher account is awaiting admin approval.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await logAction({ userId: user.id, action: "auth.login", entity: "User", entityId: user.id });

  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

// Stubbed: wire up an email provider (e.g. Resend, SES) and a PasswordReset
// token table when that's actually needed — kept out of Phase 1 scope but
// the route/service seam is here so it's a small add later, not a rewrite.
async function forgotPassword({ email }) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond the same way whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts.
  if (user) {
    await logAction({ userId: user.id, action: "auth.forgot_password_requested", entity: "User", entityId: user.id });
  }
  return { message: "If that email is registered, a reset link has been sent." };
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// Self-service profile update — deliberately narrow (name/phone/bio only,
// no email/role/isActive) so a user can't escalate their own account through
// this endpoint; that stays admin-only via the users module.
async function updateOwnProfile(userId, { firstName, lastName, phone, bio }) {
  const user = await prisma.user.update({ where: { id: userId }, data: { firstName, lastName, phone } });
  if (bio !== undefined) {
    const teacher = await prisma.teacher.findUnique({ where: { userId } });
    if (teacher) await prisma.teacher.update({ where: { userId }, data: { bio } });
  }
  return sanitizeUser(user);
}

module.exports = { register, login, forgotPassword, sanitizeUser, updateOwnProfile };
