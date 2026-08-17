const prisma = require("../../config/db");

const create = (data) => prisma.inquiry.create({ data });
const list = () => prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
const markResponded = (id) => prisma.inquiry.update({ where: { id }, data: { status: "RESPONDED" } });

module.exports = { create, list, markResponded };
