import { spawn, type SpawnOptions } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

function run(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(command, args, options);

    // These are the streams that we need to handle to check all the logs and errors for the spawn process.
    // stdout.on('data')
    // stderr.on('data')
    // p.on('error')
    // p.on('close')

    p.stdout?.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    p.stderr?.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    p.on("spawn", () => {
      console.log(`[SPAWN] ${command}`);
    });

    p.on("error", (err) => {
      //the reject(err) is later caught by the catch block.
      reject(err);
    });

    p.on("exit", (code, signal) => {
      console.log(`[EXIT] code=${code} signal=${signal}`);
    });

    p.on("close", (code, signal) => {
      console.log(`[CLOSE] code=${code} signal=${signal}`);
      if (code !== 0) {
        reject(
          new Error(`${command} ${args.join(" ")} exited with code ${code}`),
        );
      } else {
        resolve();
      }
    });
  });
}

// Returns the env value and if it is empty throws an error.
function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }

  return value;
}

async function init() {
  // TODO : Replace all these env vars with user input.
  const PROJECT_ROOT = requireEnv("PROJECT_ROOT");
  const PROJECT_ID = requireEnv("PROJECT_ID");
  const DEPLOYMENT_ID = requireEnv("DEPLOYMENT_ID");
  const BUILDKIT_HOST = requireEnv("BUILDKIT_HOST");
  // There are a lot of env vars not used here look into that as well.

  const PROJECT_DIRECTORY = `/home/app/output/${PROJECT_ID}-${DEPLOYMENT_ID}/${PROJECT_ROOT}`;

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
      "--plan-out",
      "./railpack-plan.json",
      "--info-out",
      "./railpack-INFO.json",
      PROJECT_DIRECTORY,
    ],
    {},
  );

  // Check if the AWS creds work and i can get the account or not.
  await run("aws", ["sts", "get-caller-identity"], {});

  // Login into AWS before Buildkit so that it can push the image to ECR.
  await run(
    "aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 801795967285.dkr.ecr.ap-south-1.amazonaws.com",
    [],
    { shell: true },
  );

  // Run buildctl to access railpack frontend to contact with buildkit to utilize the railpack prepare outputs to build the image.
  await run(
    "buildctl",
    [
      "--addr",
      BUILDKIT_HOST,
      "build",
      "--frontend",
      "gateway.v0",
      "--opt",
      "source=ghcr.io/railwayapp/railpack-frontend",
      "--local",
      `context=${PROJECT_DIRECTORY}`,
      "--local",
      `dockerfile=${process.cwd()}`,
      // Tell buildkit to directly push the image to ECR.
      "--output",
      `type=image,name=801795967285.dkr.ecr.ap-south-1.amazonaws.com/cloudploy/user-images:${PROJECT_ID}-${DEPLOYMENT_ID},push=true`,
      "--progress",
      "plain",
    ],
    {},
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
