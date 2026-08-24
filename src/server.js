import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// If Render's root is set to 'src', this wrapper will delegate to ../backend/server.js
// Ensure CWD is the project root so relative imports inside backend modules resolve reliably.
const projectRoot = path.join(__dirname, "..");
process.chdir(projectRoot);

const backendEntry = path.join(projectRoot, "backend", "server.js");
const backendUrl = pathToFileURL(backendEntry).href;

console.log(`src wrapper: changed CWD to ${process.cwd()} and delegating to backend at ${backendEntry}`);

import(backendUrl)
  .then(() => console.log("Backend started via src wrapper"))
  .catch((err) => {
    console.error("Failed to start backend via src wrapper:", err);
    process.exit(1);
  });
