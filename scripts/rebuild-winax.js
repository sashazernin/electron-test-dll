const { execSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

function getElectronVersion() {
  const pkgPath = join(__dirname, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  const rawVersion =
    (pkg.devDependencies && pkg.devDependencies.electron) ||
    (pkg.dependencies && pkg.dependencies.electron) ||
    (pkg.build && pkg.build.electronVersion);

  if (!rawVersion) {
    console.log(
      "[rebuild-winax] Electron not found in package.json, skipping rebuild.",
    );
    return null;
  }

  const match = String(rawVersion).match(/\d+\.\d+\.\d+/);
  if (!match) {
    console.log(
      `[rebuild-winax] Cannot parse Electron version from "${rawVersion}", skipping rebuild.`,
    );
    return null;
  }

  return match[0];
}

function main() {
  if (process.platform !== "win32") {
    console.log(
      "[rebuild-winax] Non-Windows platform detected, skipping rebuild.",
    );
    return;
  }

  const electronVersion = getElectronVersion();
  if (!electronVersion) {
    return;
  }

  const cmd = [
    "npm",
    "rebuild",
    "winax",
    "--runtime=electron",
    `--target=${electronVersion}`,
    "--dist-url=https://electronjs.org/headers",
    "--build-from-source",
  ].join(" ");

  const projectRoot = join(__dirname, "..");
  console.log(
    `[rebuild-winax] Running: ${cmd} (from project root ${projectRoot})`,
  );

  try {
    execSync(cmd, {
      stdio: "inherit",
      env: process.env,
      shell: true,
      cwd: projectRoot,
    });
    console.log("[rebuild-winax] Rebuild completed successfully.");
  } catch (error) {
    console.error("[rebuild-winax] Rebuild failed:", error.message || error);
    // Do not fail installation completely, just warn.
  }
}

main();
