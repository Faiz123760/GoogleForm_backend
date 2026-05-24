import rateLimit from "express-rate-limit";

/**
 * Auth Limiter: Restricts brute-force login and registration attempts
 * Maximum 5 requests per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: {
    success: false,
    message: "Too many login or registration attempts from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

/**
 * Submission Limiter: Restricts excessive spamming of form submissions
 * Maximum 30 responses per 1 hour per IP
 */
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  message: {
    success: false,
    message: "Too many responses submitted from this IP. Please try again after an hour."
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Standard API Limiter: General protective shield for all other endpoints
 * Maximum 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});
