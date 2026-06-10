import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { RunTaskCommand } from "@aws-sdk/client-ecs";

import { createECSClient } from "../config/ecsClient.js";
import type { backendDeploymentRequestBody } from "../types/backendDeploymentTypes.js";

// See the main goal that we have right now is that we need have our
// deployment-container ready. We need that container to spin up user
// containers each time the user requests a new backend service.

// We dont care for upscaling or downscaling the containers as for now
// we are using AWS Fargate which does it for us.

// We already have an image for the user's git repository named
// ProjectID-DeploymentId in ECR. This controller needs to spin up
// an ECS service for that image.

export async function backendDeployer(req: Request, res: Response) {
    const body: backendDeploymentRequestBody = req.body;

    const {
        GITHUB_URL,
        RUNTIME,
        BUILD_COMMAND,
        START_COMMAND,
        PROJECT_ROOT,
    } = body;

    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    const BUILDKIT_HOST = process.env.BUILDKIT_HOST;
    const PORT = process.env.PORT;
    const API_SERVER_URL = process.env.API_SERVER_URL;

    const ProjectID = randomUUID();
    const DeploymentID = "1";

    console.log("The github URL is :", GITHUB_URL);
    console.log("ProjectId is :", ProjectID);
    console.log("DeploymentId is :", DeploymentID);

    try {
        const command = new RunTaskCommand({
            cluster: "backend-deployment-cluster",
            taskDefinition: "cloudPloy-backend-image-generator",
            launchType: "FARGATE",
            count: 1,

            networkConfiguration: {
                awsvpcConfiguration: {
                    subnets: [
                        "subnet-0d0f2f8059a9de264",
                        "subnet-0dacc8e6c96b9b6a1",
                        "subnet-071a8e22c077c0d24",
                    ],
                    securityGroups: ["sg-061cab7e4e6397439", "sg-0ddb6f89d533e49d3"],
                    assignPublicIp: "ENABLED",
                },
            },

            overrides: {
                containerOverrides: [
                    {
                        name: "backend-builder",
                        environment: [
                            {
                                name: "GITHUB_REPOSITORY_URL",
                                value: GITHUB_URL,
                            },
                            {
                                name: "RUNTIME",
                                value: RUNTIME,
                            },
                            {
                                name: "BUILD_COMMAND",
                                value: BUILD_COMMAND,
                            },
                            {
                                name: "START_COMMAND",
                                value: START_COMMAND,
                            },
                            {
                                name: "PROJECT_ROOT",
                                value: PROJECT_ROOT,
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
                                name: "AWS_ACCESS_KEY_ID",
                                value: AWS_ACCESS_KEY_ID,
                            },
                            {
                                name: "AWS_SECRET_ACCESS_KEY",
                                value: AWS_SECRET_ACCESS_KEY,
                            },
                            {
                                name: "BUILDKIT_HOST",
                                value: BUILDKIT_HOST,
                            },
                            {
                                name: "PORT",
                                value: PORT,
                            },
                            {
                                name: "API_SERVER_URL",
                                value: API_SERVER_URL,
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

        res.json({
            message: "Build container started, Deploying your code",
            ProjectID,
            DeploymentID,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to run task",
        });
    }
}