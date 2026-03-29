# CloudPloy

**A GitHub-to-Live deployment platform.** Paste a GitHub URL, and CloudPloy automatically builds, packages, and deploys your app to the cloud. Like Vercel or Heroku, but we built it ourselves.

> **Status:** In active development. Core deployment pipeline works. Still building out error handling and monitoring.

## What It Does

1. You paste a GitHub link
2. CloudPloy clones your code
3. Builds it (runs npm install, npm build, etc.)
4. Wraps it in a Docker container
5. Pushes it to AWS
6. Gives you a live URL

That's it.

<div style="display: flex; gap: 20px; margin: 20px 0;">
<div style="flex: 1; padding: 16px; background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
<strong>Working Now</strong>

- Auto-builds and deploys any npm project
- Containers run on AWS (no managing servers)
- Each deployment gets its own subdomain
- Works with multiple projects
</div>
<div style="flex: 1; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
<strong>Coming Soon</strong>

- Better error messages when builds fail
- Rollback to previous versions
- Faster builds with caching
- Automatic builds when you push to GitHub
- TypeScript build support
- Deployment history dashboard

## How It Works

<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; color: white;">

```
User clicks "Deploy"
       ↓
Frontend sends GitHub URL
       ↓
  API Server (brain)
       ↓
┌─────────────────┐
│ Build Container │
│ Clones your     │
│ code & builds   │
└─────────────────┘
       ↓
┌─────────────────┐
│ Docker Package  │
│ Containerize    │
│ Upload to AWS   │
└─────────────────┘
       ↓
┌─────────────────┐
│ Reverse Proxy   │
│ Route traffic   │
└─────────────────┘
       ↓
   Your app live
```

</div>

## System Architecture

<div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│                  (React Dashboard)                              │
│              "Paste GitHub URL & Deploy"                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Request
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    API SERVER                                   │
│              (Orchestrates Everything)                          │
│            Receives deploy request                              │
│            Triggers AWS ECS tasks                               │
└────────────┬──────────────────────────┬────────────────────────┘
             │                          │
    ┌────────┴────┐          ┌──────────┴──────────┐
    │             │          │                     │
    ↓             ↓          ↓                     ↓
┌─────────┐  ┌──────┐  ┌──────────────┐  ┌────────────────┐
│  Build  │  │Polls │  │   Backend    │  │  Reverse Proxy │
│ Server  │  │Stats │  │Build Server  │  │  (Routes Live) │
│         │  │      │  │              │  │                │
│- Clone  │  └──────┘  │- Railpack    │  │- Listens for   │
│- Build  │            │- Docker      │  │  deployments   │
│- Upload │            │- ECR Push    │  │- Routes traffic│
│  to S3  │            │              │  │                │
└────┬────┘            └──────┬───────┘  └────────┬───────┘
     │                        │                   │
     │                        ↓                   │
     │                  ┌──────────────┐          │
     │                  │  AWS ECR     │          │
     │                  │ (Image Store)│          │
     │                  └──────┬───────┘          │
     │                         │                  │
     └────────────┬────────────┘                  │
                  │                               │
                  ↓                               ↓
          ┌─────────────────────────────────────────┐
          │      DEPLOYED APPLICATIONS             │
          │  (Running Containers on AWS)           │
          │  Accessible via unique subdomains      │
          └─────────────────────────────────────────┘
