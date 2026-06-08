import { ECSClient } from "@aws-sdk/client-ecs";

// Latest aws sdk self detects the AWS creds from the env no need to pass them as credentials.

export function createECSClient() : ECSClient {
  const ecs = new ECSClient({
    region : "ap-south-1",
  });

  return ecs;
}