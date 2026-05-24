import express from "express";
import {
  createForm,
  getForms,
  getSingleForm,
  updateForm,
  deleteForm
} from "../controllers/formController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validationMiddleware.js";
import { updateFormSchema } from "../validations/formValidations.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Forms
 *   description: Form generation, fields updates, theme adjustments, and configuration rules
 */

/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: Create an empty draft Form
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Form created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 form:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: Untitled Form
 *                     published:
 *                       type: boolean
 *                       example: false
 *                     views:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/", protect, createForm);

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: Retrieve forms created by the logged-in user
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User forms retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/", protect, getForms);

/**
 * @swagger
 * /api/forms/{id}:
 *   put:
 *     summary: Save drag-and-drop updates, styling themes, password locks, and conditional logic rules
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique Mongoose Form ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Customer Survey
 *               description:
 *                 type: string
 *                 example: Please fill this out.
 *               fields:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: q1
 *                     type:
 *                       type: string
 *                       example: short_answer
 *                     label:
 *                       type: string
 *                       example: What is your full name?
 *                     required:
 *                       type: boolean
 *                       example: true
 *     responses:
 *       200:
 *         description: Form updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Not the creator of this form
 *       404:
 *         description: Form not found
 */
router.put("/:id", protect, validate(updateFormSchema), updateForm);

/**
 * @swagger
 * /api/forms/{id}:
 *   delete:
 *     summary: Cascade delete form and all associated respondent submissions
 *     tags: [Forms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form and responses deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Form not found
 */
router.delete("/:id", protect, deleteForm);

/**
 * @swagger
 * /api/forms/{id}:
 *   get:
 *     summary: Fetch detailed form fields (accessible to respondent if published, or creator)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detailed form retrieved (increments page views count if respondent views it)
 *       403:
 *         description: Forbidden - Form is in draft mode and requester is not creator
 *       404:
 *         description: Form not found
 */
router.get("/:id", getSingleForm);

export default router;
