# CloudPloy

A deployment platform that turns GitHub repositories into live web applications automatically. Submit a GitHub URL and CloudPloy handles everything—cloning code, building, containerizing, and deploying to AWS.

## What It Does

CloudPloy automates the entire journey from code to production. It's designed to work like Vercel or Heroku but built from the ground up with a multi-stage pipeline.

## Key Features

- **One-Click Deployment** – Submit a GitHub URL and get a live app
- **Automatic Build Pipeline** – Handles npm install, build, and containerization
- **Multi-Stage Processing** – Separate stages for compiling code and creating Docker images
- **Version Tracking** – Keep multiple versions of your project live simultaneously
- **Live Routing** – Each deployment gets its own subdomain automatically
- **Scalable Architecture** – Built on AWS ECS Fargate for automatic scaling

## How It Works

```
GitHub URL submitted → API processes request → Build container clones code
→ Code is compiled → Docker image created → Image pushed to AWS registry
→ Traffic routed to new deployment → App goes live
```

**Three Simple Stages:**
1. **Build** – Clone repo, run `npm install` and `npm run build`
2. **Containerize** – Create a Docker image and push it to AWS
3. **Route** – Set up live traffic routing to the new deployment

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Servers** | Node.js 20, Express.js |
| **Building** | Docker, Railpack |
| **Cloud** | AWS ECS Fargate, AWS ECR, AWS S3 |

## Project Layout

```
frontend/                   # React UI – GitHub URL input & status
api-server/                 # Main orchestrator – handles deployment requests
build-server/              # Compiles your code (npm install/build)
backend-build-server/      # Creates Docker images
reverse-proxy-service/     # Routes traffic to live deployments
railpacks-tester/          # Example test applications
```

## Deployment Flow

**Stage 1: Build**
- API receives GitHub URL
- Build container clones your repository
- Runs `npm install` and `npm run build`
- Saves compiled code to cloud storage (S3)

**Stage 2: Containerize**
- Docker image is created with your compiled code
- Image is pushed to AWS ECR (image registry)
- Ready for deployment

**Stage 3: Deploy**
- Traffic router registers your app with a live subdomain
- Incoming requests routed to your deployment
- App is now live on the internet

## Quick Start

### Requirements
- Node.js 20+
- Docker
- AWS account (ECS, ECR, S3)
- Git

### Environment Variables

Create `.env` files in each service directory:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
GITHUB_TOKEN=your_github_token
ECR_REGISTRY=your_ecr_url
```

### Run Locally

**Frontend**
```bash
cd frontend
npm install && npm run dev
```

**API Server**
```bash
cd api-server
npm install && npm start
```

**Reverse Proxy**
```bash
cd reverse-proxy-service
npm install && npm start
```

### Deploy Servers to AWS

Build Docker images:
```bash
docker build -t cloudploy-build-server ./build-server
docker build -t cloudploy-backend-build-server ./backend-build-server
```

Push to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <registry-url>
docker tag cloudploy-build-server:latest <registry-url>/cloudploy-build-server:latest
docker push <registry-url>/cloudploy-build-server:latest
```

## Why This Architecture?

**Multi-Stage Builds**
- Each stage can run independently and scale separately
- Failures in one stage don't block the other
- Specialized tools for each job (Node vs Docker)

**AWS ECS Fargate**
- Runs containers without managing servers
- Automatically scales based on demand
- Built-in security and monitoring

**Subdomain Routing**
- Each deployment gets its own URL
- Multiple versions can run simultaneously
- No conflicts between projects

**Security**
- Only necessary credentials passed to processes
- No full environment exposure
- Clear separation of concerns

## Next Steps

- TypeScript support for build servers
- Automatic redeployment on code push (webhooks)
- Build caching for faster deployments
- Rollback to previous versions
- Better error messages and logs
- Global CDN with AWS CloudFront
- Improved security with AWS task roles

<!-- ## Maintenance

**Security**
- Run `npm audit` regularly to check for vulnerabilities
- Keep dependencies up to date

**Scaling**
- ECS automatically scales build containers as demand increases
- S3 stores old artifacts; set expiration policies to save cost
- ECR stores Docker images; clean up old versions regularly

**Monitoring**
- CloudWatch tracks all server logs
- Each deployment gets a unique ID for tracking
- Frontend checks deployment status every 3 seconds -->
