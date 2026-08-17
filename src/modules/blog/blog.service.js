const prisma = require("../../config/db");
const slugify = require("slugify");
const { ApiError } = require("../../utils/apiResponse");

// Public feed only ever shows PUBLISHED — draft/pending posts are invisible
// until an admin approves them (proposal §10 moderation workflow).
const listPublished = ({ category, page = 1, pageSize = 10 }) =>
  prisma.blogPost.findMany({
    where: { status: "PUBLISHED", ...(category ? { category: { slug: category } } : {}) },
    include: { author: true, category: true },
    orderBy: { publishedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

// Single published post for the public detail page — 404s a draft/pending
// post by slug so it stays invisible until approved, same rule as the feed.
async function getBySlug(slug) {
  const post = await prisma.blogPost.findUnique({ where: { slug }, include: { author: true, category: true } });
  if (!post || post.status !== "PUBLISHED") throw new ApiError(404, "Post not found.");
  return post;
}

const listCategories = () => prisma.blogCategory.findMany({ orderBy: { name: "asc" } });

async function createCategory({ name }) {
  const slug = slugify(name, { lower: true, strict: true });
  return prisma.blogCategory.upsert({ where: { slug }, update: {}, create: { name, slug } });
}

// Admin/teacher moderation queue.
const listForModeration = () =>
  prisma.blogPost.findMany({
    where: { status: { in: ["PENDING_REVIEW", "DRAFT", "REJECTED"] } },
    include: { author: true, category: true },
    orderBy: { createdAt: "desc" },
  });

async function create({ authorId, authorRole, title, body, categoryId, featuredImage, tags, submitForReview }) {
  const slug = `${slugify(title, { lower: true, strict: true })}-${Date.now().toString().slice(-5)}`;
  // Admins can publish their own posts immediately — everyone else goes
  // through the review queue (or saves a draft).
  const status = authorRole === "ADMIN" && submitForReview ? "PUBLISHED" : submitForReview ? "PENDING_REVIEW" : "DRAFT";
  return prisma.blogPost.create({
    data: {
      title, slug, body, categoryId: categoryId || null, featuredImage, tags: tags || [],
      authorId,
      status,
      ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });
}

async function setStatus(id, status) {
  const data = { status };
  if (status === "PUBLISHED") data.publishedAt = new Date();
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) throw new ApiError(404, "Post not found.");
  return prisma.blogPost.update({ where: { id }, data });
}

module.exports = { listPublished, getBySlug, listCategories, createCategory, listForModeration, create, setStatus };
