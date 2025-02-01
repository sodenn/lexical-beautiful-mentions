import { execSync } from "node:child_process";
import path from "node:path";

const libPath = path.join(__dirname, "./lib");

execSync("npm publish", { cwd: libPath, stdio: "inherit" });
