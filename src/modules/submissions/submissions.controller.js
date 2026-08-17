const asyncHandler = require("../../utils/asyncHandler");
const { ok } = require("../../utils/apiResponse");
const service = require("./submissions.service");
const { logAction } = require("../../utils/audit");

const submit = asyncHandler(async (req, res) => {
  const submission = await service.submit({
    studentId: req.user.student.id,
    assignmentId: req.body.assignmentId,
    content: req.body.content,
    files: req.files || [],
  });
  await logAction({ userId: req.user.id, action: "submission.submit", entity: "Submission", entityId: submission.id });
  return ok(res, submission);
});

const listForAssignment = asyncHandler(async (req, res) => ok(res, await service.listForAssignment(req.params.assignmentId)));

const markReviewed = asyncHandler(async (req, res) => {
  const submission = await service.markReviewed(req.params.id, req.user.teacher.id);
  return ok(res, submission);
});

const listAll = asyncHandler(async (req, res) => ok(res, await service.listAll()));

module.exports = { submit, listForAssignment, markReviewed, listAll };
