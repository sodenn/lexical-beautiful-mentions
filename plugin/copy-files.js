const path = require("path");
const {
  promises: { access, readFile, writeFile },
} = require("fs");
const glob = require("fast-glob");

async function exists(path) {
  return access(path)
    .then(() => true)
    .catch(() => false);
}

const packagePath = process.cwd();
const rootPath = path.join(packagePath, "..");
const libPath = path.join(packagePath, "lib");
const srcPath = path.join(packagePath, "src");

/**
 * Puts a package.json into every immediate child directory of rootDir.
 * That package.json contains information about esm for bundlers.
 *
 * It also tests that this import can be used in TypeScript by checking
 * if an index.d.ts is present at that path.
 */
async function createModulePackages({ from, to }) {
  const directoryPackages = glob
    .sync("*/index.{js,ts,tsx}", { cwd: from })
    .map(path.dirname);

  await Promise.all(
    directoryPackages.map(async (directoryPackage) => {
      const packageJsonPath = path.join(to, directoryPackage, "package.json");
      const topLevelPathImportsAreEcmaScriptModules = await exists(
        path.resolve(path.dirname(packageJsonPath), "../cjs")
      );

      const packageJson = {
        module: "./index.js",
        main: topLevelPathImportsAreEcmaScriptModules
          ? path.posix.join("../cjs", directoryPackage, "index.js")
          : "./index.js",
        types: "./index.d.ts",
      };

      const [typingsEntryExist, moduleEntryExists, mainEntryExists] =
        await Promise.all([
          exists(
            path.resolve(path.dirname(packageJsonPath), packageJson.types)
          ),
          exists(
            path.resolve(path.dirname(packageJsonPath), packageJson.module)
          ),
          exists(path.resolve(path.dirname(packageJsonPath), packageJson.main)),
          writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2)),
        ]);

      const manifestErrorMessages = [];
      if (!typingsEntryExist) {
        manifestErrorMessages.push(
          `'types' entry '${packageJson.types}' does not exist`
        );
      }
      if (!moduleEntryExists) {
        manifestErrorMessages.push(
          `'module' entry '${packageJson.module}' does not exist`
        );
      }
      if (!mainEntryExists) {
        manifestErrorMessages.push(
          `'main' entry '${packageJson.main}' does not exist`
        );
      }
      if (manifestErrorMessages.length > 0) {
        throw new Error(
          `${packageJsonPath}:\n${manifestErrorMessages.join("\n")}`
        );
      }

      return packageJsonPath;
    })
  );
}

async function createPackageFile() {
  const packageData = await readFile(
    path.resolve(packagePath, "./package.json"),
    "utf8"
  );
  const { scripts, devDependencies, ...packageDataOther } =
    JSON.parse(packageData);

  const dependencies = packageDataOther.dependencies || {};
  Object.keys(dependencies).forEach((pkgName) => {
    const pkgVersion = dependencies[pkgName];
    if (pkgVersion === "workspace:*") {
      dependencies[pkgName] = packageDataOther.version;
    }
  });

  const newPackageData = {
    ...packageDataOther,
    main: "./cjs/index.js",
    module: "./index.js",
    types: "./index.d.ts",
  };

  const targetPath = path.resolve(libPath, "./package.json");

  await writeFile(targetPath, JSON.stringify(newPackageData, null, 2), "utf8");
}

async function addFiles() {
  await Promise.all(
    ["./LICENSE", "./README.md"].map(async (file) => {
      const data = await readFile(path.resolve(rootPath, file), "utf8");
      return writeFile(path.resolve(libPath, file), data, "utf8");
    })
  );
}

async function run() {
  try {
    await createPackageFile();
    await addFiles();
    await createModulePackages({ from: srcPath, to: libPath });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
