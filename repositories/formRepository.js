import Form from "../models/Form.js";

export const createForm = async (formData) => {
  const form = new Form(formData);
  return await form.save();
};

export const findFormsByOwnerId = async (ownerId) => {
  return await Form.find({ createdBy: ownerId }).sort({ createdAt: -1 });
};

export const findFormById = async (formId) => {
  return await Form.findById(formId);
};

export const saveForm = async (formDoc) => {
  return await formDoc.save();
};

export const deleteFormById = async (formId) => {
  return await Form.findByIdAndDelete(formId);
};
