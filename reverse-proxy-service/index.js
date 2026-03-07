import express from "express";
import httpProxy from "http-proxy";
import dotenv from "dotenv";

const app = express();
dotenv.config();

const proxy = httpProxy.createProxyServer();

const BASE_URL = process.env.BASE_URL;
const PORT = process.env.PORT;

//We need the projectID to map the user to the correct project
//We generate a projectID per push to the S3 right so basically we will give the user something like projectID.localhost:8000 
//Currently we are using localhost in development code will be changed in prod
//So we will extract the projectID from the link

app.use((req,res)=>{
    const host = req.headers.host; //return the link the user hit for development stage case projectID.localhost:PORT

    const PROJECT_ID = host.split('.')[0];
    console.log(PROJECT_ID);

    const targetServer = `${BASE_URL}/Project:${PROJECT_ID}`;
    console.log(targetServer);
    proxy.web(req, res, { target : targetServer, changeOrigin : true } );
});

//we need to append the url to actually serve the index.html inside the bucket that is why we are appending the url here using the proxyReq event listener to modify the url before the data is actually sent.
proxy.on('proxyReq', (proxyReq, req, res)=>{
  const url = req.url;
//   const path = req.path;
//   console.log(url);
//   console.log(path);
  if(url=== '/'){
    proxyReq.path += 'index.html'
  }else if(!url.includes('.')){
    //http://ProjectID.localhost:PORT/projects
    // this is req url we actually are getting here 

    // proxyReq.path = '/index.html'
    //This wont work as it is somehow replacing the bucket name and S3 thinks bucket is named index.html that is why the below code works.

    //whatever we get like /project or /abc/123 must be replaced to index.html as the html file is single and the page change is handled by react/js that is we need to redirect any request directly to index.html only.
    proxyReq.path = proxyReq.path.replace(url, '/index.html');
  }

  //requests like /index.js or /main.css or /image.png that means anything that is not a route req must not be relpaced and go as it is as they are real files with in the S3 bucket.
});

app.listen(PORT,()=>{
    console.log(`Proxy server running on PORT:${PORT}`);
})