import { useState } from "react";
import axios from "axios";

export default function GithubForm() {
  const [githubUrl, setGithubUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [liveUrl, setLiveUrl] = useState("");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();

    //Send request to api-server PORT 5000.
    const res = await axios.post("http://localhost:5000/deploy", {
      githubUrl: githubUrl,
    });

    const { ProjectID, DeploymentID } = res.data;

    setIsDeploying(true);
    console.log(isDeploying);
    console.log("Deployment in process");

    pollForDeploymentStatus(ProjectID, DeploymentID);
  };

  async function pollForDeploymentStatus(projectID, deploymentID) {
    const res = await axios.get("http://localhost:5000/deploymentStatus", {
      params: {
        ProjectID: projectID,
        DeploymentID: deploymentID,
      },
    });

    if (res.data.status === "Success") {
      console.log("Project deployed successfully");

      const url = `${BASE_URL}/${projectID}/${deploymentID}`;
      // console.log(url);
      setLiveUrl(url);

      setIsDeploying(false);
      return;
    }

    if (res.data.status === "Failed") {
      console.log("Project deployment failed");
      setIsDeploying(false);
      return;
    }

    setTimeout(() => pollForDeploymentStatus(projectID, deploymentID), 3000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Enter GitHub URL
        </h1>

        <input
          type="text"
          placeholder="https://github.com/username"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-black"
        />

        <button
          type="submit"
          disabled={isDeploying}
          className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
        >
          {isDeploying ? "Deploying..." : "Submit"}
        </button>

        {isDeploying && (
          <p className="text-center mt-4 text-gray-600">
            Deploying your project...
          </p>
        )}

        {liveUrl && (
          <div className="mt-6 text-center">
            <p className="text-green-600 font-semibold">
              Deployment Successful !!!!!
            </p>
            <a
              href={liveUrl}
              target="_blank"
              className="text-blue-600 underline"
            >
              Visit your site
            </a>
          </div>
        )}
      </form>
    </div>
  );
}