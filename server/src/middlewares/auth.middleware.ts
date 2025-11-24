import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  // Bearer <token>
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Invalid token format" });
    return;
  }

  try {
    const decoded = verifyToken(token);
    // Attach user info to request
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
