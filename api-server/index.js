import express from "express";
import dotenv from "dotenv";
import { ECSClient, RunTaskCommand } from "@aws-sdk/client-ecs";
import cors from "cors";
import { randomUUID } from "crypto";

//Add task roles in order to prevent the use to access and secret ID in the env.

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL;
const Frontend_URL=process.env.Frontend_URL;

app.use(express.json());
app.use(cors({
  origin: Frontend_URL,
  credentials: true
}));

const DeploymentStatus = new Map();

const ecs = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

app.post("/deploy", async (req, res) => {
  const GIT_URL = req.body.githubUrl;
  console.log("The github URL is : ",GIT_URL);
  const ProjectID = randomUUID();
  console.log(ProjectID);
  const DeploymentID = "1";
  console.log(DeploymentID);
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
                value: GIT_URL,
              },
              { name: "ACCESS_KEY_ID", value: process.env.ACCESS_KEY_ID },
              {
                name: "SECRET_ACCESS_KEY",
                value: process.env.SECRET_ACCESS_KEY,
              },
              {
                name: "PROJECT_ID",
                value: ProjectID,
              },
              {
                name: "DEPLOYMENT_ID",
                value: DeploymentID,
              },
              {
                name: "Backend_URL",
                value: process.env.Backend_URL,
              }
            ],
          },
        ],
      },
    });

    const response = await ecs.send(command);
    DeploymentStatus.set(`${ProjectID}/${DeploymentID}`, "Building");

    const taskArn = response.tasks[0].taskArn;

    res.json({
      message: "Build container started, Deploying your code",
      // response, Sending the whole response object will leak AWS creds and stuff send only what is needed
      // taskArn : response.tasks[0].taskArn,
      ProjectID: ProjectID,
      DeploymentID: DeploymentID,
      // liveLink : `${BASE_URL}/${ProjectID}/${DeploymentID}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to run task" });
  }
});

app.get("/deploymentStatus", (req, res) => {
  const { ProjectID, DeploymentID } = req.query;

  if (!ProjectID || !DeploymentID) {
    return res.status(400).json({ error: "Missing deployment identifiers" });
  }

  const status = DeploymentStatus.get(`${ProjectID}/${DeploymentID}`);

  res.json({
    //If we could not find a status of the project it is probably still building.
    status: status || "Building",
  });
});

app.post("/deploymentComplete", (req, res) => {
  const { ProjectID, DeploymentID, status } = req.body;

  if (!ProjectID || !DeploymentID || !status) {
    return res.status(400).json({ error: "Missing deployment identifiers" });
  }

  DeploymentStatus.set(`${ProjectID}/${DeploymentID}`, status);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on PORT:${PORT}`);
});
