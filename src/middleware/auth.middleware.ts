import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../db/entity/User";

// Extend Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userId?: number;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        error: "Authentication failed",
        message: "Authorization header missing or invalid format",
      });
      return
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_key"
    ) as { userId: number; email: string };

    // Find user by ID
    const user = await User.findOne({ where: { id: decoded.userId } });
    if (!user) {
      res.status(401).json({
        error: "Authentication failed",
        message: "User not found",
      });
      return 
    }

    // Attach user to request object
    req.user = user;
    req.userId = user.id;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({
      error: "Authentication failed",
      message: "Invalid or expired token",
    });
    return
  }
};

// export const requireAdmin = (req: Request, res: Response, next: NextFunction) : void => {
//   // This is a placeholder - you would need to add a role field to your User entity
//   // if (req.user && req.user.role === 'admin') {
//   //   next();
//   // } else {
//   //   return res.status(403).json({
//   //     error: 'Access denied',
//   //     message: 'Admin privileges required'
//   //   });
//   // }
//
//   // For now, we'll just pass through this middleware
//  return  next();
// };
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  return next();
};
