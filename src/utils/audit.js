const prisma = require("../config/db");

// Fire-and-forget audit trail (proposal §13: "basic audit logging").
// Never throws into the request path — a logging failure shouldn't fail the request.
async function logAction({ userId, action, entity, entityId, meta }) {
  try {
    await prisma.auditLog.create({ data: { userId, action, entity, entityId, meta } });
  } catch (err) {
    console.error("[audit] failed to record action:", action, err.message);
  }
}

module.exports = { logAction };
