import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  Notification,
  nativeImage,
  nativeTheme,
  safeStorage,
  shell,
  Tray,
} from "electron";

const PORT = 4312;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const HEALTH_TIMEOUT_MS = 20_000;
const PROBE_TIMEOUT_MS = 6_000;
const STOP_TIMEOUT_MS = 5_000;
const HANDOFF_TIMEOUT_MS = 4_000;
const FADE_MS = 220;
const FADE_STEPS = 12;
const MAX_URL_LENGTH = 2048;
const MAX_NAME_LENGTH = 60;
const MAX_ID_LENGTH = 64;
const PLAIN_HTTP_HOSTS = new Set(["localhost", "127.0.0.1"]);
const LOCAL_SERVER = Object.freeze({ id: "local", name: "Este computador", kind: "local" });
const HIDDEN_FLAG = "--hidden";
const TRAY_ICON_SIZE = { darwin: 18, win32: 16, linux: 22 };
const TRAY_PLACE = process.platform === "darwin" ? "na barra de menus" : "na bandeja do sistema";

const ERRORS = {
  invalidUrl: "Endereço inválido. Use algo como https://runelay.exemplo.com.",
  insecureUrl: "Use https. Endereço http só vale para localhost, 127.0.0.1 ou .ts.net.",
  unreachable: "Não achei um servidor runelay nesse endereço. Confira o endereço e se o servidor está no ar.",
  invalidRequest: "Pedido inválido.",
  invalidName: "O nome precisa ter de 1 a 60 caracteres.",
  duplicate: "Esse servidor já está na lista.",
  notFound: "Servidor não encontrado.",
  renameLocal: "O servidor deste computador não pode ser renomeado.",
  removeLocal: "O servidor deste computador não pode ser removido.",
  removeActive: "Troque para outro servidor antes de remover este.",
  startupFailed: "Não consegui mudar a inicialização com o sistema.",
};

let server = null;
let window = null;
let chooser = null;
let config = null;
let home = null;
let activeOrigin = null;
let failurePromptOpen = false;
let handoff = null;
let tray = null;
let pendingEntry = null;

const SERVER = process.platform === "win32" ? "runelay-server.exe" : "runelay-server";

const appFile = (...parts) => join(import.meta.dirname, ...parts);

const devIcon = () => appFile("build", "icon.png");

const windowIcon = () => (app.isPackaged || process.platform === "darwin" ? undefined : devIcon());

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

const fade = async (target, from, to) => {
  if (!target || target.isDestroyed()) return;
  for (let step = 1; step <= FADE_STEPS; step += 1) {
    await wait(FADE_MS / FADE_STEPS);
    if (target.isDestroyed()) return;
    target.setOpacity(from + ((to - from) * step) / FADE_STEPS);
  }
};

const resource = (name) =>
  app.isPackaged ? join(process.resourcesPath, name) : join(import.meta.dirname, "resources", process.arch, name);

const webDist = () => (app.isPackaged ? join(process.resourcesPath, "web") : join(import.meta.dirname, "..", "apps", "web", "dist"));

const securePreferences = (preload) => ({
  preload,
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
});

const configPath = () => join(app.getPath("userData"), "config.json");

const prefsPath = () => join(app.getPath("userData"), "desktop-prefs.json");

const readPrefs = () => {
  try {
    const stored = JSON.parse(readFileSync(prefsPath(), "utf8"));
    return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  } catch {
    return {};
  }
};

const writePrefs = (patch) => {
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(prefsPath(), JSON.stringify({ ...readPrefs(), ...patch }, null, 2), { mode: 0o600 });
};

const launchArgs = () => (app.isPackaged ? [HIDDEN_FLAG] : [app.getAppPath(), HIDDEN_FLAG]);

const autostartPath = () =>
  join(process.env.XDG_CONFIG_HOME || join(app.getPath("home"), ".config"), "autostart", "runelay.desktop");

const quoteExec = (value) =>
  `"${value
    .replace(/["`$\\]/g, (char) => `\\${char}`)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "%%")}"`;

const autostartEntry = () =>
  [
    "[Desktop Entry]",
    "Type=Application",
    "Name=runelay",
    `Exec=${[process.env.APPIMAGE ?? process.execPath, ...launchArgs()].map(quoteExec).join(" ")}`,
    "Terminal=false",
    "X-GNOME-Autostart-enabled=true",
    "",
  ].join("\n");

