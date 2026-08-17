const prisma = require("../../config/db");

// Fan-out a lightweight Notification to every user in the target audience
// so each dashboard's bell icon has something real to show (proposal §15).
async function create({ authorId, title, body, audience }) {
  const announcement = await prisma.announcement.create({ data: { title, body, audience, authorId } });

  const where = audience === "ALL" ? {} : { role: audience };
  const recipients = await prisma.user.findMany({ where, select: { id: true } });
  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((r) => ({ userId: r.id, type: "ANNOUNCEMENT", title, body })),
    });
  }
  return announcement;
}

const listForRole = (role) =>
  prisma.announcement.findMany({
    where: { OR: [{ audience: "ALL" }, { audience: role }] },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

// Admin management view — every announcement regardless of audience.
const listAll = () => prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

module.exports = { create, listForRole, listAll };
