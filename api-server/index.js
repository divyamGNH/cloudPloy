import express from "express";
import dotenv from "dotenv";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const ecs = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

app.post("/deploy", async (req, res) => {
  try {
    const command = new RunTaskCommand({
      cluster: "vercel-cluster",
      taskDefinition: "vercel-cluster-build-server1",
      launchType: "FARGATE",
      count: 1,

      networkConfiguration: {
        awsvpcConfiguration: {
          subnets: [
            "subnet-0d0f2f8059a9de264",
            "subnet-0dacc8e6c96b9b6a1",
            "subnet-071a8e22c077c0d24",
          ],
          securityGroups: ["sg-061cab7e4e6397439"],
          assignPublicIp: "ENABLED",
        },
      },

      overrides: {
        containerOverrides: [
          {
            name: "Main",
            environment: [
              {
                name: "GIT_REPOSITORY_URL",
                value: process.env.GIT_REPOSITORY_URL,
              },
              { name: "ACCESS_KEY_ID", value: process.env.ACCESS_KEY_ID },
              {
                name: "SECRET_ACCESS_KEY",
                value: process.env.SECRET_ACCESS_KEY,
              },
            ],
          },
        ],
      },
    });

    const response = await ecs.send(command);

    res.json({
      message: "Build container started",
      response,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to run task" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);
});
