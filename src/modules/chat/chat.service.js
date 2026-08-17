const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");

const listMyConversations = (userId) =>
  prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

// Reuses an existing 1:1 conversation instead of creating a duplicate every
// time two people message each other for the first time in a session.
async function startConversation({ creatorId, participantIds, title, isGroup }) {
  const allIds = Array.from(new Set([creatorId, ...participantIds]));

  if (!isGroup && allIds.length === 2) {
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: allIds.map((id) => ({ participants: { some: { userId: id } } })),
      },
      include: { participants: true },
    });
    if (existing && existing.participants.length === 2) return existing;
  }

  return prisma.conversation.create({
    data: {
      isGroup: Boolean(isGroup),
      title,
      participants: { create: allIds.map((userId) => ({ userId })) },
    },
    include: { participants: true },
  });
}

async function assertParticipant(conversationId, userId) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new ApiError(403, "You're not part of this conversation.");
}

async function listMessages(conversationId, userId) {
  await assertParticipant(conversationId, userId);
  return prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
}

async function sendMessage({ conversationId, senderId, body }) {
  await assertParticipant(conversationId, senderId);
  return prisma.message.create({ data: { conversationId, senderId, body } });
}

module.exports = { listMyConversations, startConversation, listMessages, sendMessage };
