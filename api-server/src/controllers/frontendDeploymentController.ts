import { RunTaskCommand } from "@aws-sdk/client-ecs";
import { randomUUID } from "crypto";
import { GetEnvironmentConfigs } from "../config/getEnvironment.js";
import type { Request, Response } from "express";
import { createECSClient } from "../config/ecsClient.js";

const DeploymentStatus = new Map();

export async function Deployer(req : Request, res : Response) {
    const GIT_URL = req.body.githubUrl;
    console.log("The github URL is : ", GIT_URL);
    const ProjectID = randomUUID();
    console.log(ProjectID);
    const DeploymentID = "1";
    console.log(DeploymentID);

    const {
        AWS_ACCESS_KEY_ID,
        AWS_SECRET_ACCESS_KEY,
        PORT,
        BASE_URL,
        FRONTEND_URL,
        API_SERVER_URL,
    } = GetEnvironmentConfigs();

    console.log(GetEnvironmentConfigs());

    console.log(process.env.AWS_ACCESS_KEY_ID);
    console.log(process.env.AWS_SECRET_ACCESS_KEY);
    console.log("API_URL is", process.env.API_SERVER_URL);
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
                            {
                                name: "AWS_ACCESS_KEY_ID",
                                value: process.env.AWS_ACCESS_KEY_ID
                            },
                            {
                                name: "AWS_SECRET_ACCESS_KEY",
                                value: process.env.AWS_SECRET_ACCESS_KEY,
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
                                name: "API_SERVER_URL",
                                value: process.env.API_SERVER_URL,
                            },
                        ],
                    },
                ],
            },
        });

        const ecs = createECSClient();
        console.log("Sending ECS command to run a task");
        await ecs.send(command);
        console.log("ECS task complete");
        DeploymentStatus.set(`${ProjectID}/${DeploymentID}`, "Building");

        // const taskArn = response.tasks[0].taskArn;

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
};