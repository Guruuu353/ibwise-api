const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./chat.service");

module.exports = {
  myConversations: asyncHandler(async (req, res) => ok(res, await service.listMyConversations(req.user.id))),

  startConversation: asyncHandler(async (req, res) => {
    const convo = await service.startConversation({ creatorId: req.user.id, ...req.body });
    return created(res, convo);
  }),

  listMessages: asyncHandler(async (req, res) => ok(res, await service.listMessages(req.params.id, req.user.id))),

  sendMessage: asyncHandler(async (req, res) => {
    const message = await service.sendMessage({ conversationId: req.params.id, senderId: req.user.id, body: req.body.body });
    return created(res, message);
  }),
};
