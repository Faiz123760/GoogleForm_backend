import { z } from "zod";

/**
 * Question submission answer schema definition
 */
const answerSchema = z.object({
  fieldId: z.string({ required_error: "Field ID is required for answer." }),
  value: z.any({ required_error: "Answer value must be provided." }) // Can be String, Number, or Array (checkbox choices)
});

/**
 * Public response submission schema validation
 */
export const submitResponseSchema = z.object({
  params: z.object({
    formId: z.string({ required_error: "Form ID path parameter is required." })
  }),
  body: z.object({
    answers: z
      .array(answerSchema, { required_error: "Answers array is required." })
      .min(1, "You must provide at least one answer to submit responses."),
    password: z.string().optional().nullable(),
    submissionDuration: z.number().optional().default(0)
  })
});
