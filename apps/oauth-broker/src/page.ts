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
:root{color-scheme:light dark;--bg:#f6f6f7;--card:#fff;--fg:#0c0d0f;--muted:#62646b;--soft:#f0f0f2;--primary:#0c0d0f;--on-primary:#fff;--tile:#0c0d0f;--silver-from:#fcfcfc;--silver-to:#a7abb3;--ring:rgba(12,13,15,.06)}
@media (prefers-color-scheme:dark){:root{--bg:#08090a;--card:#121315;--fg:#f4f4f5;--muted:#9a9ca3;--soft:#1b1c1f;--primary:#f4f4f5;--on-primary:#0c0d0f;--tile:#0c0d0f;--silver-from:#fff;--silver-to:#a3a7b0;--ring:rgba(255,255,255,.06)}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--fg);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{width:100%;max-width:400px;background:var(--card);border-radius:20px;padding:36px 28px 28px;box-shadow:0 0 0 1px var(--ring),0 12px 40px rgba(0,0,0,.08);text-align:center;animation:rise .45s cubic-bezier(.22,1,.36,1) both}
.mark{display:grid;place-items:center;width:64px;height:64px;margin:0 auto 14px;border-radius:18px;background:var(--tile);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 6px 18px rgba(0,0,0,.18)}
.mark svg{width:34px;height:34px;overflow:visible}
.mark .top{animation:top .6s cubic-bezier(.22,1,.36,1) .1s both}
.mark .bottom{animation:bottom .6s cubic-bezier(.22,1,.36,1) .1s both}
.brand{margin:0 0 28px;font-weight:600;letter-spacing:-.02em;color:var(--fg)}
h1{font-size:19px;line-height:1.4;font-weight:600;letter-spacing:-.01em;margin:0 0 14px;overflow-wrap:anywhere}
h1 strong{font-weight:600}
.origin{display:block;font:14px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:var(--soft);border-radius:12px;padding:12px 14px;margin:0 0 20px;overflow-wrap:anywhere}
p{margin:0 0 8px;color:var(--muted);text-wrap:pretty}
.question{color:var(--fg);font-weight:600;margin-bottom:6px}
.hint{font-size:14px}
.actions{display:flex;flex-direction:column;gap:6px;margin-top:24px}
button{font:inherit;cursor:pointer;border:0;border-radius:12px;padding:12px 16px;min-height:46px;transition:transform .15s cubic-bezier(.22,1,.36,1),opacity .15s}
button:active{transform:scale(.98)}
.primary{background:var(--primary);color:var(--on-primary);font-weight:600}
.primary:hover{opacity:.9}
.link{background:transparent;color:var(--muted)}
.link:hover{color:var(--fg)}
button:focus-visible{outline:2px solid var(--fg);outline-offset:2px}
footer{margin-top:20px;font-size:12px;color:var(--muted)}
@keyframes rise{from{opacity:0;transform:translateY(8px) scale(.985)}to{opacity:1;transform:none}}
@keyframes top{from{transform:translateY(-60px);opacity:0}to{transform:none;opacity:1}}
@keyframes bottom{from{transform:translateY(60px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){main,.mark .top,.mark .bottom{animation:none}button{transition:none}}
`;

const LOGO = `<div class="mark"><svg viewBox="226 216 572 592" aria-hidden="true"><defs><linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--silver-from)"/><stop offset="1" stop-color="var(--silver-to)"/></linearGradient></defs><path class="bottom" d="M492 285A256 256 0 0 0 492 797Z" fill="url(#silver)"/><path class="top" d="M532 226A256 256 0 0 1 532 738Z" fill="url(#silver)"/></svg></div><p class="brand">runelay</p>`;

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
  `<!doctype html><html lang="${locale === "pt" ? "pt-BR" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style>${STYLE}</style></head><body><main>${LOGO}${body}<footer>auth.runelay.com</footer></main></body></html>`;

export const confirmPage = (locale: Locale, action: string, target: URL, fields: [string, string][]) => {
  const copy = COPY[locale];
  const hidden = fields
    .map(([name, value]) => `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`)
    .join("");
  return document(
    locale,
    copy.confirmTitle,
    `<h1>${copy.heading(escapeHtml(target.host))}</h1><code class="origin">${escapeHtml(target.origin)}</code><p class="question">${copy.question}</p><p class="hint">${copy.hint}</p><form method="POST" action="${escapeHtml(action)}">${hidden}<div class="actions"><button class="primary" type="submit" name="decision" value="continue">${copy.continue}</button><button class="link" type="submit" name="decision" value="cancel">${copy.cancel}</button></div></form>`,
  );
};

export const cancelledPage = (locale: Locale) => {
  const copy = COPY[locale];
  return document(locale, copy.cancelledTitle, `<h1>${copy.cancelled}</h1>`);
};
