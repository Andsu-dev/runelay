import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app, BrowserWindow, dialog, safeStorage, shell } from "electron";

const PORT = 4312;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const HEALTH_TIMEOUT_MS = 20_000;

let server = null;
let window = null;

const SERVER = process.platform === "win32" ? "runelay-server.exe" : "runelay-server";

const resource = (name) =>
  app.isPackaged ? join(process.resourcesPath, name) : join(import.meta.dirname, "resources", process.arch, name);

const webDist = () => (app.isPackaged ? join(process.resourcesPath, "web") : join(import.meta.dirname, "..", "apps", "web", "dist"));

const generateSecrets = () => ({
  secret: randomBytes(32).toString("hex"),
  setupToken: randomBytes(18).toString("hex"),
});

const loadSecrets = () => {
  const dir = app.getPath("userData");
  mkdirSync(dir, { recursive: true });
  const sealed = join(dir, "secrets.bin");
  const plain = join(dir, "secrets.json");
  const encrypt = safeStorage.isEncryptionAvailable();
  if (existsSync(sealed)) return JSON.parse(safeStorage.decryptString(readFileSync(sealed)));
  const secrets = existsSync(plain) ? JSON.parse(readFileSync(plain, "utf8")) : generateSecrets();
  if (!encrypt) {
    writeFileSync(plain, JSON.stringify(secrets, null, 2), { mode: 0o600 });
    return secrets;
  }
  writeFileSync(sealed, safeStorage.encryptString(JSON.stringify(secrets)), { mode: 0o600 });
  rmSync(plain, { force: true });
  return secrets;
};

const healthy = () =>
  fetch(`${ORIGIN}/health`, { signal: AbortSignal.timeout(1000) })
    .then((response) => response.ok)
    .catch(() => false);

const waitForServer = async () => {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await healthy()) return true;
    if (server?.exitCode !== null) return false;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
};

const startServer = (secrets) => {
  const userData = app.getPath("userData");
  const log = createWriteStream(join(userData, "server.log"), { flags: "a" });
  server = spawn(resource(SERVER), [], {
    env: {
      HOME: process.env.HOME,
      USERPROFILE: process.env.USERPROFILE,
      SYSTEMROOT: process.env.SYSTEMROOT,
      PATH: process.env.PATH,
      RUNELAY_SECRET: secrets.secret,
      RUNELAY_SETUP_TOKEN: secrets.setupToken,
      RUNELAY_DATA: join(userData, "data"),
      RUNELAY_DESKTOP: "true",
      RUNELAY_ENABLE_STDIO: "true",
      WEB_DIST: webDist(),
      PUBLIC_URL: ORIGIN,
      HOST: "127.0.0.1",
      PORT: String(PORT),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.pipe(log);
  server.stderr.pipe(log);
};

const firstScreen = async (secrets) => {
  const setup = await fetch(`${ORIGIN}/v1/setup`)
    .then((response) => response.json())
    .catch(() => null);
  return setup?.data?.needsSetup ? `${ORIGIN}/login?mode=signup&token=${secrets.setupToken}` : ORIGIN;
};

const isInternal = (url) => url === "about:blank" || url.startsWith(ORIGIN);

const createWindow = async (url) => {
  window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "runelay",
    backgroundColor: "#0c0d0f",
    show: false,
  });
  window.webContents.setWindowOpenHandler(({ url: target }) => {
    if (isInternal(target)) return { action: "allow", overrideBrowserWindowOptions: { width: 560, height: 720 } };
    shell.openExternal(target);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, target) => {
    if (isInternal(target)) return;
    event.preventDefault();
    shell.openExternal(target);
  });
  window.once("ready-to-show", () => window?.show());
  window.on("closed", () => {
    window = null;
  });
  await window.loadURL(url);
};

const fail = (message) => {
  dialog.showErrorBox("runelay não abriu", message);
  app.quit();
};

if (!app.requestSingleInstanceLock()) app.quit();

app.on("second-instance", () => {
  if (window?.isMinimized()) window.restore();
  window?.focus();
});

app.whenReady().then(async () => {
  if (await healthy()) {
    return fail(`Já tem um runelay rodando em ${ORIGIN}. Feche o outro (ou o container do Docker) e abra de novo.`);
  }
  let secrets;
  try {
    secrets = loadSecrets();
  } catch {
    return fail("Não consegui ler a chave do runelay no cofre do sistema (Keychain). Abra de novo e permita o acesso quando o sistema pedir.");
  }
  startServer(secrets);
  if (!(await waitForServer())) {
    return fail(`O servidor não subiu. Veja o log em ${join(app.getPath("userData"), "server.log")}.`);
  }
  await createWindow(await firstScreen(secrets));
});

app.on("activate", async () => {
  if (!window && server) await createWindow(ORIGIN);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  server?.kill();
});
