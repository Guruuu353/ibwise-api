const prisma = require("../../config/db");
const { ApiError } = require("../../utils/apiResponse");
const mpesa = require("./mpesa.client");

async function createFeeStructure({ classId, term, amount, dueDate }) {
  return prisma.feeStructure.create({ data: { classId, term, amount, dueDate: new Date(dueDate) } });
}

// Generates one invoice per currently-enrolled student in the class —
// run this once per term after setting the FeeStructure.
async function generateInvoices(feeStructureId) {
  const fs = await prisma.feeStructure.findUnique({ where: { id: feeStructureId }, include: { class: true } });
  if (!fs) throw new ApiError(404, "Fee structure not found.");

  const students = await prisma.student.findMany({ where: { classId: fs.classId } });
  const invoices = await prisma.$transaction(
    students.map((s) =>
      prisma.invoice.upsert({
        where: { studentId_feeStructureId: { studentId: s.id, feeStructureId } },
        update: {},
        create: { studentId: s.id, feeStructureId, amount: fs.amount, balance: fs.amount, dueDate: fs.dueDate },
      })
    )
  );
  return invoices;
}

// Public — the admissions page shows indicative fees per track/class
// without requiring a login.
const listStructuresPublic = () =>
  prisma.feeStructure.findMany({ include: { class: true }, orderBy: { class: { curriculum: "asc" } } });

const listForStudent = (studentId) =>
  prisma.invoice.findMany({
    where: { studentId },
    include: { feeStructure: { include: { class: true } }, payments: true },
    orderBy: { dueDate: "desc" },
  });

const listAll = () =>
  prisma.invoice.findMany({
    include: { student: { include: { user: true } }, feeStructure: { include: { class: true } } },
    orderBy: { createdAt: "desc" },
  });

// Kicks off an M-Pesa STK push for an invoice. Real money only moves once
// MPESA_* env vars are set (see mpesa.client.js) — otherwise this records a
// clearly-flagged simulated payment so the fees UI is fully testable.
async function payInvoice({ studentId, invoiceId, phone, amount, callbackUrl }) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new ApiError(404, "Invoice not found.");
  if (invoice.studentId !== studentId) throw new ApiError(403, "Not your invoice.");
  if (amount > invoice.balance) throw new ApiError(422, `Amount exceeds outstanding balance of ${invoice.balance}.`);

  const push = await mpesa.initiateStkPush({
    phone, amount, accountReference: invoiceId, callbackUrl,
  });

  const payment = await prisma.payment.create({
    data: {
      invoiceId, studentId, amount, phone,
      mpesaCheckoutRequestId: push.checkoutRequestId,
      status: push.simulated ? "COMPLETED" : "PENDING", // simulated push "completes" immediately for demo purposes
      completedAt: push.simulated ? new Date() : null,
    },
  });

  if (push.simulated) {
    await applyPayment(payment.id);
  }

  return { payment, simulated: push.simulated, message: push.message };
}

// Called either immediately (simulate mode) or from the Daraja callback
// route once Safaricom confirms the transaction.
async function applyPayment(paymentId, mpesaReceiptNumber) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "COMPLETED", completedAt: new Date(), ...(mpesaReceiptNumber ? { mpesaReceiptNumber } : {}) },
    });
    const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
    const newBalance = Math.max(0, invoice.balance - payment.amount);
    await tx.invoice.update({
      where: { id: invoice.id },
      data: { balance: newBalance, status: newBalance === 0 ? "PAID" : "PARTIAL" },
    });
    return payment;
  });
}

async function handleMpesaCallback(body) {
  // Daraja's actual callback shape — see Safaricom docs for the full
  // stkCallback envelope. ResultCode 0 = success.
  const stk = body?.Body?.stkCallback;
  if (!stk) return;
  const checkoutRequestId = stk.CheckoutRequestID;
  const payment = await prisma.payment.findUnique({ where: { mpesaCheckoutRequestId: checkoutRequestId } });
  if (!payment) return;

  if (stk.ResultCode === 0) {
    const receipt = stk.CallbackMetadata?.Item?.find((i) => i.Name === "MpesaReceiptNumber")?.Value;
    await applyPayment(payment.id, receipt);
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }
}

module.exports = { createFeeStructure, generateInvoices, listForStudent, listAll, payInvoice, handleMpesaCallback, listStructuresPublic };
