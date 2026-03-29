import { spawn } from "node:child_process";


function run(command, args, options) {
    return new Promise((resolve, reject) => {
        const p = spawn(command, args, options);

        //These are the streams that we need to handle to check all the logs and errors for the spawn process.
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

        p.on('error', (err) => {
            //the reject(err) is later caught by the catch block.
            reject(err);
        });

        p.on('close', (code) => {
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
    const RUNTIME = process.env.RUNTIME;
    const BUILD_COMMAND = process.env.BUILD_COMMAND;
    const START_COMMAND = process.env.START_COMMAND;
    const PROJECT_GIT_URL = process.env.PROJECT_GIT_URL;
    const PROJECT_NAME = process.env.PROJECT_NAME;
    const PROJECT_ID = process.env.PROJECT_ID;
    const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

    const PROJECT_DIRECTORY = `/home/app/output/${PROJECT_NAME}`;

    //spawn(command, [args], [options])
    //args are the arguments split like command + args is the overall commands that we want to run.
    //pass env and cwd as object adn string respectively in [options]

    console.log("Running railpacks for building the project image");
    await run(
        "railpack",
        [
            "build",
            "--name", `${PROJECT_ID}-${DEPLOYMENT_ID}`,
            "--build-env", `BUILD_COMMAND=${BUILD_COMMAND}`,
            "--env", `START_COMMAND=${START_COMMAND}`,
        ],
        { cwd: PROJECT_DIRECTORY }
    );

    await run(
        "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 801795967285.dkr.ecr.ap-south-1.amazonaws.com",
        [],
        { shell: true }
    );

    // we already did a railpack build we do not need a docket build
    // await run(`docker build -t ${PROJECT_ID}-${DEPLOYMENT_ID} .`);

    await run("docker", [
        "tag",
        `${PROJECT_ID}-${DEPLOYMENT_ID}`,
        `801795967285.dkr.ecr.ap-south-1.amazonaws.com/cloudploy:${PROJECT_ID}-${DEPLOYMENT_ID}`
    ], {});

    await run("docker", [
        "push",
        `801795967285.dkr.ecr.ap-south-1.amazonaws.com/cloudploy:${PROJECT_ID}-${DEPLOYMENT_ID}`
    ], {});
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
