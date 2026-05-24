import Response from "../models/Response.js";

export const createResponse = async (responseData) => {
  const response = new Response(responseData);
  return await response.save();
};

export const findResponseByFormAndUser = async (formId, userId) => {
  return await Response.findOne({ formId, submittedBy: userId });
};

export const findResponseByFormAndIp = async (formId, ipAddress) => {
  return await Response.findOne({ formId, "metadata.ipAddress": ipAddress });
};

export const findResponsesByFormId = async (formId) => {
  return await Response.find({ formId })
    .populate("submittedBy", "name email")
    .sort({ createdAt: -1 });
};

export const deleteResponsesByFormId = async (formId) => {
  return await Response.deleteMany({ formId });
};

export const countResponsesByFormId = async (formId) => {
  return await Response.countDocuments({ formId });
};

export const aggregateResponses = async (pipeline) => {
  return await Response.aggregate(pipeline);
};
