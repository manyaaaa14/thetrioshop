import path from "path";
import { fileURLToPath } from "url";
import process from "process";

export { default } from "./backend/routes/auth.routes.js";

const currentFile = fileURLToPath(import.meta.url);
const executedFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (executedFile && currentFile === executedFile) {
  import("./server.js");
}
