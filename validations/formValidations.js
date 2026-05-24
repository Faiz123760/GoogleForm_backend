import { z } from "zod";

/**
 * Individual Form Field definition validation schema
 */
const fieldSchema = z.object({
  id: z.string({ required_error: "Field ID is required." }),
  type: z.enum([
    // Google Forms Core Types
    "short_answer",
    "paragraph",
    "multiple_choice",
    "checkboxes",
    "dropdown",
    "linear_scale",
    "date",
    "time",
    "file_upload",
    "rating",
    "multiple_choice_grid",
    "checkbox_grid",
    
    // Modern & Premium Additions
    "email",
    "number",
    "phone",
    "url",
    "color",
    "signature",
    "toggle",
    "rich_text",
    "section_header"
  ], { required_error: "Field type is required and must be a valid option." }),
  label: z
    .string({ required_error: "Field label is required." })
    .min(1, "Label cannot be empty."),
  placeholder: z.string().optional().nullable(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().default([]),
  
  // Linear Scale configurations
  scaleMin: z.number().min(0).max(1).optional().default(1),
  scaleMax: z.number().min(2).max(10).optional().default(5),
  scaleMinLabel: z.string().optional().nullable(),
  scaleMaxLabel: z.string().optional().nullable(),

  // Choice Grid configurations
  gridRows: z.array(z.string()).optional().default([]),
  gridColumns: z.array(z.string()).optional().default([]),

  conditionalLogic: z
    .object({
      showIfFieldId: z.string().optional().nullable(),
      showIfValue: z.string().optional().nullable()
    })
    .optional()
    .nullable()
});

/**
 * Form Structure update schema validation
 */
export const updateFormSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Form ID parameter is required." })
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, "Title cannot be left blank.")
      .optional(),
    description: z.string().optional(),
    fields: z.array(fieldSchema).optional(),
    settings: z
      .object({
        limitTo1Response: z.boolean().optional(),
        collectEmail: z.boolean().optional(),
        passwordProtected: z.boolean().optional(),
        passwordHash: z.string().optional().nullable(),
        expiryDate: z
          .string()
          .datetime()
          .or(z.date())
          .or(z.string())
          .optional()
          .nullable()
      })
      .optional(),
    published: z.boolean().optional(),
    theme: z
      .object({
        primaryColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        textColor: z.string().optional(),
        fontFamily: z.string().optional(),
        headerImage: z.string().optional().nullable()
      })
      .optional()
  })
});
