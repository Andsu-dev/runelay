import { join } from "node:path";

const TARGETS = ["darwin-arm64", "darwin-x64", "linux-x64", "linux-arm64"] as const;

const root = join(import.meta.dir, "../..");
const only = process.argv[2];

for (const target of TARGETS.filter((name) => !only || name === only)) {
  const outfile = join(root, "dist/cli", `runelay-${target}`);
  const built = Bun.spawnSync(
    [
      "bun",
      "build",
      join(import.meta.dir, "src/index.ts"),
      "--compile",
      "--minify",
      `--target=bun-${target}`,
      "--outfile",
      outfile,
    ],
    { stdout: "inherit", stderr: "inherit", cwd: import.meta.dir },
  );
  if (built.exitCode !== 0) process.exit(built.exitCode ?? 1);
}
