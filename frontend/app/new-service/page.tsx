"use client";

import { useState } from "react";
import axios from "axios";
import { BackendDeploymentResponse } from "@/types/backendDeploymentTypes";

export default function GithubForm() {
  const [githubUrl, setGithubUrl] = useState("");
  const [deployType, setDeployType] = useState<"frontend" | "service">(
    "frontend",
  );
  const [isDeploying, setIsDeploying] = useState(false);
  const [liveUrl, setLiveUrl] = useState("");

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const [runtime, setRuntime] = useState("go");
  const [buildCommand, setBuildCommand] = useState(
    "go build -o server .",
  );
  const [startCommand, setStartCommand] = useState("./server");
  const [projectRoot, setProjectRoot] = useState("/backend");

  async function handleFrontendDeploy() {
    const res = await axios.post(`${BACKEND_URL}/deploy`, {
      githubUrl,
    });

    const { ProjectID, DeploymentID } = res.data;

    setIsDeploying(true);
    setLiveUrl("");

    pollForDeploymentStatus(ProjectID, DeploymentID);
  }

  async function handleServiceDeploy() {
    setIsDeploying(true);
    setLiveUrl("");

    try {
      const payload : BackendDeploymentResponse = {
        GITHUB_URL: githubUrl,
        RUNTIME: runtime,
        BUILD_COMMAND: buildCommand,
        START_COMMAND: startCommand,
        PROJECT_ROOT: projectRoot,
      }
      const res = await axios.post(`${BACKEND_URL}/backend-deploy`, payload);

      console.log(res.data);
      setIsDeploying(false);
    } catch (err) {
      console.error(err);
      setIsDeploying(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!githubUrl.trim()) return;

    if (deployType === "frontend") {
      handleFrontendDeploy();
    } else {
      handleServiceDeploy();
    }
  }

  async function pollForDeploymentStatus(
    projectID: string,
    deploymentID: string,
  ) {
    const res = await axios.get(`${BACKEND_URL}/deploymentStatus`, {
      params: {
        ProjectID: projectID,
        DeploymentID: deploymentID,
      },
    });

    if (res.data.status === "Success") {
      const url = `http://${projectID}.${deploymentID}.localhost:8000`;

      setLiveUrl(url);
      setIsDeploying(false);
      return;
    }

    if (res.data.status === "Failed") {
      setIsDeploying(false);
      return;
    }

    setTimeout(() => {
      pollForDeploymentStatus(projectID, deploymentID);
    }, 3000);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-white text-center">
          Deploy Your Project
        </h1>

        <p className="text-zinc-400 text-center mt-2 mb-8">
          Choose what you want to deploy and paste your GitHub repository.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm text-zinc-300 mb-3 block">
              Deployment Type
            </label>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDeployType("frontend")}
                className={`rounded-xl border p-4 transition ${
                  deployType === "frontend"
                    ? "border-white bg-white text-black"
                    : "border-zinc-700 bg-zinc-800 text-white hover:border-zinc-500"
                }`}
              >
                <div className="text-lg font-semibold">Frontend</div>
                <div className="text-sm opacity-80">
                  Static websites & React apps
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDeployType("service")}
                className={`rounded-xl border p-4 transition ${
                  deployType === "service"
                    ? "border-white bg-white text-black"
                    : "border-zinc-700 bg-zinc-800 text-white hover:border-zinc-500"
                }`}
              >
                <div className="text-lg font-semibold">Service</div>
                <div className="text-sm opacity-80">
                  APIs & backend applications
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-300 mb-2 block">
              GitHub Repository
            </label>

            <input
              type="text"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 outline-none focus:border-white"
            />
          </div>

          <button
            type="submit"
            disabled={isDeploying}
            className="w-full rounded-xl bg-white py-3 font-semibold text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeploying
              ? "Deploying..."
              : `Deploy ${deployType === "frontend" ? "Frontend" : "Service"}`}
          </button>
        </form>

        {isDeploying && (
          <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <p className="text-blue-300">
                Your deployment is in progress. This may take a minute...
              </p>
            </div>
          </div>
        )}

        {!isDeploying && liveUrl && (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-5">
            <h2 className="text-lg font-semibold text-green-400">
              ✅ Deployment Successful
            </h2>

            <p className="mt-2 text-zinc-300">Your project is now live.</p>

            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition hover:bg-green-600"
            >
              Visit Website →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
