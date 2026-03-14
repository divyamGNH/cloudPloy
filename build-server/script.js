//various updates needed are can't handle TS and other kinds of project figure out why and add a solution
//DONE -> Look into the mime return null types that might cause an error
//DONE -> add 2 seperate ID's projectid and deploymentid so that we can map different deployments and versions of code to allow handling changes in the code causing a re deployment.
//Keep working

import { execFile } from "node:child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";
import mime from "mime-types";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

//what i have to do here is that i have the git repo cloned right i gotta push it to the S3 bucket so i am gonna need the aws sdk for that

//One update is that remove all these S3 creds from the env and actully declare task roles when we run task in ECS it is secure as then the key injection that access and secret key is handeled by AWS not me so the sensitive env vars are not accessed by the parent and child process at all.
const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

// const id = randomUUID();
// console.log("This project ID is : ", id);

//The bucket s3client is initialized now what we gotta do is that take the git cloned fodler and upload it to S3 bucket.

const Intro = "Hi I am your personal Builder container i will put your code to the bucket !!" 

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const p = execFile(command, args, options);

    p.stdout.on("data", (data) => {
      console.log(data.toString());
    });
    p.stderr.on("data", (data) => {
      console.log(data.toString());
    });

    //We are utilizing try catch "error" means the process could not start at all so the here the error msg/details are already passed to the reject we can console here but instead we will handle it in the catch block and console.log there not here.
    p.on("error", reject);

    p.on("close", (code) => {
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

async function init() {
  console.log("Executing the script.js");
  const PROJECT_ID = process.env.PROJECT_ID;
  const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;
  console.log(`This is the ProjectId : ${PROJECT_ID}`);
  console.log(`This is the DeploymentId : ${DEPLOYMENT_ID}`);

  const outDir = "/home/app/output";
  // const p = exec(`cd ${outDir} && npm install && npm run build`);

  //This is what we pass as the env instead of the whole process.env which can be risky so the parent that is the init run function etc get the whole env but the child process that is the exec and execfile etc get only these mentioned vars instead of the whole process.env
  const safeEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    NODE_ENV: "production",
    //Windows needs these 2 vars as well.
    // APPDATA: process.env.APPDATA,
    // USERPROFILE: process.env.USERPROFILE,
  };

  const isWindows = process.platform === "win32";
  const npmCmd = isWindows ? "npm.cmd" : "npm";

  console.log("Executing npm install");
  await run(npmCmd, ["install"], { cwd: outDir });
  console.log("Executing npm run build");
  await run(npmCmd, ["run", "build"], { cwd: outDir });

  // p.stdout.on("data",(data)=>{
  //     console.log(data.toString());
  // });

  // p.stderr.on("data", (data)=>{
  //     console.log(data.toString());
  // });

  // p.on("error",(err)=>{
  //     console.log("Process failed to start : ", err);
  // })

  //p.on("close", async () => {});

  //When the process is finally completed we gotta now recursively send everything in the dist folder in the S3 bucket thats right we need to push the thing that we built not the actual code the code will be built on our server.

  //We shifted the code logic and added a run() function in order to know when the Execfile function ends that is why we handle all the event listeners on the process inside the run function and put await so the code will automatically always run after the execfile is completed.

  //We could not just await execfile(..) because

  console.log("Build completed ...");
  console.log("Starting to upload on S3 ...");

  const distFolderPath = path.join(outDir, "dist");
  const files = fs.readdirSync(distFolderPath, { recursive: true });

  for (const file of files) {
    const filePath = path.join(distFolderPath, file);

    if (fs.lstatSync(filePath).isDirectory()) continue;

    //Every upload on the bucket must be uniquely identifiable that is why we are using projectId's
    const s3Key = `outputs/Project:${PROJECT_ID}/Deployment:${DEPLOYMENT_ID}/${file}`;

    const gitFilePutObjectCommand = new PutObjectCommand({
      Bucket: "bucket.divyam.vercell",
      Key: s3Key,
      Body: fs.createReadStream(filePath),
      //Mime lookups can return null that is why we return application/octet-stream this is official HTTP way of telling that this is a unknown binary file
      ContentType: mime.lookup(filePath) || "application/octet-stream", //can return null look into that
    });

    //Handle retries here just in case any of the upload fails we must add retries
    await s3Client.send(gitFilePutObjectCommand);
  }

  console.log("Finished uploading the Directory to S3");
}

//can not directly put try catch as init is a async function
async function main() {
  const PROJECT_ID = process.env.PROJECT_ID;
  const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;
  const Backend_URL= process.env.Backend_URL;
  try {
    await init();

    await axios.post(`${Backend_URL}/deploymentComplete`, {
      ProjectID: PROJECT_ID,
      DeploymentID: DEPLOYMENT_ID,
      status: "Success",
    });

    console.log("Called the backend service to notify upload success");
    process.exit(0);
  } catch (err) {
    console.log("FATAL ERROR : ", err);
    await axios.post(`${Backend_URL}/deploymentComplete`, {
      ProjectID: PROJECT_ID,
      DeploymentID: DEPLOYMENT_ID,
      status: "Failed",
    });
    console.log("Called the backend service to notify upload failure");
    process.exit(1);
  }
}

main();
