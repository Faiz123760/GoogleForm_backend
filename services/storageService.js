import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);

let isCloudinaryConfigured = false;
let isConfiguredCheckDone = false;

const configureCloudinary = () => {
  if (isConfiguredCheckDone) return isCloudinaryConfigured;

  isCloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  if (isCloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log("Cloudinary connection initialized.");
  } else {
    console.log("Cloudinary credentials not detected in .env. Falling back to local storage uploads.");
  }
  isConfiguredCheckDone = true;
  return isCloudinaryConfigured;
};

/**
 * Pipes file upload buffer securely to Cloudinary (Production) or falls back to local disk storage (Development)
 * 
 * @param {Buffer} fileBuffer - File buffer from multer memory storage
 * @param {string} originalName - Original uploaded filename
 * @param {string} mimeType - The mimetype of the file
 * @returns {Promise<string>} The public URL of the saved asset
 */
export const uploadFile = async (fileBuffer, originalName, mimeType) => {
  try {
    const useCloudinary = configureCloudinary();
    // 1. Cloudinary upload if configured
    if (useCloudinary) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "google-form-uploads",
            resource_type: "auto" // Handles images, PDF, and ZIPs automatically
          },
          (error, result) => {
            if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
            resolve(result.secure_url);
          }
        );
        uploadStream.end(fileBuffer);
      });
    }

    // 2. Development Fallback: Local uploads directory
    const uploadFolder = path.resolve("uploads");
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName)}`;
    const targetPath = path.join(uploadFolder, uniqueName);
    
    await writeFileAsync(targetPath, fileBuffer);

    // Return the reachable URL for frontend display/download
    const baseUrl = process.env.SERVER_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/${uniqueName}`;
  } catch (error) {
    throw new Error(`File upload service failed: ${error.message}`);
  }
};
