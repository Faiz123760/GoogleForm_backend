import nodemailer from "nodemailer";

// Transporter will be initialized lazily
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const isEmailConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (isEmailConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === "true", // true for port 465, false for 587/25
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    console.log("SMTP mail server transporter initialized.");
  } else {
    console.log("SMTP settings not fully configured in .env. Falling back to log-based email simulation.");
  }
  return transporter;
};

/**
 * Sends a standard HTML notification email, with console simulation backup for developer friendliness.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject line
 * @param {string} html - Dynamic HTML content
 * @returns {Promise<boolean>} Resolves to true if simulated or successfully sent via SMTP
 */
export const sendNotificationEmail = async (to, subject, html) => {
  try {
    const currentTransporter = getTransporter();
    if (currentTransporter) {
      const fromEmail = process.env.SMTP_FROM || "noreply@googleformsclone.com";
      const fromName = process.env.SMTP_FROM_NAME || "Form Builder Studio";
      
      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html
      });
      return true;
    }

    // Developer Fallback: Beautiful Log Output
    console.log(`
┌────────────────────────────────────────────────────────┐
│               SIMULATED EMAIL DISPATCH                 │
├────────────────────────────────────────────────────────┤
│ TO:      ${to.padEnd(46)} │
│ SUBJECT: ${subject.padEnd(46)} │
├────────────────────────────────────────────────────────┤
│ BODY:                                                  │
│ ${html.replace(/\n/g, "\n│ ")}
└────────────────────────────────────────────────────────┘
    `);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    return false;
  }
};

/**
 * Helper to build dynamic HTML receipt for respondents
 */
export const buildRespondentReceiptHTML = (formTitle, answers) => {
  const answerRows = answers
    .map(ans => `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 10px; font-weight: bold; color: #333;">Field ID: ${ans.fieldId}</td>
        <td style="padding: 10px; color: #666;">${Array.isArray(ans.value) ? ans.value.join(", ") : ans.value}</td>
      </tr>
    `)
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d4d4d4; border-radius: 8px;">
      <h2 style="color: #1a73e8; border-bottom: 2px solid #1a73e8; padding-bottom: 10px;">${formTitle}</h2>
      <p style="color: #5f6368;">Thank you for your submission! Here is a copy of your response receipt:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f1f3f4; text-align: left;">
            <th style="padding: 10px;">Question</th>
            <th style="padding: 10px;">Your Answer</th>
          </tr>
        </thead>
        <tbody>
          ${answerRows}
        </tbody>
      </table>
      <div style="margin-top: 25px; font-size: 11px; color: #999; text-align: center;">
        This is an automated email notification from your Form Builder application.
      </div>
    </div>
  `;
};

/**
 * Helper to build dynamic owner notification alert HTML
 */
export const buildOwnerAlertHTML = (formTitle, responseId, metadata) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d4d4d4; border-radius: 8px;">
      <h2 style="color: #e28743; border-bottom: 2px solid #e28743; padding-bottom: 10px;">New Form Submission!</h2>
      <p style="color: #5f6368;">Your form <strong>"${formTitle}"</strong> received a new response.</p>
      
      <div style="background-color: #fdf6e2; padding: 15px; border-radius: 4px; margin-top: 15px;">
        <h4 style="margin-top: 0; color: #b58900;">Submission Details:</h4>
        <ul style="list-style: none; padding-left: 0; margin-bottom: 0;">
          <li><strong>Response ID:</strong> ${responseId}</li>
          <li><strong>IP Address:</strong> ${metadata.ipAddress || "Unknown"}</li>
          <li><strong>Device Type:</strong> ${metadata.device || "Unknown"}</li>
          <li><strong>Browser:</strong> ${metadata.browser || "Unknown"} (on ${metadata.os || "Unknown"})</li>
        </ul>
      </div>

      <p style="margin-top: 20px; font-size: 13px; color: #5f6368;">
        Log in to your form creator dashboard to view all answers and export them to CSV.
      </p>
    </div>
  `;
};
