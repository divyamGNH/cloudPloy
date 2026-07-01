import jwt, { type JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

// Instead of adding stuff like jit, exp etc manually just extend JwtPayload.
interface Claims extends JwtPayload {
    userId: string;
}

// ATSCALE : We can tighten the jwt token signing by providing all the fields jwt.sign() takes.
function signToken(userId: string, ttl: number, JWT_SECRET: string): string {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        {
            expiresIn: ttl,
            algorithm: "HS256",
            issuer: "api-server",
            jwtid: uuidv4(),
        }
    );
}

export const generateAccessToken = (userId: string, accessTTL: number): string => {
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

    if (!JWT_ACCESS_SECRET) {
        throw new Error("Can not find the JWT_ACCESS_SECRET in the env");
    }

    const token = signToken(userId, accessTTL, JWT_ACCESS_SECRET);

    return token;
};

export const generateRefreshToken = (userId: string, refreshTTL: number): string => {
    const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

    if (!JWT_REFRESH_SECRET) {
        throw new Error("Can not find the JWT_REFRESH_SECRET in the env");
    }

    const token = signToken(userId, refreshTTL, JWT_REFRESH_SECRET);

    return token;
};

export const parseAccessToken = (tokenString: string): Claims => {
    const decoded = jwt.verify(tokenString, process.env.JWT_ACCESS_SECRET!, {
        algorithms: ["HS256"],
        issuer: "api-server"
    });

    // decoded can be object or string. Throw error if it is a string
    if (typeof decoded === "string") {
        throw new Error("Invalid token payload");
    }

    return decoded as Claims;
};

export const parseRefreshToken = (tokenString: string): Claims => {
    const decoded = jwt.verify(tokenString, process.env.JWT_REFRESH_SECRET!, {
        algorithms: ["HS256"],
        issuer: "api-server",
    });

    // decoded can be object or string. Throw error if it is a string
    if (typeof decoded === "string") {
        throw new Error("Invalid token payload");
    }

    return decoded as Claims;
};
