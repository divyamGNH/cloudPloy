import { exec } from "node:child_process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "node:fs";
import path from "node:path";
// import { readdirSync, lstatSync, createReadStream } from "node:fs";
import mime from "mime-types";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";

dotenv.config();

//what i have to do here is that i have the git repo cloned right i gotta push it to the S3 bucket so i am gonna need the aws sdk for that 

const s3Client = new S3Client({
    region : "ap-south-1",
    credentials : {
        accessKeyId : process.env.ACCESS_KEY_ID,
        secretAccessKey : process.env.SECRET_ACCESS_KEY
    }
});

const id = randomUUID();
console.log("This project ID is : ", id);

//The bucker s3client is initialized now what we gotta do is that take the git cloned fodler and upload it to S3 bucket.

function init(){
    console.log("Executing the script.js");

    const outDir = "/home/app/output";
    const p = exec(`cd ${outDir} && npm install && npm run build`);

    p.stdout.on("data",(data)=>{
        console.log(data.toString());
    });

    p.stderr.on("data", (data)=>{
        console.log(data.toString());
    });

    p.on("error",(err)=>{
        console.log("Process failed to start : ", err);
    })

    p.on("close", async()=>{
        //When the process is finally completed we gotta now recursively send everything in the dist folder in the S3 bucket thats right we need to push the thing that we built not the actual code the code will be built on our server.

        console.log("Build complete.");
        console.log("Starting to upload on S3");

        const distFolderPath = path.join(outDir, 'dist');
        const files = fs.readdirSync(distFolderPath, {recursive : true});

        for(const file of files){
            const filePath = path.join(distFolderPath, file);

            if(fs.lstatSync(filePath).isDirectory()) continue;

            //Every upload on the bucket must be uniquely identifiable that is why we are using projectId's
            const s3Key = `outputs/Project:${id}/${file}`;

            const gitFilePutObjectCommand = new PutObjectCommand({
                Bucket : "bucket.divyam.vercell",
                Key : s3Key,
                Body : fs.createReadStream(filePath),
                ContentType : mime.lookup(filePath) //can return null look into that 
            });

            await s3Client.send(gitFilePutObjectCommand);
        }

        console.log("Finished uploading the Directory to S3");
    })
}

init();
