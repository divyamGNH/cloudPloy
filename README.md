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

## Architecture

```
┌──────────────────────────────┐
│      Frontend (React)        │
│  - URL Input Form            │
│  - Status Polling            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   API Server (Node.js)       │
│  - ECS Task Orchestration    │
│  - Deployment Management     │
└────────────┬─────────────────┘
             │
             ├─────────────────────────────┐
             ▼                             ▼
┌────────────────────────┐    ┌──────────────────────────┐
│   Build Server         │    │ Backend Build Server     │
│ - Git Clone            │    │ - Railpack Dockerization │
│ - npm build            │    │ - ECR Push               │
│ - Artifact Upload      │    │ - Image Tagging          │
└────────────────────────┘    └──────────────────────────┘
             │                             │
             └──────────┬──────────────────┘
                        ▼
              ┌──────────────────┐
              │   AWS ECR        │
              │ (Image Registry) │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Reverse Proxy    │
              │ (Traffic Router) │
              └────────┬─────────┘
                       ▼
              ┌──────────────────┐
              │ Deployed Apps    │
              │ (User Projects)  │
              └──────────────────┘
```

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Vite 7.3** - Build tool and dev server
- **Tailwind CSS 4.2** - Styling
- **Axios** - HTTP client for API communication
- **ESLint** - Code quality

### Backend Services
- **Node.js 20** - Runtime
- **Express.js 5** - HTTP server framework
- **AWS SDK** - ECS task management, ECR registry, S3 artifact storage
- **http-proxy** - Request proxying and routing
- **Railpack** - Standardized Docker image building
- **Docker** - Containerization

### Infrastructure
- **AWS ECS Fargate** - Serverless container orchestration
- **AWS ECR** - Container image registry
- **AWS S3** - Build artifact storage
- **Docker** - Container runtime

## Project Structure

```
├── frontend/                 # React application
│   ├── src/
│   │   ├── App.jsx          # Main deployment interface
│   │   └── pages/           # Route components
│   ├── vite.config.js
│   └── package.json
├── api-server/              # Express.js orchestrator
│   ├── index.js            # ECS task coordinator
│   └── package.json
├── build-server/            # First stage build container
│   ├── script.js           # Git clone and npm build
│   ├── Dockerfile
│   └── package.json
├── backend-build-server/    # Second stage Docker builder
│   ├── script.js           # Railpack Docker image creation
│   ├── Dockerfile
│   └── package.json
├── reverse-proxy-service/   # Traffic routing service
│   ├── index.js            # HTTP proxy logic
│   └── package.json
└── railpacks-tester/        # Test environment for Connectly
    └── Connectly/           # Example multi-service application
```

## Deployment Pipeline

### Stage 1: Code Build
1. API Server receives deployment request with GitHub URL
2. ECS Fargate launches `build-server` container with git credentials
3. Build Server clones repository and runs build commands
4. Compiled artifacts uploaded to S3

### Stage 2: Containerization
1. Backend Build Server retrieves artifacts from S3
2. Railpack generates optimized Dockerfile
3. Docker image built with production dependencies
4. Image tagged and pushed to AWS ECR

### Stage 3: Routing
1. Reverse Proxy service registers deployed application
2. Subdomain pattern (projectID.deploymentID) assigned
3. Traffic routed to appropriate container instance

## Getting Started

### Prerequisites
- Node.js 20+
- AWS account with ECS, ECR, and S3 access
- Docker
- Git

### Environment Setup

Each service requires environment variables for AWS access and deployment configuration:

```bash
# API Server
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
ECS_CLUSTER=<cluster-name>
TASK_DEFINITION=<task-definition>

# Build Services
GITHUB_TOKEN=<github-personal-access-token>
ECR_REGISTRY=<registry-url>
AWS_REGION=us-east-1
```

### Local Development

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**API Server**
```bash
cd api-server
npm install
npm start
```

**Reverse Proxy**
```bash
cd reverse-proxy-service
npm install
npm start
```

### Docker Build

Build server containers for deployment:

```bash
docker build -t cloudploy-build-server ./build-server
docker build -t cloudploy-backend-build-server ./backend-build-server
```

Push to AWS ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <registry-url>
docker tag cloudploy-build-server:latest <registry-url>/cloudploy-build-server:latest
docker push <registry-url>/cloudploy-build-server:latest
```

## Key Design Decisions

### Multi-stage Build Process
Separating code compilation and Docker image building allows for:
- Independent scaling of build stages
- Specialized tooling per stage (Node.js vs Docker)
- Failure isolation and retry capability

### AWS ECS Fargate
Serverless container orchestration reduces operational overhead while maintaining:
- Auto-scaling based on task queue depth
- Built-in logging and monitoring
- Security through task IAM roles

### Subdomain-based Routing
Dynamic routing pattern enables:
- Multiple versions of same project
- Isolation between user deployments
- Stateless proxy service

### Limited Credential Scope
Environment variables are explicitly passed to child processes rather than exposing the entire process.env, reducing credential exposure risk.

## Future Enhancements

- TypeScript support for build servers
- Improved error messaging and deployment diagnostics
- AWS CloudFront + Edge Lambda for global content delivery
- Task role migration from injected credentials
- Deployment rollback capability
- Build caching to improve deployment speed
- Webhook integration for automatic redeployment on code push

## Development Notes

### Dependency Security
- Regular npm audit of dependencies
- Automated CVE scanning recommended for production

### Scalability Considerations
- ECS Fargate auto-scaling based on task queue depth
- S3 artifact expiration policies to manage storage
- ECR image lifecycle policies for registry cleanup

### Monitoring
- CloudWatch logs for all ECS tasks
- Deployment status tracking via ProjectID and DeploymentID
- 3-second polling interval for frontend status updates

## License

MIT
