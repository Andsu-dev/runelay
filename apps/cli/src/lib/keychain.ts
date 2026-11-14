const run = (args: string[]) => {
  const result = Bun.spawnSync(["security", ...args], { stdout: "pipe", stderr: "pipe" });
  return result.exitCode === 0 ? result.stdout.toString() : null;
};

export const listKeychainAccounts = (service: string) => {
  const dump = run(["dump-keychain"]);
  if (!dump) return [];
  return dump.split(/^keychain: /m).flatMap((block) => {
    const serviceMatch = block.match(/"svce"<blob>="([^"]*)"/);
    const account = block.match(/"acct"<blob>="([^"]*)"/)?.[1];
    return serviceMatch?.[1] === service && account ? [account] : [];
  });
};

export const readKeychainSecret = (service: string, account?: string) =>
  run(["find-generic-password", "-s", service, ...(account ? ["-a", account] : []), "-w"])?.trim() ?? null;