const readOpenAtLogin = () => {
  try {
    if (process.platform === "linux") return existsSync(autostartPath());
    return app.getLoginItemSettings({ args: launchArgs() }).openAtLogin;
  } catch {
    return false;
  }
};

const writeOpenAtLogin = (enabled) => {
  if (process.platform !== "linux") return app.setLoginItemSettings({ openAtLogin: enabled, args: launchArgs() });
  const file = autostartPath();
  if (!enabled) return rmSync(file, { force: true });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, autostartEntry(), { mode: 0o644 });
};

const openedHidden = () =>
  process.argv.includes(HIDDEN_FLAG) || (process.platform === "darwin" && app.getLoginItemSettings().wasOpenedAtLogin);

const parseServerUrl = (raw) => {
  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { error: ERRORS.invalidUrl };
  }
  if (parsed.username || parsed.password) return { error: ERRORS.invalidUrl };
  const plainAllowed = PLAIN_HTTP_HOSTS.has(parsed.hostname) || parsed.hostname.endsWith(".ts.net");
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && plainAllowed)) return { error: ERRORS.insecureUrl };
  return { url: `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}` };
};

const readName = (value) => {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name.length >= 1 && name.length <= MAX_NAME_LENGTH ? name : null;
};

const defaultName = (url) => new URL(url).hostname.slice(0, MAX_NAME_LENGTH);

const readId = (value) => (typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH ? value : null);

const readRemote = (entry) => {
  if (!entry || entry.kind !== "remote" || !readId(entry.id) || entry.id === LOCAL_SERVER.id) return null;
  if (typeof entry.url !== "string") return null;
  const parsed = parseServerUrl(entry.url);
  if (parsed.error) return null;
  return { id: entry.id, name: readName(entry.name) ?? defaultName(parsed.url), kind: "remote", url: parsed.url };
};

const buildConfig = (remotes, active) => {
  const servers = [LOCAL_SERVER];
  for (const remote of remotes) {
    if (servers.some((entry) => entry.id === remote.id || entry.url === remote.url)) continue;
    servers.push(remote);
  }
  return { active: servers.some((entry) => entry.id === active) ? active : LOCAL_SERVER.id, servers };
};

const migrateConfig = (stored) => {
  if (stored?.mode === "local") return buildConfig([], LOCAL_SERVER.id);
  if (stored?.mode === "remote") {
    const remote = readRemote({ id: randomUUID(), kind: "remote", url: stored.url });
    return remote ? buildConfig([remote], remote.id) : null;
  }
  if (!Array.isArray(stored?.servers)) return null;
  return buildConfig(stored.servers.map(readRemote).filter(Boolean), stored.active);
};

const writeConfig = (next) => {
  mkdirSync(app.getPath("userData"), { recursive: true });
  writeFileSync(configPath(), JSON.stringify(next, null, 2), { mode: 0o600 });
};

const readConfig = () => {
  let stored;
  try {
    stored = JSON.parse(readFileSync(configPath(), "utf8"));
  } catch {
    return null;
  }
  const next = migrateConfig(stored);
  if (next && JSON.stringify(next) !== JSON.stringify(stored)) writeConfig(next);
  return next;
};

const saveConfig = (next) => {
  writeConfig(next);
  config = next;
  Menu.setApplicationMenu(buildMenu());
};

const activeServer = () => config.servers.find((entry) => entry.id === config.active) ?? LOCAL_SERVER;

const findServer = (id) => config.servers.find((entry) => entry.id === id) ?? null;

const findByUrl = (url) => config?.servers.find((entry) => entry.url === url) ?? null;

const isLocalActive = () => Boolean(config) && activeServer().kind === "local";

const runsInBackground = () => Boolean(config) && Boolean(tray);

const isRunelayServer = async (base) => {
  const signal = AbortSignal.timeout(PROBE_TIMEOUT_MS);
  const health = await fetch(`${base}/health`, { signal })
    .then(async (response) => response.ok && (await response.text()).trim() === "ok")
    .catch(() => false);
  if (health) return true;
  return fetch(`${base}/v1/setup`, { signal })
    .then((response) => response.status === 401)
    .catch(() => false);
};

