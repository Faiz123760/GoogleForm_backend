import { createForm as createFormRepo, findFormsByOwnerId, findFormById, saveForm, deleteFormById } from "../repositories/formRepository.js";
import { deleteResponsesByFormId } from "../repositories/responseRepository.js";
import jwt from "jsonwebtoken";

export const instantiateDraftForm = async (userId) => {
  const formData = {
    title: "Untitled Form",
    description: "Form description",
    createdBy: userId,
    fields: [],
    published: false,
    settings: {
      limitTo1Response: false,
      collectEmail: false,
      passwordProtected: false
    },
    theme: {
      primaryColor: "#1a73e8",
      backgroundColor: "#f0f3f9",
      textColor: "#202124",
      fontFamily: "Roboto"
    }
  };

  return await createFormRepo(formData);
};

export const getUserForms = async (userId) => {
  return await findFormsByOwnerId(userId);
};

export const getSingleFormDetails = async (formId, reqUser, authHeader) => {
  const form = await findFormById(formId);
  if (!form) {
    throw new Error("Form not found");
  }

  // Determine ownership
  let isOwner = false;

  // 1. Check if route middleware already parsed the user (Protected route scenario)
  if (reqUser && reqUser._id.toString() === form.createdBy.toString()) {
    isOwner = true;
  } else {
    // 2. Perform optional token check manually (Public route scenario)
    if (authHeader && authHeader.startsWith("Bearer")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.id === form.createdBy.toString()) {
          isOwner = true;
        }
      } catch (err) {
        // Token is invalid/expired
      }
    }
  }

  // Access control check
  if (!form.published && !isOwner) {
    throw new Error("Access Denied: This form is a draft and can only be accessed by its creator.");
  }

  // Increment views only for respondents (non-owners)
  if (!isOwner) {
    form.views = (form.views || 0) + 1;
    await saveForm(form);
  }

  return form;
};

export const updateFormConfiguration = async (formId, userId, updateData) => {
  const form = await findFormById(formId);
  if (!form) {
    throw new Error("Form not found");
  }

  // Authorization
  if (form.createdBy.toString() !== userId.toString()) {
    throw new Error("Forbidden: You are not authorized to update this form");
  }

  const { title, description, fields, settings, published, theme } = updateData;

  // Apply updates gracefully
  if (title !== undefined) form.title = title;
  if (description !== undefined) form.description = description;
  if (fields !== undefined) form.fields = fields;
  if (published !== undefined) form.published = published;

  // Deep merge settings object
  if (settings !== undefined) {
    form.settings = {
      ...form.settings,
      ...settings
    };
  }

  // Deep merge theme configurations
  if (theme !== undefined) {
    form.theme = {
      ...form.theme,
      ...theme
    };
  }

  return await saveForm(form);
};

export const cascadeDeleteForm = async (formId, userId) => {
  const form = await findFormById(formId);
  if (!form) {
    throw new Error("Form not found");
  }

  // Authorization
  if (form.createdBy.toString() !== userId.toString()) {
    throw new Error("Forbidden: You are not authorized to delete this form");
  }

  // Cascade delete
  const responseDeletion = await deleteResponsesByFormId(form._id);
  await deleteFormById(form._id);

  return responseDeletion.deletedCount;
};
