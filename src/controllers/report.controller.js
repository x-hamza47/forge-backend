import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { buildReportData, toCsv } from "../services/report.service.js";
import { buildPdf } from "../utils/pdfBuilder.js";

export const downloadReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = "csv", from, to } = req.query;

  const data = await buildReportData(req.user._id, type, { from, to });
  if (!data) {
    throw new ApiError(400, "Invalid report type");
  }

  const dateTag = from && to ? `${from}_to_${to}` : new Date().toISOString().slice(0, 10);
  const filename = `forge_${type}_${dateTag}`;

  if (format === "pdf") {
    const pdfBuffer = await buildPdf({
      title: data.title,
      userName: req.user.name,
      dateRange: from || to ? `${from || "Start"} to ${to || "Today"}` : "Last 90 days",
      headers: data.headers,
      rows: data.rows,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
    return res.send(pdfBuffer);
  }

  const csv = toCsv(data.headers, data.rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  return res.send(csv);
});