const resolveRemoteUrl = async (raw) => {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_URL_LENGTH) return { error: ERRORS.invalidRequest };
  const parsed = parseServerUrl(raw);
  if (parsed.error) return parsed;
  if (findByUrl(parsed.url)) return { error: ERRORS.duplicate };
  if (!(await isRunelayServer(parsed.url))) return { error: ERRORS.unreachable };
  return parsed;
};

const hasOnlyKeys = (input, allowed) =>
  Boolean(input) && typeof input === "object" && !Array.isArray(input) && Object.keys(input).every((key) => allowed.includes(key));

const resolveChoice = async (input) => {
  if (!hasOnlyKeys(input, ["mode", "url"])) return { error: ERRORS.invalidRequest };
  if (input.mode === "local" && input.url === undefined) return { config: buildConfig([], LOCAL_SERVER.id) };
  if (input.mode !== "remote") return { error: ERRORS.invalidRequest };
  const result = await resolveRemoteUrl(input.url);
  if (result.error) return result;
  const remote = { id: randomUUID(), name: defaultName(result.url), kind: "remote", url: result.url };
  return { config: buildConfig([remote], remote.id) };
};

const isFromWindow = (event, target) =>
  Boolean(target && !target.isDestroyed() && event.sender === target.webContents && event.senderFrame && !event.senderFrame.parent);

const isFromMainWindow = (event) => {
  if (!config || !isFromWindow(event, window)) return false;
  try {
    return new URL(event.senderFrame.url).origin === activeOrigin;
  } catch {
    return false;
  }
};

const stopServer = () =>
  new Promise((resolve) => {
    if (!server || server.exitCode !== null || server.signalCode !== null) return resolve();
    const timer = setTimeout(resolve, STOP_TIMEOUT_MS);
    server.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    server.kill();
  });

const relaunch = async () => {
  await stopServer();
  app.relaunch();
  app.exit(0);
};

const activateServer = async (id) => {
  if (!config || id === config.active || !findServer(id)) {
    if (config) Menu.setApplicationMenu(buildMenu());
    return;
  }
  saveConfig({ ...config, active: id });
  await relaunch();
};

const serverMenu = () => ({
  label: "Servidor",
  submenu: config.servers.map((entry) => ({
    label: entry.name,
    type: "radio",
    checked: entry.id === config.active,
    click: () => activateServer(entry.id),
  })),
});

