import { instantiateDraftForm, getUserForms, getSingleFormDetails, updateFormConfiguration, cascadeDeleteForm } from "../services/formService.js";

export const createForm = async (req, res) => {
  try {
    const savedForm = await instantiateDraftForm(req.user._id);
    return res.status(201).json({
      success: true,
      message: "Empty draft form instantiated successfully",
      form: savedForm
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during form instantiation",
      error: error.message
    });
  }
};

export const getForms = async (req, res) => {
  try {
    const forms = await getUserForms(req.user._id);
    return res.status(200).json({
      success: true,
      count: forms.length,
      forms
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during forms retrieval",
      error: error.message
    });
  }
};

export const getSingleForm = async (req, res) => {
  try {
    const form = await getSingleFormDetails(req.params.id, req.user, req.headers.authorization);
    return res.status(200).json({
      success: true,
      form
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Form ID format" });
    }
    if (error.message.startsWith("Access Denied:")) {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === "Form not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Server error during form retrieval",
      error: error.message
    });
  }
};

export const updateForm = async (req, res) => {
  try {
    const updatedForm = await updateFormConfiguration(req.params.id, req.user._id, req.body);
    return res.status(200).json({
      success: true,
      message: "Form configuration saved successfully",
      form: updatedForm
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
      message: "Server error during form update",
      error: error.message
    });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const deletedCount = await cascadeDeleteForm(req.params.id, req.user._id);
    return res.status(200).json({
      success: true,
      message: "Form and all its associated responses deleted successfully",
      deletedResponsesCount: deletedCount
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
      message: "Server error during form deletion",
      error: error.message
    });
  }
};
