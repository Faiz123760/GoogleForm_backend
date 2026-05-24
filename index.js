import "dotenv/config.js";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import xss from "xss-clean";
import morgan from "morgan";
import { generalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import formRoutes from "./routes/formRoutes.js";
import responseRoutes from "./routes/responseRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
connectDB();

const app = express();

// Globally override express.request.query to be writable/settable for xss-clean compatibility
const originalQueryGetter = Object.getOwnPropertyDescriptor(express.request, 'query')?.get;
Object.defineProperty(express.request, 'query', {
  configurable: true,
  enumerable: true,
  get() {
    return this._query !== undefined ? this._query : (originalQueryGetter ? originalQueryGetter.call(this) : {});
  },
  set(val) {
    this._query = val;
  }
});

// Security Middlewares
app.use(helmet()); // Set security HTTP headers
app.use(xss()); // Sanitize user input from XSS POST/GET parameters

// Logging Middleware
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined")); // Standard Apache combined log output
} else {
  app.use(morgan("dev")); // Concise output for development
}

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

// Apply General Protective Rate Limiter to all API endpoints
app.use("/api", generalLimiter);

// Core Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());

// Static folder for local file uploads fallback
app.use("/uploads", express.static("uploads"));

// Route Declarations
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/responses", responseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/analytics", analyticsRoutes);

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

// Test Route
app.get("/", (req, res) => {
  res.send("API Running Successfully");
});

// Connection established via connectDB()

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});