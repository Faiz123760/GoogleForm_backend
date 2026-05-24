import express from "express";
import {
  submitResponse,
  getResponses,
  exportResponses
} from "../controllers/responseController.js";
import { protect } from "../middleware/authMiddleware.js";
import { submissionLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validationMiddleware.js";
import { submitResponseSchema } from "../validations/responseValidations.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/**
 * Optional Auth Middleware:
 * If an Authorization header is present, attempts to decode it and attach the user to req.user.
 * Does not reject requests if no token is provided (allows anonymous submissions).
 */
const optionalProtect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Token is invalid or expired, ignore and treat as anonymous submission
    }
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Responses
 *   description: Responder submission flow, answer validation, and creator data exports
 */

/**
 * @swagger
 * /api/responses/{formId}:
 *   post:
 *     summary: Publicly submit responses to a form (with validation and rate-limiting)
 *     tags: [Responses]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mongoose Form ID to submit answers to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               password:
 *                 type: string
 *                 description: Required if the form is password protected in its settings
 *                 example: MyPassword123
 *               submissionDuration:
 *                 type: number
 *                 description: Total filling duration in seconds for analytics
 *                 example: 45
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - fieldId
 *                     - value
 *                   properties:
 *                     fieldId:
 *                       type: string
 *                       example: q1
 *                     value:
 *                       type: string
 *                       example: John Doe
 *     responses:
 *       201:
 *         description: Response recorded successfully (dispatches transaction emails if required)
 *       400:
 *         description: Validation error or form expired
 *       401:
 *         description: Password required or incorrect password
 *       404:
 *         description: Form not found
 */
router.post("/:formId", submissionLimiter, optionalProtect, validate(submitResponseSchema), submitResponse);

/**
 * @swagger
 * /api/responses/{formId}:
 *   get:
 *     summary: Retrieve all submissions for a specific form (Creator only)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form submissions list successfully fetched
 *       403:
 *         description: Forbidden - Requester is not the creator of this form
 *       404:
 *         description: Form not found
 */
router.get("/:formId", protect, getResponses);

/**
 * @swagger
 * /api/responses/{formId}/export:
 *   get:
 *     summary: Generate and stream raw CSV files of submissions (Creator only)
 *     tags: [Responses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Streams responses-formname.csv file back to client
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: text/csv
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Form not found
 */
router.get("/:formId/export", protect, exportResponses);

export default router;
