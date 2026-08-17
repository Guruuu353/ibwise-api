const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

const list = () =>
  prisma.class.findMany({
    include: {
      homeroomTeacher: { include: { user: true } },
      _count: { select: { students: true } },
    },
    orderBy: { name: "asc" },
  });

const getById = async (id) => {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      students: { include: { user: true } },
      courses: { include: { subject: true, teacher: { include: { user: true } } } },
    },
  });
  if (!cls) throw new ApiError(404, "Class not found.");
  return cls;
};

const create = (data) => prisma.class.create({ data });
const update = (id, data) => prisma.class.update({ where: { id }, data });
const remove = (id) => prisma.class.delete({ where: { id } });

module.exports = { list, getById, create, update, remove };
