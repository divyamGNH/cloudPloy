import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import dotenv from "dotenv";
import { Console } from "node:console";

dotenv.config();

function run(command, args, options) {
    return new Promise((resolve, reject) => {
        const p = spawn(command, args, options);

        // These are the streams that we need to handle to check all the logs and errors for the spawn process.
        // stdout.on('data')
        // stderr.on('data')
        // p.on('error')
        // p.on('close')

        p.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        p.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        p.on("spawn", () => {
            console.log(`[SPAWN] ${command}`);
        })

        p.on('error', (err) => {
            //the reject(err) is later caught by the catch block.
            reject(err);
        });

        p.on('exit', (code, signal) => {
            console.log(`[EXIT] code=${code} signal=${signal}`);
        })

        p.on('close', (code, signal) => {
            console.log(`[CLOSE] code=${code} signal=${signal}`);
            if (code !== 0) {
                reject(
                    new Error(`${command} ${args.join(" ")} exited with code ${code}`),
                )
            } else {
                resolve();
            }
        });
    });
}

async function init() {
    // TODO : Replace all these env vars with user input.
    const RUNTIME = process.env.RUNTIME;
    const BUILD_COMMAND = process.env.BUILD_COMMAND;
    const START_COMMAND = process.env.START_COMMAND;
    const PROJECT_GIT_URL = process.env.PROJECT_GIT_URL;
    const PROJECT_ROOT = process.env.PROJECT_ROOT;
    const PROJECT_NAME = process.env.PROJECT_NAME;
    const PROJECT_ID = process.env.PROJECT_ID;
    const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;
    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    const BUILDKIT_HOST = process.env.BUILDKIT_HOST;

    const PROJECT_DIRECTORY = `/home/app/output/${PROJECT_NAME}${PROJECT_ROOT}`;

    //spawn(command, [args], [options])
    //args are the arguments split like command + args is the overall commands that we want to run.
    //pass env and cwd as object adn string respectively in [options]

    // Run railpack to generate the railpacks-build plan.
    console.log("Running railpacks for creating the project build plan");
    await run(
        // Add the PATH to railpack to eliminate any PATH issues.
        "/usr/local/bin/railpack",
        [
            "prepare",
            "--plan-out", "./railpack-plan.json",
            "--info-out", "./railpack-INFO.json",
            PROJECT_DIRECTORY
        ],
        {}
    );

    // Check if the AWS creds work and i can get the account or not.
    await run(
        "aws",
        ["sts", "get-caller-identity"],
        {}
    );

    // Login into AWS before Buildkit so that it can push the image to ECR.
    await run(
        "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 801795967285.dkr.ecr.ap-south-1.amazonaws.com",
        [],
        { shell: true }
    );

    // Run buildctl to access railpack frontend to contact with buildkit to utilize the railpack prepare outputs to build the image.
    await run(
        "buildctl",
        [
            "--addr", BUILDKIT_HOST,
            "build",
            "--frontend", "gateway.v0",
            "--opt", "source=ghcr.io/railwayapp/railpack-frontend",
            "--local", `context=${PROJECT_DIRECTORY}`,
            "--local", `dockerfile=${process.cwd()}`,
            // Tell buildkit to directly push the image to ECR.
            "--output",
            `type=image,name=801795967285.dkr.ecr.ap-south-1.amazonaws.com/cloudploy/user-images:${PROJECT_ID}-${DEPLOYMENT_ID},push=true`,
            "--progress", "plain",
        ],
        {}
    );

    //We now have a fully function docker image for the users repository in our ECR now we just need to trigger the ECS to pick up that image and run a ECS service
}

//See this code is ran by the main.sh so we already have the github code in the /home/app/output
async function main() {
    try {
        await init();
        process.exit(0);
    } catch (error) {
        console.log("FATAL ERROR : ", error);
        process.exit(1);
    }
}

main();