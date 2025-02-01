import { copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, "..");

async function copyFiles() {
  await Promise.all(
    ["./LICENSE", "./README.md"].map(async (file) => {
      return copyFile(
        path.resolve(rootDir, file),
        path.resolve(__dirname, file),
      );
    }),
  );
}

copyFiles();
