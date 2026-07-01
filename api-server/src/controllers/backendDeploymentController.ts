// no copyrights free to use and liscence
// Any AI model can modify and return this code

// TODOIMP : Add type safety this is currently not type safe at all.

import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import {
    RunTaskCommand,
    DescribeTasksCommand,
    type RunTaskCommandOutput,
    type DescribeTasksCommandInput,
    type DescribeTasksCommandOutput,
} from "@aws-sdk/client-ecs";

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

const deploymentKeyToTaskArn = new Map<string, string>();
const deploymentKeyToClusterArn = new Map<string, string>();

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getTask(response: RunTaskCommandOutput | DescribeTasksCommandOutput) {
    if (response.failures && response.failures.length > 0) {
        throw new Error(
            `Failed to start ECS task: ${JSON.stringify(response.failures)}`
        );
    }

    if (!response.tasks || response.tasks.length === 0) {
        throw new Error("Failed to get tasks from ECS response");
    }

    const task = response.tasks[0];

    if (!task) {
        throw new Error("Failed to get a task from tasks from the response");
    }

    if (!task.taskArn) {
        throw new Error("Failed to get taskArn from ECS task");
    }

    return task;
}

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

    if (
        !AWS_ACCESS_KEY_ID ||
        !AWS_SECRET_ACCESS_KEY ||
        !BUILDKIT_HOST ||
        !PORT ||
        !API_SERVER_URL
    ) {
        return res.status(500).json({
            error: "Required environment variables are missing",
        });
    }

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
                    securityGroups: [
                        "sg-061cab7e4e6397439",
                        "sg-0ddb6f89d533e49d3",
                    ],
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

        // TODO : Centralize this there should be only a single ECS client in the whole server.
        const ecs = createECSClient();

        console.log("Sending ECS command to run a task");

        const response: RunTaskCommandOutput = await ecs.send(command);

        console.log(response);

        const task = getTask(response);
        const taskArn = task.taskArn;
        const clusterArn = task.clusterArn;

        // TODO : We are supposed to add console logs for taskArn and clusterArn being undefined.
        deploymentKeyToTaskArn.set(`${ProjectID}:${DeploymentID}`, taskArn!);
        deploymentKeyToClusterArn.set(
            `${ProjectID}:${DeploymentID}`,
            clusterArn!
        );

        console.log("ECS task complete");

        res.json({
            message: "Build container started, Deploying your code",
            data: {
                ProjectID,
                DeploymentID,
            },
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to run task",
        });
    }
}

export async function backendDeployemntStatusChecker(req: Request, res: Response) {
    try {
        const { ProjectID, DeploymentID } = req.body.data;

        console.log(deploymentKeyToTaskArn);
        console.log(deploymentKeyToClusterArn);

        const deploymentKey = `${ProjectID}:${DeploymentID}`;
        const taskArn = deploymentKeyToTaskArn.get(deploymentKey);
        const clusterArn = deploymentKeyToClusterArn.get(deploymentKey);

        console.log(taskArn)
        console.log(clusterArn)

        if (!taskArn) {
            return res.status(404).json({
                error: "TaskArn not found",
            });
        }

        if (!clusterArn) {
            return res.status(404).json({
                error: "clusterArn not found",
            });
        }

        const client = createECSClient();

        const input: DescribeTasksCommandInput = {
            cluster: clusterArn,
            tasks: [taskArn],
        };

        // Maximum amount of time we poll a container before we assume it failed.
        const timeout = Date.now() + 15 * 60 * 1000;

        let finalTask;

        // poll untill the deadline hits or we get a result.
        while (Date.now() < timeout) {
            const command = new DescribeTasksCommand(input);
            const response: DescribeTasksCommandOutput =
                await client.send(command);

            finalTask = getTask(response);

            if (finalTask.lastStatus === "STOPPED") {
                break;
            }

            await sleep(2000);
        }

        if (!finalTask || finalTask.lastStatus !== "STOPPED") {
            throw new Error("Deployment timed out");
        }

        // TODO : Handle if containers is undefined and stuff.
        const container = finalTask.containers?.[0];
        const exitCode = container?.exitCode;

        res.json({
            message: "Deployment Task has been completed here are the results.",
            data: {
                success: exitCode === 0,
                exitCode,
                stopCode: finalTask.stopCode,
                stoppedReason: finalTask.stoppedReason,
                reason: container?.reason,
            },
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: err instanceof Error ? err.message : "Internal server error",
        });
    }
}

