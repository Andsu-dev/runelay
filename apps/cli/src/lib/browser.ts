import { interactive } from "@/lib/terminal";

export const openBrowser = (url: string) => {
  const opener = process.platform === "darwin" ? "open" : process.platform === "linux" ? "xdg-open" : null;
  if (!interactive || !opener || !Bun.which(opener)) return false;
  return Bun.spawnSync([opener, url], { stdout: "ignore", stderr: "ignore" }).exitCode === 0;
};
