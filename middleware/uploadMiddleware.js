import multer from "multer";

// Use memory storage to enable streaming directly to the cloud storage provider
const storage = multer.memoryStorage();

/**
 * Filter uploaded files based on mimetypes
 * Allowed formats: PDF, Images (PNG/JPG/JPEG/GIF/WEBP), and ZIP files
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed"
  ];

  const extension = file.originalname.split(".").pop().toLowerCase();
  const isZipExtension = extension === "zip";

  if (allowedMimeTypes.includes(file.mimetype) || isZipExtension) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file format. Only PDF, Images (JPEG/PNG/GIF/WEBP), and ZIP files are allowed."), false);
  }
};

// Instantiate multer with limits (5MB per file)
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

/**
 * Global Error Handler helper for Multer Limits
 */
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File is too large. Maximum file size allowed is 5MB."
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload Error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};