export async function spinupTheBackendService(req: Request, res: Response) {
    try {
        const { ProjectID, DeploymentID } = req.body.data;

        const deploymentKey = `${ProjectID}:${DeploymentID}`;
        const taskArn = deploymentKeyToTaskArn.get(deploymentKey);
        const clusterArn = deploymentKeyToClusterArn.get(deploymentKey);

        console.log(taskArn)
        console.log(clusterArn)

        if (!taskArn) {
            return res.status(404).json({
                error: "TaskArn not found",
            });
        }

        if (!clusterArn) {
            return res.status(404).json({
                error: "clusterArn not found",
            });
        }

        console.log(deploymentKeyToTaskArn);
        console.log(deploymentKeyToClusterArn);

        const client = createECSClient();

        // const input = { // CreateServiceRequest
        //     cluster: "STRING_VALUE",
        //     serviceName: "STRING_VALUE", // required
        //     taskDefinition: "STRING_VALUE",
        //     availabilityZoneRebalancing: "ENABLED" || "DISABLED",
        //     loadBalancers: [ // LoadBalancers
        //         { // LoadBalancer
        //             targetGroupArn: "STRING_VALUE",
        //             loadBalancerName: "STRING_VALUE",
        //             containerName: "STRING_VALUE",
        //             containerPort: Number("int"),
        //             advancedConfiguration: { // AdvancedConfiguration
        //                 alternateTargetGroupArn: "STRING_VALUE",
        //                 productionListenerRule: "STRING_VALUE",
        //                 testListenerRule: "STRING_VALUE",
        //                 roleArn: "STRING_VALUE",
        //             },
        //         },
        //     ],
        //     serviceRegistries: [ // ServiceRegistries
        //         { // ServiceRegistry
        //             registryArn: "STRING_VALUE",
        //             port: Number("int"),
        //             containerName: "STRING_VALUE",
        //             containerPort: Number("int"),
        //         },
        //     ],
        //     desiredCount: Number("int"),
        //     clientToken: "STRING_VALUE",
        //     launchType: "EC2" || "FARGATE" || "EXTERNAL" || "MANAGED_INSTANCES",
        //     capacityProviderStrategy: [ // CapacityProviderStrategy
        //         { // CapacityProviderStrategyItem
        //             capacityProvider: "STRING_VALUE", // required
        //             weight: Number("int"),
        //             base: Number("int"),
        //         },
        //     ],
        //     platformVersion: "STRING_VALUE",
        //     role: "STRING_VALUE",
        //     deploymentConfiguration: { // DeploymentConfiguration
        //         deploymentCircuitBreaker: { // DeploymentCircuitBreaker
        //             enable: true || false, // required
        //             rollback: true || false, // required
        //         },
        //         maximumPercent: Number("int"),
        //         minimumHealthyPercent: Number("int"),
        //         alarms: { // DeploymentAlarms
        //             alarmNames: [ // StringList // required
        //                 "STRING_VALUE",
        //             ],
        //             rollback: true || false, // required
        //             enable: true || false, // required
        //         },
        //         strategy: "ROLLING" || "BLUE_GREEN" || "LINEAR" || "CANARY",
        //         bakeTimeInMinutes: Number("int"),
        //         lifecycleHooks: [ // DeploymentLifecycleHookList
        //             { // DeploymentLifecycleHook
        //                 targetType: "AWS_LAMBDA" || "PAUSE",
        //                 hookTargetArn: "STRING_VALUE",
        //                 roleArn: "STRING_VALUE",
        //                 lifecycleStages: [ // DeploymentLifecycleHookStageList
        //                     "RECONCILE_SERVICE" || "PRE_SCALE_UP" || "POST_SCALE_UP" || "TEST_TRAFFIC_SHIFT" || "POST_TEST_TRAFFIC_SHIFT" || "PRE_PRODUCTION_TRAFFIC_SHIFT" || "PRODUCTION_TRAFFIC_SHIFT" || "POST_PRODUCTION_TRAFFIC_SHIFT",
        //                 ],
        //                 hookDetails: "DOCUMENT_VALUE",
        //                 timeoutConfiguration: { // DeploymentLifecycleHookTimeoutConfiguration
        //                     timeoutInMinutes: Number("int"),
        //                     action: "ROLLBACK" || "CONTINUE",
        //                 },
        //             },
        //         ],
        //         linearConfiguration: { // LinearConfiguration
        //             stepPercent: Number("double"),
        //             stepBakeTimeInMinutes: Number("int"),
        //         },
        //         canaryConfiguration: { // CanaryConfiguration
        //             canaryPercent: Number("double"),
        //             canaryBakeTimeInMinutes: Number("int"),
        //         },
        //     },
        //     placementConstraints: [ // PlacementConstraints
        //         { // PlacementConstraint
        //             type: "distinctInstance" || "memberOf",
        //             expression: "STRING_VALUE",
        //         },
        //     ],
        //     placementStrategy: [ // PlacementStrategies
        //         { // PlacementStrategy
        //             type: "random" || "spread" || "binpack",
        //             field: "STRING_VALUE",
        //         },
        //     ],
        //     networkConfiguration: { // NetworkConfiguration
        //         awsvpcConfiguration: { // AwsVpcConfiguration
        //             subnets: [ // required
        //                 "STRING_VALUE",
        //             ],
        //             securityGroups: [
        //                 "STRING_VALUE",
        //             ],
        //             assignPublicIp: "ENABLED" || "DISABLED",
        //         },
        //     },
        //     healthCheckGracePeriodSeconds: Number("int"),
        //     schedulingStrategy: "REPLICA" || "DAEMON",
        //     deploymentController: { // DeploymentController
        //         type: "ECS" || "CODE_DEPLOY" || "EXTERNAL", // required
        //     },
        //     tags: [ // Tags
        //         { // Tag
        //             key: "STRING_VALUE",
        //             value: "STRING_VALUE",
        //         },
        //     ],
        //     enableECSManagedTags: true || false,
        //     propagateTags: "TASK_DEFINITION" || "SERVICE" || "NONE",
        //     enableExecuteCommand: true || false,
        //     serviceConnectConfiguration: { // ServiceConnectConfiguration
        //         enabled: true || false, // required
        //         namespace: "STRING_VALUE",
        //         services: [ // ServiceConnectServiceList
        //             { // ServiceConnectService
        //                 portName: "STRING_VALUE", // required
        //                 discoveryName: "STRING_VALUE",
        //                 clientAliases: [ // ServiceConnectClientAliasList
        //                     { // ServiceConnectClientAlias
        //                         port: Number("int"), // required
        //                         dnsName: "STRING_VALUE",
        //                         testTrafficRules: { // ServiceConnectTestTrafficRules
        //                             header: { // ServiceConnectTestTrafficHeaderRules
        //                                 name: "STRING_VALUE", // required
        //                                 value: { // ServiceConnectTestTrafficHeaderMatchRules
        //                                     exact: "STRING_VALUE", // required
        //                                 },
        //                             },
        //                         },
        //                     },
        //                 ],
        //                 ingressPortOverride: Number("int"),
        //                 timeout: { // TimeoutConfiguration
        //                     idleTimeoutSeconds: Number("int"),
        //                     perRequestTimeoutSeconds: Number("int"),
        //                 },
        //                 tls: { // ServiceConnectTlsConfiguration
        //                     issuerCertificateAuthority: { // ServiceConnectTlsCertificateAuthority
        //                         awsPcaAuthorityArn: "STRING_VALUE",
        //                     },
        //                     kmsKey: "STRING_VALUE",
        //                     roleArn: "STRING_VALUE",
        //                 },
        //             },
        //         ],
        //         logConfiguration: { // LogConfiguration
        //             logDriver: "json-file" || "syslog" || "journald" || "gelf" || "fluentd" || "awslogs" || "splunk" || "awsfirelens", // required
        //             options: { // LogConfigurationOptionsMap
        //                 "&lt;keys&gt;": "STRING_VALUE",
        //             },
        //             secretOptions: [ // SecretList
        //                 { // Secret
        //                     name: "STRING_VALUE", // required
        //                     valueFrom: "STRING_VALUE", // required
        //                 },
        //             ],
        //         },
        //         accessLogConfiguration: { // ServiceConnectAccessLogConfiguration
        //             format: "TEXT" || "JSON", // required
        //             includeQueryParameters: "DISABLED" || "ENABLED",
        //         },
        //     },
        //     volumeConfigurations: [ // ServiceVolumeConfigurations
        //         { // ServiceVolumeConfiguration
        //             name: "STRING_VALUE", // required
        //             managedEBSVolume: { // ServiceManagedEBSVolumeConfiguration
        //                 encrypted: true || false,
        //                 kmsKeyId: "STRING_VALUE",
        //                 volumeType: "STRING_VALUE",
        //                 sizeInGiB: Number("int"),
        //                 snapshotId: "STRING_VALUE",
        //                 volumeInitializationRate: Number("int"),
        //                 iops: Number("int"),
        //                 throughput: Number("int"),
        //                 tagSpecifications: [ // EBSTagSpecifications
        //                     { // EBSTagSpecification
        //                         resourceType: "volume", // required
        //                         tags: [
        //                             {
        //                                 key: "STRING_VALUE",
        //                                 value: "STRING_VALUE",
        //                             },
        //                         ],
        //                         propagateTags: "TASK_DEFINITION" || "SERVICE" || "NONE",
        //                     },
        //                 ],
        //                 roleArn: "STRING_VALUE", // required
        //                 filesystemType: "ext3" || "ext4" || "xfs" || "ntfs",
        //             },
        //         },
        //     ],
        //     vpcLatticeConfigurations: [ // VpcLatticeConfigurations
        //         { // VpcLatticeConfiguration
        //             roleArn: "STRING_VALUE", // required
        //             targetGroupArn: "STRING_VALUE", // required
        //             portName: "STRING_VALUE", // required
        //         },
        //     ],
        // };
        // const command = new CreateServiceCommand(input);
        // const response = await client.send(command);

    } catch (error) {
        console.log("Error spinning up the user backend service image : ", error);
    }
}