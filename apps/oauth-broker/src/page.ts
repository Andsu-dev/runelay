export type Locale = "en" | "pt";

const COPY = {
  en: {
    confirmTitle: "Confirm your runelay",
    heading: (host: string) => `This login is going to <strong>${host}</strong>.`,
    question: "Is this your runelay?",
    hint: "Only continue if you started this login and you recognize this address. Otherwise, cancel.",
    continue: "Continue",
    cancel: "Cancel",
    cancelledTitle: "Login cancelled",
    cancelled: "Login cancelled. You can close this tab.",
  },
  pt: {
    confirmTitle: "Confirme seu runelay",
    heading: (host: string) => `Este login vai para <strong>${host}</strong>.`,
    question: "Este é o seu runelay?",
    hint: "Só continue se foi você que iniciou este login e reconhece este endereço. Se não, cancele.",
    continue: "Continuar",
    cancel: "Cancelar",
    cancelledTitle: "Login cancelado",
    cancelled: "Login cancelado. Você pode fechar esta aba.",
  },
} as const;

const STYLE = `
:root{color-scheme:light dark;--bg:#fafafa;--card:#fff;--fg:#0a0a0a;--muted:#5c5c5c;--soft:#f0f0f0;--primary:#0a0a0a;--on-primary:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#0a0a0a;--card:#161616;--fg:#fafafa;--muted:#a3a3a3;--soft:#232323;--primary:#fafafa;--on-primary:#0a0a0a}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{width:100%;max-width:420px;background:var(--card);border-radius:16px;padding:32px 24px;box-shadow:0 1px 2px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.06)}
.brand{font-weight:700;letter-spacing:-.02em;margin:0 0 24px}
h1{font-size:20px;line-height:1.35;font-weight:600;margin:0 0 16px;overflow-wrap:anywhere}
.origin{display:block;font:15px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--soft);border-radius:10px;padding:12px 14px;margin:0 0 16px;overflow-wrap:anywhere}
p{margin:0 0 16px;color:var(--muted)}
.question{color:var(--fg);font-weight:600}
.actions{display:flex;flex-direction:column;gap:8px;margin-top:24px}
button{font:inherit;cursor:pointer;border:0;border-radius:10px;padding:12px 16px;min-height:44px}
.primary{background:var(--primary);color:var(--on-primary);font-weight:600}
.link{background:transparent;color:var(--muted);text-decoration:underline;text-underline-offset:3px}
button:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
`;

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char,
  );

export const preferredLocale = (header: string | null): Locale => {
  const ranked = (header ?? "")
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().toLowerCase().split(";");
      const quality = params.map((param) => param.trim()).find((param) => param.startsWith("q="));
      const weight = quality ? Number(quality.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((entry) => entry.tag !== "" && entry.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  const first = ranked[0]?.tag ?? "";
  return first === "pt" || first.startsWith("pt-") ? "pt" : "en";
};

const document = (locale: Locale, title: string, body: string) =>
  `<!doctype html><html lang="${locale === "pt" ? "pt-BR" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head><body><main><p class="brand">runelay</p>${body}</main></body></html>`;

export const confirmPage = (locale: Locale, action: string, target: URL, fields: [string, string][]) => {
  const copy = COPY[locale];
  const hidden = fields
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join("");
  return document(
    locale,
    copy.confirmTitle,
    `<h1>${copy.heading(escapeHtml(target.host))}</h1><code class="origin">${escapeHtml(target.origin)}</code><p class="question">${copy.question}</p><p>${copy.hint}</p><form method="POST" action="${escapeHtml(action)}">${hidden}<div class="actions"><button class="primary" type="submit" name="decision" value="continue">${copy.continue}</button><button class="link" type="submit" name="decision" value="cancel">${copy.cancel}</button></div></form>`,
  );
};

export const cancelledPage = (locale: Locale) => {
  const copy = COPY[locale];
  return document(locale, copy.cancelledTitle, `<h1>${copy.cancelled}</h1>`);
};
