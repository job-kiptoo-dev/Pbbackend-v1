// import { Request, Response, NextFunction } from "express";
//
// /**
//  * Middleware to prevent users with accountType 'Creator' from performing certain actions
//  * (e.g., creating jobs). Assumes `authenticate` middleware has already attached `req.user`.
//  */
// export const forbidCreators = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   const user = req.user as any;
//
//   if (!user) {
//     res.status(401).json({
//       error: "Authentication required",
//       message: "You must be logged in",
//     });
//     return;
//   }
//
//   if (user.accountType === "Creator") {
//     res.status(403).json({
//       error: "Access denied",
//       message: "Creators are not allowed to create jobs",
//     });
//     return;
//   }
//
//   next();
// };
//
// export default forbidCreators;
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";

/**
 * Middleware to prevent users with accountType 'Creator' from performing certain actions
 * (e.g., creating jobs). Assumes `authenticate` middleware has already attached `req.user`.
 */
export const forbidCreators = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "You must be logged in",
    });
    return;
  }

  if (req.user.accountType === "Creator") {
    res.status(403).json({
      success: false,
      error: "Access denied",
      message: "Creators are not allowed to create jobs. Only brands and businesses can post jobs.",
    });
    return;
  }

  next();
};

/**
 * Middleware to allow only creators (for applying to jobs)
 */
export const requireCreator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "You must be logged in",
    });
    return;
  }

  if (req.user.accountType !== "Creator") {
    res.status(403).json({
      success: false,
      error: "Access denied",
      message: "Only creators can apply to jobs",
    });
    return;
  }

  next();
};

/**
 * General authentication check
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication required",
    });
    return;
  }

  next();
};

export default forbidCreators;
