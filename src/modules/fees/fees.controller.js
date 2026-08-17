const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");
const service = require("./fees.service");
const { logAction } = require("../../utils/audit");

module.exports = {
  publicStructures: asyncHandler(async (req, res) => ok(res, await service.listStructuresPublic())),

  createStructure: asyncHandler(async (req, res) => created(res, await service.createFeeStructure(req.body))),

  generateInvoices: asyncHandler(async (req, res) => {
    const invoices = await service.generateInvoices(req.params.feeStructureId);
    await logAction({ userId: req.user.id, action: "fees.generate_invoices", entity: "FeeStructure", entityId: req.params.feeStructureId, meta: { count: invoices.length } });
    return created(res, invoices);
  }),

  myInvoices: asyncHandler(async (req, res) => ok(res, await service.listForStudent(req.user.student.id))),

  allInvoices: asyncHandler(async (req, res) => ok(res, await service.listAll())),

  pay: asyncHandler(async (req, res) => {
    const callbackUrl = `${req.protocol}://${req.get("host")}/api/fees/mpesa/callback`;
    const result = await service.payInvoice({
      studentId: req.user.student.id,
      invoiceId: req.body.invoiceId,
      phone: req.body.phone,
      amount: req.body.amount,
      callbackUrl,
    });
    await logAction({ userId: req.user.id, action: "fees.pay_initiated", entity: "Payment", entityId: result.payment.id });
    return ok(res, result);
  }),

  // Public-facing (Safaricom calls this, not a logged-in user) — no auth middleware on this route.
  mpesaCallback: asyncHandler(async (req, res) => {
    await service.handleMpesaCallback(req.body);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" }); // Daraja expects this exact ack shape
  }),
};
