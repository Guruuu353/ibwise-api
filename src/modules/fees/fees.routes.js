const router = require("express").Router();
const controller = require("./fees.controller");
const { authenticate, requireRole } = require("../../middleware/auth.middleware");

// Safaricom calls this directly — must stay unauthenticated and before the
// authenticate() gate below.
router.post("/mpesa/callback", controller.mpesaCallback);
router.get("/structures/public", controller.publicStructures);

router.use(authenticate);

router.post("/structures", requireRole("ADMIN"), controller.createStructure);
router.post("/structures/:feeStructureId/generate-invoices", requireRole("ADMIN"), controller.generateInvoices);
router.get("/invoices/mine", requireRole("STUDENT"), controller.myInvoices);
router.get("/invoices", requireRole("ADMIN"), controller.allInvoices);
router.post("/pay", requireRole("STUDENT"), controller.pay);

module.exports = router;
