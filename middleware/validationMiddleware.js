/**
 * Generic Express request validator using Zod schemas
 * Sanitizes input and returns beautifully structured error responses for bad inputs
 * 
 * @param {z.ZodObject} schema - The Zod schema to validate against
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      // Format Zod validation errors to be highly readable for front-end consumption
      const formattedErrors = parsed.error.errors.map(err => {
        // Construct clear path description (e.g. 'body.email' -> 'email')
        const fieldName = err.path
          .join(".")
          .replace(/^(body|query|params)\./, "");
        
        return {
          field: fieldName || "general",
          message: err.message
        };
      });

      return res.status(400).json({
        success: false,
        message: "Validation failed: please verify your input data.",
        errors: formattedErrors
      });
    }

    // Replace original requests with safe, validated, stripped data
    if (parsed.data.body !== undefined) req.body = parsed.data.body;
    if (parsed.data.query !== undefined) req.query = parsed.data.query;
    if (parsed.data.params !== undefined) req.params = parsed.data.params;

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server validation engine failure",
      error: error.message
    });
  }
};
