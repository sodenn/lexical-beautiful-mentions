import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");
const libDir = path.join(__dirname, "lib");

async function copyFiles() {
  await Promise.all(
    [
      "./package.json",
      path.resolve(rootDir, "./LICENSE"),
      path.resolve(rootDir, "./README.md"),
    ].map(async (file) => {
      return copyFile(file, path.resolve(libDir, file));
    }),
  );
}

copyFiles();
