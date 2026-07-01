import type { Request, Response } from "express";
import * as authService from "../services/authService.js";
import type { LoginReq, SignupReq, AuthTokens } from "../types/authTypes.js";

const setTokenCookies = (res: Response, tokens: AuthTokens) => {
  res.cookie("refresh-token", tokens.refreshToken, {
    httpOnly: true,
    path: "/",
    maxAge: tokens.refreshTTL * 1000,
    sameSite: "lax",
    secure: false,
  });
};

export const login = async (req: Request, res: Response) => {
  const body: LoginReq = req.body;
  const result = await authService.login(body);
  setTokenCookies(res, result.tokens);
  res.status(200).json(result);
};

export const signup = async (req: Request, res: Response) => {
  const body: SignupReq = req.body;
  const result = await authService.signup(body);
  res.status(200).json(result);
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("refresh-token", { path: "/" });
  res.status(200).json({ message: "logged out successfully" });
};

export const me = (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: "unauthorized" });
    return;
  }
  res.status(200).json({ authenticated: true, userId });
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies["refresh-token"];
  if (!token) {
    res.status(401).json({ message: "missing refresh token" });
    return;
  }

  try {
    const result = await authService.refresh(token);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
  }
};