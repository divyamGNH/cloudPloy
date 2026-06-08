import { randomUUID } from "crypto";
import type { Request, Response } from "express";

import { createECSClient } from "../config/ecsClient.js";
import { CreateExpressGatewayServiceCommand} from "@aws-sdk/client-ecs";
import { type CreateExpressGatewayServiceCommandInput } from "@aws-sdk/client-ecs";

import type { backendDeploymentResponse } from "../types/backendDeploymentTypes.js";

//See the main goal that we have right now is that we need have our deployement-container ready we need that container to spin up user containers each time the user requests a new backend service.

//We dont care for upscaling or downscaling the containers as for now we are using the AWS fargate which does it for us.

// We already have a image for the users git repository named ProjectID-DeploymentId in the ECR this controller needs to spin up a ECS service for that image.

export async function backendDeployer(req : Request, res : Response) {
    // const GIT_URL = req.body.githubUrl;
    const body : backendDeploymentResponse = req.body;
    const githubUrl = body.githubUrl;

    console.log("The github URL is : ", githubUrl);
    const ProjectID = randomUUID();
    console.log(ProjectID);
    const DeploymentID = "1";
    console.log(DeploymentID);
    const PORT = process.env.PORT;

    try {
        const input : CreateExpressGatewayServiceCommandInput = { // CreateExpressGatewayServiceRequest
            executionRoleArn: "arn:aws:iam::801795967285:role/ecsTaskExecutionRole", // required
            infrastructureRoleArn: "arn:aws:iam::801795967285:role/ecsInfrastructureRoleForExpressServices", // required
            serviceName: `${ProjectID}-${DeploymentID}`,
            cluster: "backend-deployment-cluster",

            // healthCheckPath: "STRING_VALUE",
            primaryContainer: { // ExpressGatewayContainer
                image: "801795967285.dkr.ecr.ap-south-1.amazonaws.com/backend-deployment-service@sha256:709f6963e6f8142c8506dffaf1aad85b9ae3ebcd634124fa8888775851acbedf", // required
                containerPort: Number(`${PORT}`),
                // awsLogsConfiguration: { // ExpressGatewayServiceAwsLogsConfiguration
                //     logGroup: "STRING_VALUE", // required
                //     logStreamPrefix: "STRING_VALUE", // required
                // },
                // repositoryCredentials: { // ExpressGatewayRepositoryCredentials
                //     credentialsParameter: "STRING_VALUE",
                // },
                // command: [ // StringList
                //     "STRING_VALUE",
                // ],
                environment: [ // EnvironmentVariables
                    { // KeyValuePair
                        name: "PORT",
                        value: "3000",
                    },
                ],
                // secrets: [ // SecretList
                //     { // Secret
                //         name: "STRING_VALUE", // required
                //         valueFrom: "STRING_VALUE", // required
                //     },
                // ],
            },
            taskRoleArn: "arn:aws:iam::801795967285:role/ecsTaskExecutionRole",
            cpu: "1 vCPU",
            memory: "2 GB",
            scalingTarget: { // ExpressGatewayScalingTarget
                minTaskCount: Number("1"),
                maxTaskCount: Number("10"),
                autoScalingMetric: "AVERAGE_CPU",
                autoScalingTargetValue: Number("70"),
            }
        }; 
        
        const ecs = createECSClient();
        const command = new CreateExpressGatewayServiceCommand(input);
        const response = await ecs.send(command);
    } catch (error) {
        console.log("Backend deployment container had an error : ",error);
    }
}