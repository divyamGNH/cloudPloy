import type { Request, Response, NextFunction } from "express";
import { parseAccessToken } from "../jwt/jwt.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // We store both the tokens in cookies so no Bearer token check.
  const token = req.cookies["access-token"];

  if (!token) {
    res.status(401).json({ message: "Missing access token" });
    return;
  }

  try {
    const claims = parseAccessToken(token);
    if (!claims) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.auth = { userId: claims.userId };
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid token" });
  }
};