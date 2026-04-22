import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../config/config.js";
import type { AuthRequest } from "../types/index.js";
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = (decoded as jwt.JwtPayload).id;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
