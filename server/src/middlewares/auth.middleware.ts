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
    // Ensure userId is accessible as both userId and user.userId for compatibility
    (req as any).user = decoded;
    (req as any).userId = decoded.userId || decoded.user?.userId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
};
