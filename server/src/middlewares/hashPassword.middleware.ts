import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

export const hashPasswordMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only hash if password is provided in the body
    if (req.body.password) {
      const saltRounds = 10;
      req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    }
    next();
  } catch (error) {
    res.status(500).json({ error: "Error processing password" });
  }
};
