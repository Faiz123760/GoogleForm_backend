import { submitFormResponse, getFormResponses, exportFormResponsesCsv } from "../services/responseService.js";

export const submitResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || "127.0.0.1";
    const userAgent = req.headers['user-agent'] || "";
    const submitterId = req.user ? req.user._id : null;

    const savedResponse = await submitFormResponse(formId, submitterId, req.body, ipAddress, userAgent);

    return res.status(201).json({
      success: true,
      message: "Form response submitted successfully",
      response: savedResponse
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Form ID format" });
    }
    if (error.message === "Form not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Forbidden:")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Validation Error:") || error.message.includes("expired") || error.message.includes("already submitted") || error.message.includes("recorded from your IP")) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error.message.includes("password")) {
      return res.status(401).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during response submission",
      error: error.message
    });
  }
};

export const getResponses = async (req, res) => {
  try {
    const data = await getFormResponses(req.params.formId, req.user._id);
    return res.status(200).json({
      success: true,
      ...data
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Form ID format" });
    }
    if (error.message === "Form not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Forbidden:")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during submissions retrieval",
      error: error.message
    });
  }
};

export const exportResponses = async (req, res) => {
  try {
    const { csvContent, sanitizedTitle } = await exportFormResponsesCsv(req.params.formId, req.user._id);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=responses-${sanitizedTitle}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Form ID format" });
    }
    if (error.message === "Form not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.startsWith("Forbidden:")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during responses export",
      error: error.message
    });
  }
};