function buildMenu() {
  const servers = config ? [serverMenu(), { type: "separator" }] : [];
  if (process.platform === "darwin") {
    return Menu.buildFromTemplate([
      {
        label: app.name,
        submenu: [
          { role: "about" },
          { type: "separator" },
          ...servers,
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      { role: "fileMenu" },
      { role: "editMenu" },
      { role: "viewMenu" },
      { role: "windowMenu" },
    ]);
  }
  return Menu.buildFromTemplate([
    { label: "Arquivo", submenu: [...servers, { role: "quit" }] },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ]);
}

const guard = (handler) => (event, ...args) => {
  if (!isFromMainWindow(event)) throw new Error("forbidden");
  return handler(...args);
};

const registerBridge = () => {
  ipcMain.handle(
    "runelay:list-servers",
    guard(() => ({
      active: config.active,
      servers: config.servers.map(({ id, name, kind, url }) => ({ id, name, kind, url: url ?? null })),
    })),
  );
  ipcMain.handle(
    "runelay:add-server",
    guard(async (input) => {
      if (!hasOnlyKeys(input, ["name", "url"])) return { error: ERRORS.invalidRequest, id: null };
      const name = input.name === undefined ? undefined : readName(input.name);
      if (name === null) return { error: ERRORS.invalidName, id: null };
      const result = await resolveRemoteUrl(input.url);
      if (result.error) return { error: result.error, id: null };
      if (findByUrl(result.url)) return { error: ERRORS.duplicate, id: null };
      const remote = { id: randomUUID(), name: name ?? defaultName(result.url), kind: "remote", url: result.url };
      saveConfig({ ...config, servers: [...config.servers, remote] });
      return { error: null, id: remote.id };
    }),
  );
  ipcMain.handle(
    "runelay:switch-server",
    guard(async (id) => {
      if (!readId(id) || !findServer(id)) return { error: ERRORS.notFound };
      await activateServer(id);
      return { error: null };
    }),
  );
  ipcMain.handle(
    "runelay:rename-server",
    guard((id, rawName) => {
      if (!readId(id) || !findServer(id)) return { error: ERRORS.notFound };
      if (id === LOCAL_SERVER.id) return { error: ERRORS.renameLocal };
      const name = readName(rawName);
      if (!name) return { error: ERRORS.invalidName };
      saveConfig({ ...config, servers: config.servers.map((entry) => (entry.id === id ? { ...entry, name } : entry)) });
      return { error: null };
    }),
  );
  ipcMain.handle(
    "runelay:remove-server",
    guard((id) => {
      if (!readId(id) || !findServer(id)) return { error: ERRORS.notFound };
      if (id === LOCAL_SERVER.id) return { error: ERRORS.removeLocal };
      if (id === config.active) return { error: ERRORS.removeActive };
      saveConfig({ ...config, servers: config.servers.filter((entry) => entry.id !== id) });
      return { error: null };
    }),
  );
  ipcMain.handle(
    "runelay:get-startup",
    guard(() => ({ supported: Boolean(config), local: isLocalActive(), openAtLogin: readOpenAtLogin() })),
  );
  ipcMain.handle(
    "runelay:set-startup",
    guard((enabled) => {
      if (typeof enabled !== "boolean") return { error: ERRORS.invalidRequest, openAtLogin: readOpenAtLogin() };
      try {
        writeOpenAtLogin(enabled);
      } catch {
        return { error: ERRORS.startupFailed, openAtLogin: readOpenAtLogin() };
      }
      syncRemoteTray();
      return { error: null, openAtLogin: readOpenAtLogin() };
    }),
  );
};

const chooseServer = () =>
  new Promise((resolve) => {
    let chosen = false;
    chooser = new BrowserWindow({
      width: 560,
      height: 640,
      center: true,
      resizable: false,
      maximizable: false,
      fullscreenable: false,
      title: "runelay",
      titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
      backgroundColor: nativeTheme.shouldUseDarkColors ? "#0c0d0e" : "#fdfdfd",
      show: false,
      icon: windowIcon(),
      webPreferences: securePreferences(appFile("chooser", "preload.cjs")),
    });
    chooser.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    chooser.webContents.on("will-navigate", (event) => event.preventDefault());
    ipcMain.handle("chooser:choose", async (event, input) => {
      if (!isFromWindow(event, chooser)) throw new Error("forbidden");
      const result = await resolveChoice(input);
      if (result.error) return { error: result.error };
      if (chosen) return { error: ERRORS.invalidRequest };
      chosen = true;
      writeConfig(result.config);
      ipcMain.removeHandler("chooser:choose");
      handoff = { ready: deferred(), done: deferred() };
      resolve(result.config);
      await handoff.ready.promise;
      const active = activeServer();
      return { error: null, kind: active.kind, host: active.kind === "remote" ? new URL(active.url).host : null };
    });
    ipcMain.handle("chooser:done", (event) => {
      if (!isFromWindow(event, chooser)) throw new Error("forbidden");
      handoff?.done.resolve();
    });
    chooser.once("ready-to-show", () => chooser?.show());
    chooser.on("closed", () => {
      chooser = null;
      ipcMain.removeHandler("chooser:done");
      handoff?.ready.resolve();
      handoff?.done.resolve();
      if (!chosen) app.quit();
    });
    chooser.loadFile(appFile("chooser", "index.html"));
  });

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

const isInternal = (url) => {
  if (url === "about:blank") return true;
  try {
    return new URL(url).origin === activeOrigin;
  } catch {
    return false;
  }
};

const promptRemoteFailure = async (_event, code, _description, failedUrl, isMainFrame) => {
  if (!isMainFrame || code === -3 || failurePromptOpen || !window) return;
  failurePromptOpen = true;
  dropHandoff();
  window.show();
  const { response } = await dialog.showMessageBox(window, {
    type: "warning",
    buttons: ["Tentar de novo", "Trocar servidor", "Sair"],
    defaultId: 0,
    cancelId: 2,
    noLink: true,
    message: "Não consegui falar com o servidor",
    detail: `${activeServer().name} (${home}) não respondeu. Confira se o servidor está no ar ou volte para ${LOCAL_SERVER.name}.`,
  });
  failurePromptOpen = false;
  if (response === 0) return window?.loadURL(isInternal(failedUrl) ? failedUrl : home).catch(() => null);
  if (response === 1) return activateServer(LOCAL_SERVER.id);
  app.quit();
};

const createWindow = async (url) => {
  window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "runelay",
    backgroundColor: "#0c0d0f",
    show: false,
    icon: windowIcon(),
    webPreferences: securePreferences(appFile("preload.cjs")),
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
  window.once("ready-to-show", () => (handoff ? handoff.ready.resolve() : window?.show()));
  window.on("closed", () => {
    window = null;
  });
  if (activeServer().kind !== "remote") return window.loadURL(url);
  window.webContents.on("did-fail-load", promptRemoteFailure);
  await window.loadURL(url).catch(() => null);
};

const dropHandoff = () => {
  if (!handoff) return;
  handoff.ready.resolve();
  handoff = null;
  chooser?.destroy();
};

const completeHandoff = async () => {
  if (!handoff) return;
  const current = handoff;
  await current.ready.promise;
  await Promise.race([current.done.promise, wait(HANDOFF_TIMEOUT_MS)]);
  if (handoff !== current) return;
  handoff = null;
  if (window && !window.isDestroyed()) {
    window.setOpacity(0);
    window.show();
  }
  await Promise.all([fade(chooser, 1, 0), fade(window, 0, 1)]);
  window?.setOpacity(1);
  chooser?.destroy();
};

const showWindow = async () => {
  if (window && !window.isDestroyed()) {
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
    return;
  }
  if (!home) return;
  const entry = pendingEntry ?? home;
  pendingEntry = null;
  await createWindow(entry);
};

const trayIcon = () =>
  nativeImage.createFromPath(appFile("build", "icon.png")).resize({
    width: TRAY_ICON_SIZE[process.platform] ?? 22,
    height: TRAY_ICON_SIZE[process.platform] ?? 22,
  });

const createTray = () => {
  if (tray) return;
  tray = new Tray(trayIcon());
  tray.setToolTip("runelay");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Abrir runelay", click: () => showWindow() },
      { type: "separator" },
      { label: "Sair", click: () => app.quit() },
    ]),
  );
  tray.on("click", () => showWindow());
};

