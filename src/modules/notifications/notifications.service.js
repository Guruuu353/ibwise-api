const prisma = require("../../config/db");

const listForUser = (userId) =>
  prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });

const markRead = (id, userId) =>
  prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });

const markAllRead = (userId) =>
  prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });

module.exports = { listForUser, markRead, markAllRead };
