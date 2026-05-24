import { generateFormAnalytics } from "../services/analyticsService.js";

export const getFormAnalytics = async (req, res) => {
  try {
    const analytics = await generateFormAnalytics(req.params.formId, req.user._id);

    return res.status(200).json({
      success: true,
      analytics
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
      message: "Server error during analytics retrieval",
      error: error.message
    });
  }
};