const syncRemoteTray = () => {
  if (isLocalActive()) return;
  if (readOpenAtLogin()) return createTray();
  tray?.destroy();
  tray = null;
};

const notifyBackground = () => {
  if (readPrefs().backgroundNoticeShown || !Notification.isSupported()) return;
  writePrefs({ backgroundNoticeShown: true });
  const body = isLocalActive()
    ? `O runelay continua rodando em segundo plano para os seus agentes. Para sair de vez, use Sair no ícone ${TRAY_PLACE}.`
    : `O runelay continua aberto no ícone ${TRAY_PLACE}. Para sair de vez, use Sair nesse ícone.`;
  new Notification({ title: "runelay", body }).show();
};

const fail = (message) => {
  dialog.showErrorBox("runelay não abriu", message);
  app.quit();
};

const openRemote = async (hidden) => {
  home = activeServer().url;
  activeOrigin = new URL(home).origin;
  syncRemoteTray();
  if (hidden && tray) return;
  await createWindow(home);
  await completeHandoff();
};

const openLocal = async (hidden) => {
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
  home = ORIGIN;
  activeOrigin = ORIGIN;
  createTray();
  const entry = await firstScreen(secrets);
  if (hidden) {
    pendingEntry = entry;
    return;
  }
  await createWindow(entry);
  await completeHandoff();
};

if (!app.requestSingleInstanceLock()) app.quit();

app.on("second-instance", () => {
  if (!window && !chooser && runsInBackground()) return showWindow();
  const target = window ?? (chooser?.isVisible() ? chooser : null);
  if (target?.isMinimized()) target.restore();
  target?.focus();
});

app.whenReady().then(async () => {
  if (!app.isPackaged && process.platform === "darwin") app.dock?.setIcon(devIcon());
  Menu.setApplicationMenu(buildMenu());
  registerBridge();
  const stored = readConfig();
  config = stored ?? (await chooseServer());
  Menu.setApplicationMenu(buildMenu());
  const hidden = Boolean(stored) && openedHidden();
  if (activeServer().kind === "remote") return openRemote(hidden);
  return openLocal(hidden);
});

app.on("activate", async () => {
  if (!window && home) await showWindow();
});

app.on("window-all-closed", () => {
  if (runsInBackground()) return notifyBackground();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (server) server.kill();
});
