import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

export const ecs = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});