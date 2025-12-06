import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

export const hashPasswordMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only hash if password is provided in the body and is a string
    if (req.body.password && typeof req.body.password === 'string') {
      const saltRounds = 10;
      req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    } else if (req.body.password) {
      // Password exists but is not a string (might already be hashed)
      console.warn("Password middleware: password is not a string, skipping hash");
    }
    next();
  } catch (error) {
    console.error("Password hashing error:", error);
    res.status(500).json({ 
      success: false,
      error: "Error processing password" 
    });
  }
};
