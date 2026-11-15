const MESSAGES = {
  "pt-BR": {
    title: "Onde o runelay vai rodar?",
    subtitle: "Dá para adicionar outros e trocar depois pelo menu Servidor.",
    localTitle: "Rodar neste computador",
    localDescription: "O servidor roda aqui mesmo, sem nada para configurar.",
    remoteTitle: "Conectar a um servidor",
    remoteDescription: "Use um runelay que já roda em outra máquina ou na nuvem.",
    placeholder: "https://runelay.exemplo.com",
    urlLabel: "Endereço do servidor",
    continue: "Continuar",
    connecting: "Conectando…",
    starting: "Iniciando…",
    successLocal: "Pronto",
    successRemote: "Conectado",
    localName: "Este computador",
    failed: "Algo deu errado. Tente de novo.",
  },
  en: {
    title: "Where should runelay run?",
    subtitle: "You can add more and switch later from the Server menu.",
    localTitle: "Run on this computer",
    localDescription: "The server runs right here, nothing to set up.",
    remoteTitle: "Connect to a server",
    remoteDescription: "Use a runelay already running on another machine or in the cloud.",
    placeholder: "https://runelay.example.com",
    urlLabel: "Server address",
    continue: "Continue",
    connecting: "Connecting…",
    starting: "Starting…",
    successLocal: "Ready",
    successRemote: "Connected",
    localName: "This computer",
    failed: "Something went wrong. Try again.",
  },
};

const SERVER_ERRORS_EN = {
  "Endereço inválido. Use algo como https://runelay.exemplo.com.":
    "Invalid address. Use something like https://runelay.example.com.",
  "Use https. Endereço http só vale para localhost, 127.0.0.1 ou .ts.net.":
    "Use https. Plain http only works for localhost, 127.0.0.1 or .ts.net.",
  "Não achei um servidor runelay nesse endereço. Confira o endereço e se o servidor está no ar.":
    "No runelay server found at that address. Check the address and that the server is up.",
  "Pedido inválido.": "Invalid request.",
};

const locale = navigator.language.toLowerCase().startsWith("pt") ? "pt-BR" : "en";
const text = MESSAGES[locale];
const serverError = (message) => (locale === "en" ? (SERVER_ERRORS_EN[message] ?? message) : message);

const local = document.getElementById("local");
const options = document.querySelector(".options");
const remoteCard = document.getElementById("remote-card");
const toggle = document.getElementById("remote-toggle");
const panel = document.getElementById("remote-panel");
const form = document.getElementById("remote");
const input = document.getElementById("url");
const error = document.getElementById("error");
const generalError = document.getElementById("general-error");
const proceed = document.getElementById("continue");
const proceedLabel = document.getElementById("continue-label");
const successTitle = document.getElementById("success-title");
const successDetail = document.getElementById("success-detail");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let selected = null;
let busy = false;

document.documentElement.lang = locale;
for (const element of document.querySelectorAll("[data-i18n]")) {
  element.textContent = text[element.dataset.i18n];
}
input.placeholder = text.placeholder;
input.setAttribute("aria-label", text.urlLabel);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const clearErrors = () => {
  error.textContent = "";
  generalError.textContent = "";
  input.removeAttribute("aria-invalid");
};

const showError = (message) => {
  if (selected !== "remote") {
    generalError.textContent = message;
    return;
  }
  error.textContent = message;
  input.setAttribute("aria-invalid", "true");
  input.focus();
};

const canContinue = () => selected === "local" || (selected === "remote" && input.value.trim().length > 0);

const render = () => {
  const remote = selected === "remote";
  local.toggleAttribute("data-selected", selected === "local");
  remoteCard.toggleAttribute("data-selected", remote);
  local.setAttribute("aria-pressed", String(selected === "local"));
  toggle.setAttribute("aria-pressed", String(remote));
  remoteCard.dataset.open = String(remote);
  toggle.setAttribute("aria-expanded", String(remote));
  panel.inert = !remote;
  options.toggleAttribute("data-busy", busy);
  local.disabled = busy;
  toggle.disabled = busy;
  input.disabled = busy;
  proceed.disabled = busy || !canContinue();
  proceed.toggleAttribute("data-loading", busy);
  proceed.setAttribute("aria-busy", String(busy));
  proceedLabel.textContent = busy ? (remote ? text.connecting : text.starting) : text.continue;
};

const select = (choice) => {
  if (busy) return;
  selected = choice;
  clearErrors();
  render();
  if (choice === "remote") input.focus({ preventScroll: true });
};

const celebrate = async (result) => {
  const remote = result.kind === "remote";
  successTitle.textContent = remote ? text.successRemote : text.successLocal;
  successDetail.textContent = remote ? result.host : text.localName;
  document.body.dataset.state = "success";
  await wait(reducedMotion.matches ? 300 : 900);
  document.body.dataset.state = "leaving";
  await wait(reducedMotion.matches ? 100 : 200);
  window.runelayChooser.done();
};

const submit = async () => {
  if (busy || !canContinue()) return;
  const request = selected === "remote" ? { mode: "remote", url: input.value.trim() } : { mode: "local" };
  clearErrors();
  busy = true;
  render();
  const result = await window.runelayChooser.choose(request).catch(() => ({ error: text.failed }));
  if (!result?.error) return celebrate(result);
  busy = false;
  render();
  showError(serverError(result.error));
};

local.addEventListener("click", () => select("local"));

toggle.addEventListener("click", () => select("remote"));

proceed.addEventListener("click", submit);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submit();
});

input.addEventListener("input", () => {
  clearErrors();
  render();
});

render();
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add("ready")));
