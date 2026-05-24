import { findFormById } from "../repositories/formRepository.js";
import { createResponse, findResponseByFormAndUser, findResponseByFormAndIp, findResponsesByFormId } from "../repositories/responseRepository.js";
import { findById as findUserById } from "../repositories/userRepository.js";
import bcrypt from "bcryptjs";
import { parseUserAgent } from "../utils/uaParser.js";
import { sendNotificationEmail, buildRespondentReceiptHTML, buildOwnerAlertHTML } from "./emailService.js";

export const submitFormResponse = async (formId, submitterId, reqData, ipAddress, userAgent) => {
  const { answers, password, submissionDuration, respondentEmail: reqEmail, sendCopy } = reqData;

  // 1. Fetch Form
  const form = await findFormById(formId);
  if (!form) {
    throw new Error("Form not found");
  }

  // 2. Access Control Validation
  if (!form.published) {
    throw new Error("Forbidden: This form is currently in draft mode and cannot accept submissions.");
  }

  // 3. Expiry Check
  if (form.settings?.expiryDate && new Date(form.settings.expiryDate) < new Date()) {
    throw new Error("This form has expired and is no longer accepting responses.");
  }

  // 4. Password Protection Check
  if (form.settings?.passwordProtected) {
    if (!password) {
      throw new Error("This form is password protected. Password is required to submit responses.");
    }
    let isPasswordCorrect = false;
    try {
      isPasswordCorrect = await bcrypt.compare(password, form.settings.passwordHash);
    } catch (err) {
      isPasswordCorrect = password === form.settings.passwordHash;
    }
    if (!isPasswordCorrect) {
      throw new Error("Invalid form password.");
    }
  }

  const { browser, os, device } = parseUserAgent(userAgent);

  // 5. Limit To 1 Response Check
  if (form.settings?.limitTo1Response) {
    if (submitterId) {
      const existingUserResponse = await findResponseByFormAndUser(form._id, submitterId);
      if (existingUserResponse) throw new Error("You have already submitted a response to this form.");
    }
    const existingIpResponse = await findResponseByFormAndIp(form._id, ipAddress);
    if (existingIpResponse) throw new Error("A submission has already been recorded from your IP address.");
  }

  // 6. Validate answers and grade if quiz
  const validatedAnswers = [];
  const clientAnswers = answers || [];
  let totalScore = 0;

  for (const field of form.fields) {
    const clientAnswer = clientAnswers.find(a => a.fieldId === field.id);
    const value = clientAnswer ? clientAnswer.value : undefined;

    const isValueEmpty = value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (field.required && isValueEmpty) {
      throw new Error(`Validation Error: Field "${field.label || field.id}" is required.`);
    }

    if (!isValueEmpty && field.options && field.options.length > 0) {
      if (field.type === "checkboxes") {
        if (!Array.isArray(value)) throw new Error(`Validation Error: Field "${field.label || field.id}" must receive an array of selections.`);
        const invalidSelections = value.filter(val => !field.options.includes(val));
        if (invalidSelections.length > 0) throw new Error(`Validation Error: Selection "${invalidSelections.join(", ")}" is not a valid option for "${field.label || field.id}".`);
      } else if (field.type === "multiple_choice" || field.type === "dropdown") {
        if (!field.options.includes(value)) throw new Error(`Validation Error: Option "${value}" is not a valid choice for "${field.label || field.id}".`);
      }
    }

    if (!isValueEmpty) {
      let isCorrect = false;
      let scoreReceived = 0;

      // Grade if it's a quiz
      if (form.settings?.isQuiz && field.correctAnswer !== undefined) {
        if (field.type === "multiple_choice" || field.type === "dropdown" || field.type === "short_answer") {
          if (String(value).trim().toLowerCase() === String(field.correctAnswer).trim().toLowerCase()) {
            isCorrect = true;
          }
        } else if (field.type === "checkboxes") {
          // Check arrays for exact match
          const correctArr = Array.isArray(field.correctAnswer) ? field.correctAnswer : [field.correctAnswer];
          const valArr = Array.isArray(value) ? value : [value];
          if (correctArr.length === valArr.length && correctArr.every(v => valArr.includes(v))) {
            isCorrect = true;
          }
        }

        if (isCorrect) {
          scoreReceived = field.points || 0;
          totalScore += scoreReceived;
        }
      }

      validatedAnswers.push({ fieldId: field.id, value, isCorrect, scoreReceived });
    }
  }

  // 7. Create Response
  const savedResponse = await createResponse({
    formId: form._id,
    submittedBy: submitterId || null,
    answers: validatedAnswers,
    totalScore,
    metadata: {
      ipAddress,
      userAgent,
      browser,
      device,
      os,
      submissionDuration: submissionDuration || 0
    }
  });

  // Async notifications
  (async () => {
    console.log("[EMAIL DISPATCH] Starting async notification flow...");
    try {
      const owner = await findUserById(form.createdBy);
      if (owner && owner.email) {
        console.log(`[EMAIL DISPATCH] Alerting owner: ${owner.email}`);
        const ownerHtml = buildOwnerAlertHTML(form.title || "Untitled Form", savedResponse._id, savedResponse.metadata);
        await sendNotificationEmail(owner.email, `New Response Alert: ${form.title || "Untitled Form"}`, ownerHtml);
      } else {
        console.log("[EMAIL DISPATCH] No owner email found.");
      }

      let targetEmail = reqEmail || null;
      if (!targetEmail && form.settings?.collectEmail) {
        if (submitterId) {
          const submitter = await findUserById(submitterId);
          if (submitter) targetEmail = submitter.email;
        } else {
          const emailField = form.fields.find(f => f.type === "email");
          if (emailField) {
            const emailAnswer = validatedAnswers.find(a => a.fieldId === emailField.id);
            if (emailAnswer && emailAnswer.value) targetEmail = String(emailAnswer.value);
          }
        }
      }

      if (targetEmail) {
        console.log(`[EMAIL DISPATCH] Sending confirmation to respondent: ${targetEmail}, sendCopy=${sendCopy}`);
        let emailHtml = `
          <div style="font-family: sans-serif; color: #202124;">
            <h2 style="color: #1a73e8;">Thank you for your submission!</h2>
            <p>Your response to <strong>${form.title || "Untitled Form"}</strong> has been successfully recorded.</p>
          </div>
        `;
        
        if (sendCopy) {
          emailHtml += `<br><hr><br>` + buildRespondentReceiptHTML(form.title || "Untitled Form", validatedAnswers);
        }
        
        await sendNotificationEmail(targetEmail, `Submission Confirmation: ${form.title || "Untitled Form"}`, emailHtml);
      } else {
        console.log("[EMAIL DISPATCH] No targetEmail resolved for respondent.");
      }
    } catch (err) {
      console.error("[EMAIL DISPATCH ERROR]:", err.message);
    }
  })();

  return savedResponse;
};