```

</div>

## Tech Stack

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
<tr style="background-color: #f3f4f6;">
  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold; width: 25%;">Frontend</td>
  <td style="padding: 12px; border: 1px solid #e5e7eb;">React + Vite (fast, modern, responsive)</td>
</tr>
<tr>
  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Backend</td>
  <td style="padding: 12px; border: 1px solid #e5e7eb;">Node.js + Express (lightweight API)</td>
</tr>
<tr style="background-color: #f3f4f6;">
  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Containers</td>
  <td style="padding: 12px; border: 1px solid #e5e7eb;">Docker + Railpack (standardized builds)</td>
</tr>
<tr>
  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Cloud</td>
  <td style="padding: 12px; border: 1px solid #e5e7eb;">AWS ECS + ECR (managed infrastructure)</td>
</tr>
<tr style="background-color: #f3f4f6;">
  <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">Storage</td>
  <td style="padding: 12px; border: 1px solid #e5e7eb;">AWS S3 (build files and artifacts)</td>
</tr>
</table>

## Project Layout

```
frontend/              → React dashboard (what you see)
api-server/            → Heart of the system (talks to everything)
build-server/          → Gets your code, builds it
backend-build-server/  → Creates Docker images
reverse-proxy-service/ → Routes live traffic
railpacks-tester/      → Test app for trying things out
```

## How Deployment Works (The Flow)

**Step 1: You Submit a Repo**
- Go to the dashboard
- Paste your GitHub URL
- Click deploy

**Step 2: Code Gets Built**
- We spin up a container in AWS
- Clone your repository
- Install dependencies (npm install)
- Build your app (npm run build)
- Upload artifacts to AWS S3

**Step 3: We Package It Up**
- Create a Docker image from your built code
- This includes everything your app needs to run
- Upload the image to AWS ECR (container registry)

**Step 4: Traffic Starts Flowing**
- Reverse proxy detects your new deployment
- Assigns a unique URL to your app
- Routes incoming traffic there
- Your app is live

## Getting Started

**What you need:**
- Node.js 20 or newer
- Docker installed
- An AWS account (free tier works)
- Git

### Run It Locally

**Frontend (Dashboard)**
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

**API Server**
```bash
cd api-server
npm install
npm start
# Runs on port 3001
```

**Reverse Proxy (Routes traffic)**
```bash
cd reverse-proxy-service
npm install
npm start
# Runs on port 3000
```

### AWS Setup (Needed for actual deployments)

This is still a work in progress. For now, you'll need:

```bash
# Create .env files in each service with:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key-here
AWS_SECRET_ACCESS_KEY=your-secret-here
ECS_CLUSTER=your-cluster-name
ECR_REGISTRY=your-registry-url
GITHUB_TOKEN=your-github-token
```

**We're working on:** Better AWS setup docs, automated configuration, local testing mode without AWS.

## Tech Stack Explained Simply

- **React**: The dashboard you see
- **Node.js + Express**: The server that makes everything talk to each other  
- **AWS ECS**: Runs containers on the cloud (no servers to manage)
- **Docker**: Packages everything into a container
- **ECR**: Stores your app's images

## Why We Built It This Way

**Two-Stage Build Process**
- First container: Gets your code, runs the build
- Second container: Wraps it up in Docker
- Why? So we can scale each part separately. If lots of people are deploying, we spin up more build containers.

**AWS ECS (Not managing servers)**
- We don't have to worry about which physical servers to run on
- AWS handles that for us
- Automatically scales up/down based on demand

**Subdomain Routing**
- Each project gets its own unique URL
- Like: myproject.deployment1.example.com
- Keeps everything isolated and simple

## Known Limitations & Roadmap

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">

<div style="padding: 16px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
<strong style="color: #991b1b;">Security (In Progress)</strong>

- Currently storing AWS credentials in env files
- Goal: Use AWS IAM roles instead
- Timeline: Planning next quarter
</div>

<div style="padding: 16px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
<strong style="color: #991b1b;">Monitoring (Not Yet)</strong>

- No visibility into live deployment activity
- Build errors need better messaging
- Next step: Real-time logs dashboard
</div>

</div>

<div style="background: #f0f9ff; padding: 16px; border-radius: 4px; border: 1px solid #bfdbfe; margin: 20px 0;">
<strong>Building Next</strong>

- Automatic redeploys on GitHub push
- Deployment rollback functionality
- Build caching for speed
- TypeScript build support
- Webhook notifications
- Deployment history dashboard
- Environment variable UI management
</div>

## Architecture Decisions

**Why Split Into Multiple Services?**
- Each one does one job
- If one breaks, others keep running
- Easy to debug and test each part

**Why AWS?**
- ECR for managing Docker images
- ECS for running containers
- S3 for storing build artifacts
- It scales automatically

**Why Docker?**
- Package code + dependencies together
- Same environment everywhere (local dev, AWS, etc.)
- Easy to upgrade or roll back

## Contributing

Want to help? Start here:

1. Pick something from the "Features We're Building" list
2. Fork/branch, make changes
3. Test locally
4. Submit a PR with what you built

Areas we need help with:
- Error handling and recovery
- Better AWS setup documentation
- Monitoring and logging
- Frontend polish
- API improvements

## Development Tips

**Running everything locally:**
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: API Server
cd api-server && npm start

# Terminal 3: Reverse Proxy
cd reverse-proxy-service && npm start
```

Then go to http://localhost:5173 and test the dashboard.

**Debugging deployments:**
- Check if services are running: `ps aux | grep node`
- API Server logs: `cd api-server && npm start`
- Build Server logs: Check AWS CloudWatch

## What's Next?

We're focusing on:
1. Better error messages (in progress)
2. Making AWS setup easier
3. Adding real-time deployment logs
4. Building the deployment history dashboard

Questions? Open an issue or check existing ones for solutions.

