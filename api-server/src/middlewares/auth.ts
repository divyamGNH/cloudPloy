import type { Request, Response, NextFunction } from "express";
import { parseAccessToken } from "../jwt/jwt.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Get the headers as the access token is in the headers.
  const authHeader = req.headers.authorization;

  // Check if the authorization headers even exist for the access token.
  if (!authHeader) {
    res.status(401).json({ message: "Missing authorization header" });
    return;
  }

  // Verify the token is Bearer-token or not
  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Actually if the accessToken is valid and is it expired or not.
    const claims = parseAccessToken(token);
    if (!claims) {
      res.status(401).json({ message: "invalid token" });
      return;
    }

    // Add the auth object to the request.
    req.auth = { userId: claims.userId };

    // Call the next controller.
    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Invalid token" });
  }
};