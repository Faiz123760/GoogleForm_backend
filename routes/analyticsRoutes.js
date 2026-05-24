import express from "express";
import { getFormAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Rich dashboards, submissions rate, completions, device metrics, OS charts, and date history timelines
 */

/**
 * @swagger
 * /api/analytics/{formId}:
 *   get:
 *     summary: Fetch rich aggregated graphical analytical insights for a specific form (Creator only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mongoose Form ID to fetch charts data for
 *     responses:
 *       200:
 *         description: Comprehensive chart aggregated analytical details returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalViews:
 *                           type: number
 *                           example: 120
 *                         totalSubmissions:
 *                           type: number
 *                           example: 45
 *                         completionRate:
 *                           type: number
 *                           example: 38
 *                     breakdowns:
 *                       type: object
 *                       properties:
 *                         devices:
 *                           type: object
 *                           properties:
 *                             Desktop:
 *                               type: number
 *                               example: 30
 *                             Mobile:
 *                               type: number
 *                               example: 12
 *                             Tablet:
 *                               type: number
 *                               example: 3
 *       403:
 *         description: Forbidden - Requester is not the owner of this form
 *       404:
 *         description: Form not found
 */
router.get("/:formId", protect, getFormAnalytics);

export default router;
