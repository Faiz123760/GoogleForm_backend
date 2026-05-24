import { findFormById } from "../repositories/formRepository.js";
import { findResponsesByFormId } from "../repositories/responseRepository.js";

export const generateFormAnalytics = async (formId, userId) => {
  // 1. Fetch Form
  const form = await findFormById(formId);
  if (!form) {
    throw new Error("Form not found");
  }

  // 2. Authorization Check
  if (form.createdBy.toString() !== userId.toString()) {
    throw new Error("Forbidden: You are not authorized to view analytics for this form.");
  }

  // 3. Fetch all submissions
  const responses = await findResponsesByFormId(form._id);
  const totalSubmissions = responses.length;
  const totalViews = form.views || 0;

  // 4. Calculate Completion Rate
  const completionRate = totalViews > 0 ? Math.round((totalSubmissions / totalViews) * 100) : 0;

  // 5. Aggregate answer selections
  const questionInsights = [];
  
  form.fields.forEach(field => {
    if (["multiple_choice", "checkboxes", "dropdown"].includes(field.type)) {
      const counts = {};
      
      if (field.options && field.options.length > 0) {
        field.options.forEach(opt => counts[opt] = 0);
      }

      responses.forEach(resp => {
        const answer = resp.answers.find(a => a.fieldId === field.id);
        if (answer && answer.value !== undefined && answer.value !== null) {
          if (Array.isArray(answer.value)) {
            answer.value.forEach(val => counts[val] = (counts[val] || 0) + 1);
          } else {
            const val = String(answer.value);
            counts[val] = (counts[val] || 0) + 1;
          }
        }
      });

      questionInsights.push({
        fieldId: field.id,
        label: field.label || `Question ${field.id}`,
        type: field.type,
        options: field.options || [],
        data: counts
      });
    }
  });

  // 6. Aggregate metadata
  const devices = { Mobile: 0, Tablet: 0, Desktop: 0, Other: 0 };
  const browsers = {};
  const osBreakdown = {};

  responses.forEach(resp => {
    const metadata = resp.metadata || {};
    
    const deviceType = metadata.device || "Other";
    devices[deviceType] = (devices[deviceType] || 0) + 1;

    const browserName = metadata.browser || "Other";
    browsers[browserName] = (browsers[browserName] || 0) + 1;

    const osName = metadata.os || "Other";
    osBreakdown[osName] = (osBreakdown[osName] || 0) + 1;
  });

  // 7. Aggregate timeline
  const timeline = {};
  responses.forEach(resp => {
    const dateKey = resp.createdAt.toISOString().split("T")[0];
    timeline[dateKey] = (timeline[dateKey] || 0) + 1;
  });

  const sortedTimeline = Object.keys(timeline)
    .sort((a, b) => new Date(a) - new Date(b))
    .map(date => ({
      date,
      count: timeline[date]
    }));

  return {
    summary: {
      totalViews,
      totalSubmissions,
      completionRate
    },
    breakdowns: {
      devices,
      browsers,
      operatingSystems: osBreakdown
    },
    timeline: sortedTimeline,
    choiceAggregations: questionInsights
  };
};
