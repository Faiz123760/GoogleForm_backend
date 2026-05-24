import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect middleware: Ensures request contains a valid bearer token in Authorization header
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check if authorization header is set and starts with "Bearer"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized: No token provided" });
    }

    // Verify access token signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and append to request object (excluding password)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Not authorized: User no longer exists" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Access token expired" });
    }
    return res.status(401).json({ message: "Not authorized: Invalid token signature" });
  }
};

/**
 * Role-Based Access Control (RBAC) middleware: Restricts routes to specific user roles
 * @param {...string} roles - Permitted roles (e.g. 'admin', 'creator')
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to perform this action"
      });
    }
    next();
  };
};
