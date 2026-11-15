const ICONS = {
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v14H6.5A1.5 1.5 0 0 0 5 18.5v-14Zm0 14A1.5 1.5 0 0 0 6.5 20H19"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  dash: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12h7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6h.01"/>',
  columns: '<rect x="3.5" y="4.5" width="7" height="15" rx="2"/><rect x="13.5" y="4.5" width="7" height="15" rx="2"/>',
  server: '<path d="M4.5 4.5h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Zm0 9h15a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1ZM7 7.5h.01M7 16.5h.01"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17h.01"/>',
  hub: '<circle cx="12" cy="12" r="3"/><circle cx="4.5" cy="5" r="1.8"/><circle cx="4.5" cy="19" r="1.8"/><circle cx="19.5" cy="5" r="1.8"/><circle cx="19.5" cy="19" r="1.8"/><path d="m6 6.5 3.8 3.4M6 17.5l3.8-3.4M18 6.5l-3.8 3.4M18 17.5l-3.8-3.4"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7.5 9.5 3 2.5-3 2.5M13 15h3.5"/>',
  plug: '<path d="M9 3v5m6-5v5M6.5 8h11v3.5a5.5 5.5 0 0 1-11 0V8ZM12 17v4"/>',
  shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
  import: '<path d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 16.5v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  arrow: '<path d="M5 12h14m0 0-5-5m5 5-5 5"/>',
  brain: '<path d="M9.5 4.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 0 1 4 2.5 2.5 0 0 0 3.5 3.5 2 2 0 0 0 2.5-1.5V6a2 2 0 0 0-2.5-1.5Zm5 0A2.5 2.5 0 0 1 17 7a2.5 2.5 0 0 1 2 4 2.5 2.5 0 0 1-1 4 2.5 2.5 0 0 1-3.5 3.5 2 2 0 0 1-2.5-1.5"/>',
  spark: '<path d="m4 20 10-10m2-6 .6 1.6L18 6l-1.4.6L16 8l-.6-1.4L14 6l1.4-.4L16 4Zm3 6 .5 1.2 1.2.5-1.2.5L19 13l-.5-1.3-1.2-.5 1.2-.5L19 10ZM9 3l.5 1.2 1.2.5-1.2.5L9 6.5l-.5-1.3-1.2-.5 1.2-.5L9 3Z"/>',
};

export const icon = (name, size = 15) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

export const escape = (text) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const plain = (html) => {
  let text = html;
  let previous;
  do {
    previous = text;
    text = text.replace(/<[^>]+>/g, "");
  } while (text !== previous);
  return text;
};

export const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>`;

export const card = (name, title, body, reveal = true) => `<div class="bcard"${reveal ? " data-reveal" : ""}><h2 class="bcard-title">${icon(name)}${title}</h2>${body}</div>`;

export const prose = (...paragraphs) => `<div class="bcard-body">${paragraphs.map((text) => `<p>${text}</p>`).join("")}</div>`;

export const cmd = (text) =>
  `<div class="cmd"><code><span class="prompt">$</span>${escape(text)}</code><button class="copy" type="button" data-copy="${escape(text)}" data-copied="{{copied}}">{{copy}}</button></div>`;

export const code = (text) =>
  `<div class="cmd code"><pre><code>${escape(text)}</code></pre><button class="copy" type="button" data-copy="${escape(text).replaceAll("\n", "&#10;")}" data-copied="{{copied}}">{{copy}}</button></div>`;

export const steps = (items) =>
  `<ol class="steps">${items.map(([title, text, extra = ""], index) => `<li><span class="step-number" aria-hidden="true">${index + 1}</span><h3>${title}</h3><p>${text}</p>${extra}</li>`).join("")}</ol>`;

export const table = (head, rows) =>
  `<div class="compare"><table><thead><tr><th></th>${head.map((label, index) => `<th${index === 0 ? ' class="us"' : ""}>${label}</th>`).join("")}</tr></thead><tbody>${rows
    .map(([label, ...cells]) => `<tr><th>${label}</th>${cells.map((cell, index) => `<td${index === 0 ? ' class="us"' : ""}>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;

export const YES = '<span class="yes">✓</span>';

export const checks = (items, mark = "check") => `<ul class="checks">${items.map((text) => `<li>${icon(mark, 16)}<span>${text}</span></li>`).join("")}</ul>`;

export const duo = (left, right) => `<div class="duo">${left}${right}</div>`;

export const stats = (items) => `<div class="bstats" data-reveal>${items.map(([value, label]) => `<div class="bstat"><strong>${value}</strong><span>${label}</span></div>`).join("")}</div>`;

export const links = (items) =>
  `<div class="guide-list">${items
    .map(([href, name, title, text]) => {
      const inner = `${name.startsWith("<") ? name : `<span class="brow-icon">${icon(name, 16)}</span>`}<span class="guide-text"><strong>${title}</strong><small>${text}</small></span>`;
      return href ? `<a class="guide-card" href="${href}">${inner}<span class="guide-arrow">${icon("arrow", 16)}</span></a>` : `<div class="guide-card static">${inner}</div>`;
    })
    .join("")}</div>`;

const COPY_ICON = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 3.5v-.5a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v5A1.5 1.5 0 0 0 4 9.5h.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';

export const promptCard = ({ id, logo = "", title, text, prompt }) =>
  `<div class="prompt-card"><div class="prompt-head">${logo}<span><strong>${title}</strong><small>${text}</small></span><button class="button-solid small" type="button" data-copy-from="#${id}" data-copied="{{copied}}">${COPY_ICON}<span data-label>{{copy}}</span></button></div><template id="${id}">${escape(prompt)}</template></div>`;
