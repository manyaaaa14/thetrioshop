import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Wrapper entry that forwards execution to backend/server.js regardless of CWD.
// This prevents ERR_MODULE_NOT_FOUND when the host runs `node server.js` from
// a different working directory (e.g., Render using /opt/render/project/src).

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the backend entry relative to this file's directory.
const backendEntry = path.join(__dirname, "backend", "server.js");
const backendUrl = pathToFileURL(backendEntry).href;

console.log(`Wrapper: delegating to backend at ${backendEntry}`);

import(backendUrl)
  .then(() => console.log("Backend started via wrapper"))
  .catch((err) => {
    console.error("Failed to start backend via wrapper:", err);
    process.exit(1);
  });
