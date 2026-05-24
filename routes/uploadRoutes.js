import express from "express";
import { upload, handleUploadError } from "../middleware/uploadMiddleware.js";
import { uploadFile } from "../services/storageService.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File attachments management (supports PDFs, images, and ZIP files up to 5MB)
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Handle single file upload (e.g. image, resume PDF, zip archive)
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Binary attachment file to upload (Max 5MB)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 fileUrl:
 *                   type: string
 *                   example: http://localhost:5000/uploads/1716035123456-my-resume.pdf
 *                 fileName:
 *                   type: string
 *                   example: my-resume.pdf
 *       400:
 *         description: No file provided or incorrect file format
 *       500:
 *         description: Server error
 */
router.post(
  "/",
  upload.single("file"),
  handleUploadError,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided for upload."
        });
      }

      // Securely pipe file buffer to Cloudinary or write to local storage
      const fileUrl = await uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        fileUrl,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error during file upload",
        error: error.message
      });
    }
  }
);

export default router;
