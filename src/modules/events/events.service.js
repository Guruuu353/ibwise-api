const prisma = require("../../config/db");

const listUpcoming = () => prisma.event.findMany({ where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" } });

// Admin management view — every event, past and future, newest-first, paginated.
async function listAll({ page = 1, pageSize = 20 } = {}) {
  const [items, total] = await Promise.all([
    prisma.event.findMany({
      orderBy: { startsAt: "desc" },
      skip: (page - 1) * pageSize,
      take: Number(pageSize),
    }),
    prisma.event.count(),
  ]);
  return { items, total, page: Number(page), pageSize: Number(pageSize) };
}

const getById = (id) => prisma.event.findUnique({ where: { id } });
const create = (data) => prisma.event.create({ data: { ...data, startsAt: new Date(data.startsAt), endsAt: data.endsAt ? new Date(data.endsAt) : null } });
const update = (id, data) => prisma.event.update({
  where: { id },
  data: { ...data, ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}), ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}) },
});
const remove = (id) => prisma.event.delete({ where: { id } });

module.exports = { listUpcoming, listAll, getById, create, update, remove };
