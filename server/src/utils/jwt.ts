import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export const generateToken = (userId: string, email?: string, name?: string, role?: string, shopId?: string): string => {
  return jwt.sign({ 
    userId, 
    email: email || 'user@example.com',
    name: name || 'User',
    role: role || 'SELLER',
    shopId: shopId || null
  }, JWT_SECRET, { expiresIn: "1d" });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
