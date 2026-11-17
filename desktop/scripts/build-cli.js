import { execFileSync } from "node:child_process";
import { join } from "node:path";

const cliRoot = join(import.meta.dirname, "..", "..", "apps", "cli");
const platform = process.argv.find((arg) => arg.startsWith("--platform="))?.slice(11) ?? process.platform;
const arches = process.argv.includes("--all") ? (platform === "win32" ? ["x64"] : ["arm64", "x64"]) : [process.arch];
const bunOs = { darwin: "darwin", linux: "linux", win32: "windows" }[platform];
const executable = platform === "win32" ? "runelay-cli.exe" : "runelay-cli";

for (const arch of arches) {
  execFileSync(
    "bun",
    [
      "build",
      "--compile",
      "--minify",
      `--target=bun-${bunOs}-${arch}`,
      join("src", "index.ts"),
      "--outfile",
      join(import.meta.dirname, "..", "resources", arch, executable),
    ],
    { cwd: cliRoot, stdio: "inherit", shell: process.platform === "win32" },
  );
}