export const getFormResponses = async (formId, userId) => {
  const form = await findFormById(formId);
  if (!form) throw new Error("Form not found");

  if (form.createdBy.toString() !== userId.toString()) {
    throw new Error("Forbidden: You are not authorized to view responses for this form.");
  }

  const responses = await findResponsesByFormId(form._id);
  
  return {
    count: responses.length,
    fields: form.fields.map(f => ({ id: f.id, label: f.label, type: f.type })),
    responses
  };
};

export const exportFormResponsesCsv = async (formId, userId) => {
  const form = await findFormById(formId);
  if (!form) throw new Error("Form not found");

  if (form.createdBy.toString() !== userId.toString()) {
    throw new Error("Forbidden: You are not authorized to export responses for this form.");
  }

  const responses = await findResponsesByFormId(form._id);

  const headers = [
    "Response ID", "Timestamp", "Submitted By (Name)", "Submitted By (Email)",
    "IP Address", "Browser", "Device Type", "OS", "Duration (Seconds)"
  ];
  form.fields.forEach(field => headers.push(field.label || field.id));

  const cleanCSV = (str) => {
    if (str === undefined || str === null) return "";
    return `"${String(str).replace(/"/g, '""')}"`;
  };

  let csvContent = headers.map(cleanCSV).join(",") + "\r\n";

  responses.forEach(resp => {
    const row = [
      resp._id.toString(),
      resp.createdAt.toISOString(),
      resp.submittedBy ? resp.submittedBy.name : "Anonymous",
      resp.submittedBy ? resp.submittedBy.email : "Anonymous",
      resp.metadata?.ipAddress || "Unknown",
      resp.metadata?.browser || "Unknown",
      resp.metadata?.device || "Unknown",
      resp.metadata?.os || "Unknown",
      resp.metadata?.submissionDuration || 0
    ];

    form.fields.forEach(field => {
      const answer = resp.answers.find(a => a.fieldId === field.id);
      let valueStr = "";
      if (answer && answer.value !== undefined && answer.value !== null) {
        valueStr = Array.isArray(answer.value) ? answer.value.join("; ") : String(answer.value);
      }
      row.push(valueStr);
    });

    csvContent += row.map(cleanCSV).join(",") + "\r\n";
  });

  const sanitizedTitle = (form.title || "untitled-form").toLowerCase().replace(/[^a-z0-9]/gi, "-");
  return { csvContent, sanitizedTitle };
};
