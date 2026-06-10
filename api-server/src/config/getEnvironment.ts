import type { EnvironmentConfigType } from "../types/configTypes.js";

export function GetEnvironmentConfigs() : EnvironmentConfigType {
    return {
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
    PORT: Number(process.env.PORT),
    BASE_URL: process.env.BASE_URL!,
    FRONTEND_URL: process.env.FRONTEND_URL!,
    API_SERVER_URL: process.env.API_SERVER_URL!,
  };
}