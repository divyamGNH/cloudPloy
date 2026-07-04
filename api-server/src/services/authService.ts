import bcrypt from "bcrypt";
import { db } from "../db/db.js";
import { createUser, getUserByEmail } from "../repositories/userRepo.js";
import { generateAccessToken, generateRefreshToken, parseRefreshToken } from "../jwt/jwt.js";
import type { LoginReq, SignupReq, LoginRes, SignupRes, RefreshRes } from "../types/authTypes.js";
import type { User } from "../types/db.js";

const ACCESS_TTL = 15 * 60;
const REFRESH_TTL = 7 * 24 * 60 * 60;

export const login = async (req: LoginReq): Promise<LoginRes> => {
  const user = await getUserByEmail(db, req.email);
  if (!user) throw new Error("invalid credentials");

  const valid = await bcrypt.compare(req.password, user.password_hash);
  if (!valid) throw new Error("invalid credentials");

  const accessToken = generateAccessToken(user.user_id, ACCESS_TTL);
  const refreshToken = generateRefreshToken(user.user_id, REFRESH_TTL);

  const res: LoginRes = {
    userId: user.user_id,
    name: user.name,
    email: user.email,
    tokens: {
      accessTTL: ACCESS_TTL,
      refreshTTL: REFRESH_TTL,
      accessToken: accessToken,
      refreshToken: refreshToken,
    }
  }

  return res;
};

export const signup = async (req: SignupReq): Promise<SignupRes> => {
  const passwordHash = await bcrypt.hash(req.password, 10);

  console.log(process.env.DATABASE_URL);

  try {
    const user = await createUser(db, req.name, req.email, passwordHash);

    const res: SignupRes = {
      userId: user.user_id,
      name: user.name,
      email: user.email,
    };

    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const refresh = async (refreshToken: string): Promise<RefreshRes> => {
  const claims = parseRefreshToken(refreshToken);
  const accessToken = generateAccessToken(claims.userId, ACCESS_TTL);

  const res: RefreshRes = {
    accessToken: accessToken,
  }
  return res;
};