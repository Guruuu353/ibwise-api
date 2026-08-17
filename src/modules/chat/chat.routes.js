const router = require("express").Router();
const controller = require("./chat.controller");
const { authenticate } = require("../../middleware/auth.middleware");

// Plain REST, polled from the frontend — see backend/README.md for the
// Socket.io upgrade path when real-time delivery is worth the added infra.
router.use(authenticate);

router.get("/conversations", controller.myConversations);
router.post("/conversations", controller.startConversation);
router.get("/conversations/:id/messages", controller.listMessages);
router.post("/conversations/:id/messages", controller.sendMessage);

module.exports = router;
