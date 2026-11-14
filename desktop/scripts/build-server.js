import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(import.meta.dirname, "..", "..");
const platform = process.argv.find((arg) => arg.startsWith("--platform="))?.slice(11) ?? process.platform;
const arches = process.argv.includes("--all") ? (platform === "win32" ? ["x64"] : ["arm64", "x64"]) : [process.arch];
const bunOs = { darwin: "darwin", linux: "linux", win32: "windows" }[platform];
const executable = platform === "win32" ? "runelay-server.exe" : "runelay-server";

execFileSync("bun", ["run", "build"], { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
for (const arch of arches) {
  execFileSync(
    "bun",
    [
      "build",
      "--compile",
      `--target=bun-${bunOs}-${arch}`,
      "apps/api/src/index.ts",
      "--outfile",
      join(import.meta.dirname, "..", "resources", arch, executable),
    ],
    { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
  );
}
