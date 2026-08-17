const prisma = require("../../config/db");

const list = () => prisma.media.findMany({ include: { uploadedBy: true }, orderBy: { createdAt: "desc" }, take: 100 });

const record = ({ file, uploadedById }) =>
  prisma.media.create({
    data: {
      url: `/uploads/${file.filename}`,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedById,
    },
  });

const remove = (id) => prisma.media.delete({ where: { id } });

module.exports = { list, record, remove };
