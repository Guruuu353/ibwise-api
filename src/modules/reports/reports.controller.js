const asyncHandler = require("../../utils/asyncHandler");
const { ok, ApiError } = require("../../utils/apiResponse");
const service = require("./reports.service");
const { toExcelBuffer, toPdfBuffer } = require("./report.exporters");
const { logAction } = require("../../utils/audit");

const listTypes = asyncHandler(async (req, res) => ok(res, service.REPORTS));

// GET /api/reports/:type?format=json|excel|pdf&...filters
const generate = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = "json", ...params } = req.query;

  const report = await service.build(type, params);

  if (format === "json") {
    return ok(res, report);
  }

  await logAction({ userId: req.user.id, action: "report.export", entity: "Report", entityId: type, meta: { format, ...params } });

  const fileBase = `${type}-report-${new Date().toISOString().slice(0, 10)}`;

  if (format === "excel") {
    const buffer = await toExcelBuffer(report);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.xlsx"`);
    return res.send(buffer);
  }

  if (format === "pdf") {
    const buffer = await toPdfBuffer(report);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.pdf"`);
    return res.send(buffer);
  }

  throw new ApiError(400, `Unsupported format "${format}". Use json, excel, or pdf.`);
});

module.exports = { listTypes, generate };
