import { checks, cmd } from "./blocks.mjs";

const hero = (route, label) =>
  `<div class="shot-hero feature-hero"><canvas class="hero-pixels" aria-hidden="true"></canvas><div class="shot-stage"><div class="shot-frame"><div class="shot-app" data-showcase="hero" data-route="${route}" role="region" aria-label="${label}"></div></div></div></div>`;

const stage = (kind, label) => `<div class="feature-media"><div class="bento-stage" data-showcase="${kind}" role="region" aria-label="${label}"></div></div>`;

const orbit = () => {
  const agents = [
    ["claude", "Claude Code", ""],
    ["codex", "Codex", ""],
    ["cursor", "Cursor", ""],
    ["antigravity", "Antigravity", "svg"],
    ["grokbot", "Grokbot", "png"],
  ];
  const logo = ([slug, name, file]) =>
    file
      ? `<span class="agent-logo agent-${slug}"><img src="/logos/${slug}.${file}" width="20" height="20" alt="${name}" loading="lazy" decoding="async" /></span>`
      : `<span class="agent-logo agent-${slug}" role="img" aria-label="${name}"></span>`;
  return `<div class="feature-media feature-orbit"><div class="orbit" aria-hidden="true"><span class="orbit-ring"></span><span class="orbit-ring outer"></span><span class="orbit-core"><img src="/favicon.svg" width="40" height="40" alt="" /></span><span class="orbit-track">${agents
    .map((agent, index) => `<span class="orbit-item" style="--i:${index}">${logo(agent)}</span>`)
    .join("")}</span></div></div>`;
};

const row = (title, text, media = "", extra = "") =>
  `<div class="feature-row${media ? "" : " solo"}" data-reveal><div class="feature-text"><h2>${title}</h2><p>${text}</p>${extra}</div>${media}</div>`;

const rows = (...items) => `<div class="feature-rows">${items.join("")}</div>`;

const connections = {
  slug: "features/connections",
  icon: "plug",
  related: ["features/agents", "features/memory", "integrations"],
  en: {
    title: "Connections: connect an account once, every agent uses it · Runelay",
    description: "Add Linear, GitHub, Stripe or any MCP server to Runelay one time. Every agent that points at your endpoint sees its tools, and the credential stays on your server.",
    eyebrow: "Feature · Connections",
    h1: "Connect once, use everywhere",
    lead: "Add an account or a tool to runelay one time. Every agent that points at your endpoint sees its tools, and the credential never leaves your server.",
    cardTitle: "Connect once",
    cardText: "One login per account, shared by every agent.",
    hero: hero("/connectors", "Interactive preview of the runelay connectors"),
    body: [
      rows(
        row(
          "A catalog with one-click OAuth",
          "About 25 curated MCP servers. Pick one, sign in, and its tools are ready. The connection's name becomes the tool prefix, so <code>linear</code> exposes tools like <code>linear.list_issues</code>.",
          stage("connect", "Installed connectors"),
        ),
        row(
          "Bring any MCP server or API",
          "The catalog is a shortcut, not a limit. Three connection types cover the rest:",
          "",
          checks([
            "<strong>Remote MCP.</strong> A URL plus optional headers, stored encrypted. If the server asks for sign-in, OAuth opens next.",
            "<strong>Local command.</strong> A command that starts an MCP server on the runelay machine. Off by default, it needs <code>RUNELAY_ENABLE_STDIO=true</code>.",
            "<strong>OpenAPI.</strong> A spec in JSON or YAML. Each operation becomes a tool.",
          ]),
        ),
        row(
          "Expired logins wait in a queue",
          "Each connection shows its tool count and a status: OK, Error, Needs sign-in or Not tested. You can test, pause or remove it. After <code>runelay migrate</code>, the reconnect queue walks you through every pending login one tab at a time.",
          "",
          cmd("runelay migrate"),
        ),
      ),
    ],
    faq: [
      ["Do agents ever see my credentials?", "No. Tokens and headers are encrypted with AES-256-GCM using your RUNELAY_SECRET, and requests made with an API key see them as ••••••."],
      ["Can I import the MCP servers I already have?", "Yes. Paste ~/.claude.json, ~/.codex/config.toml, ~/.grok/config.toml or ~/.cursor/mcp.json in the panel, or run runelay import on your computer."],
      ["What happens when I remove a connection?", "Its sign-in is deleted and its tools disappear from every agent in the organization."],
    ],
  },
  pt: {
    title: "Conexões: conecte uma conta uma vez, todo agente usa · Runelay",
    description: "Adicione Linear, GitHub, Stripe ou qualquer servidor MCP ao Runelay uma vez. Todo agente que aponta para o seu endpoint vê as tools, e a credencial fica no seu servidor.",
    eyebrow: "Recurso · Conexões",
    h1: "Conecte uma vez, use em todo lugar",
    lead: "Adicione uma conta ou uma tool ao runelay uma vez. Todo agente que aponta para o seu endpoint vê as tools, e a credencial não sai do seu servidor.",
    cardTitle: "Conecte uma vez",
    cardText: "Um login por conta, compartilhado por todos os agentes.",
    hero: hero("/connectors", "Prévia interativa dos conectores do runelay"),
    body: [
      rows(
        row(
          "Catálogo com OAuth em um clique",
          "Cerca de 25 servidores MCP selecionados. Escolha um, faça login e as tools estão prontas. O nome da conexão vira o prefixo das tools, então <code>linear</code> expõe tools como <code>linear.list_issues</code>.",
          stage("connect", "Conectores instalados"),
        ),
        row(
          "Traga qualquer servidor MCP ou API",
          "O catálogo é um atalho, não um limite. Três tipos de conexão cobrem o resto:",
          "",
          checks([
            "<strong>MCP remoto.</strong> Uma URL e headers opcionais, guardados criptografados. Se o servidor pedir login, o OAuth abre em seguida.",
            "<strong>Comando local.</strong> Um comando que sobe um servidor MCP na máquina do runelay. Desligado por padrão, precisa de <code>RUNELAY_ENABLE_STDIO=true</code>.",
            "<strong>OpenAPI.</strong> Uma spec em JSON ou YAML. Cada operação vira uma tool.",
          ]),
        ),
        row(
          "Login vencido espera numa fila",
          "Cada conexão mostra quantas tools tem e um status: OK, Erro, Pede login ou Não testada. Dá para testar, pausar ou remover. Depois do <code>runelay migrate</code>, a fila de reconexão passa por cada login pendente, uma aba por vez.",
          "",
          cmd("runelay migrate"),
        ),
      ),
    ],
    faq: [
      ["Os agentes veem as minhas credenciais?", "Não. Tokens e headers são criptografados com AES-256-GCM usando o seu RUNELAY_SECRET, e requisições feitas com chave de API veem tudo como ••••••."],
      ["Dá para importar os servidores MCP que eu já tenho?", "Sim. Cole ~/.claude.json, ~/.codex/config.toml, ~/.grok/config.toml ou ~/.cursor/mcp.json no painel, ou rode runelay import no seu computador."],
      ["O que acontece quando removo uma conexão?", "O login dela é apagado e as tools somem de todos os agentes da organização."],
    ],
  },
};

const skills = {
  slug: "features/skills",
  icon: "spark",
  related: ["features/memory", "features/agents", "docs/migrate"],
  en: {
    title: "Skills: your SKILL.md folders, served to every agent · Runelay",
    description: "Keep SKILL.md folders in Runelay. Claude Code, Codex, Cursor and any MCP client find them and read them only when they need them.",
    eyebrow: "Feature · Skills",
    h1: "Skills that travel",
    lead: "Keep your SKILL.md folders in one place. Any agent finds them and reads them only when it needs them.",
    cardTitle: "Skills that travel",
    cardText: "SKILL.md folders, served on demand to any agent.",
    hero: hero("/skills", "Interactive preview of the runelay skills"),
    body: [
      rows(
        row(
          "Served on demand",
          "Agents read a skill with <code>read_skill</code> and its extra files with <code>read_skill_file</code>. <code>search_context</code> runs a full-text search across skills and memories, so a skill only enters the context when it matters.",
          stage("skills-grid", "Skills list"),
        ),
        row("On or off, per skill", "Every skill has a switch in the panel. Turn one off and it drops out of agent search and the brief, without deleting the folder.", stage("skills", "Skill switches")),
        row(
          "Lands in your local folders",
          "<code>runelay push</code> imports skills from Claude Code, Codex, Cursor, Grok, Gemini and OpenCode. <code>runelay pull</code> writes enabled skills you do not have locally to <code>~/.claude/skills/&lt;slug&gt;/</code> with a <code>.runelay</code> marker. A folder without the marker is yours and is never overwritten.",
          "",
          cmd("runelay sync"),
        ),
      ),
    ],
    faq: [
      ["Will runelay pull overwrite my own skills?", "No. It only updates folders that carry the .runelay marker. A folder without it is yours."],
      ["Which folders does runelay push read?", "~/.claude/skills, ~/.agents/skills, ~/.codex/skills, ~/.cursor/skills, ~/.grok/skills, ~/.gemini/skills and ~/.config/opencode/skills. Duplicates are merged."],
    ],
  },
  pt: {
    title: "Skills: suas pastas SKILL.md servidas para todo agente · Runelay",
    description: "Guarde as pastas SKILL.md no Runelay. Claude Code, Codex, Cursor e qualquer cliente MCP encontram e leem só quando precisam.",
    eyebrow: "Recurso · Skills",
    h1: "Skills que viajam",
    lead: "Guarde as suas pastas SKILL.md em um lugar só. Qualquer agente encontra e lê só quando precisa.",
    cardTitle: "Skills que viajam",
    cardText: "Pastas SKILL.md servidas sob demanda para qualquer agente.",
    hero: hero("/skills", "Prévia interativa das skills do runelay"),
    body: [
      rows(
        row(
          "Servidas sob demanda",
          "Os agentes leem uma skill com <code>read_skill</code> e os arquivos extras com <code>read_skill_file</code>. O <code>search_context</code> faz busca de texto em skills e memórias, então uma skill só entra no contexto quando importa.",
          stage("skills-grid", "Lista de skills"),
        ),
        row("Liga e desliga, uma por uma", "Cada skill tem um botão no painel. Desligue uma e ela sai da busca dos agentes e do resumo, sem apagar a pasta.", stage("skills", "Botões das skills")),
        row(
          "Chega nas suas pastas locais",
          "O <code>runelay push</code> importa skills do Claude Code, Codex, Cursor, Grok, Gemini e OpenCode. O <code>runelay pull</code> grava as skills ligadas que você não tem localmente em <code>~/.claude/skills/&lt;slug&gt;/</code> com um marcador <code>.runelay</code>. Uma pasta sem o marcador é sua e nunca é sobrescrita.",
          "",
          cmd("runelay sync"),
        ),
      ),
    ],
    faq: [
      ["O runelay pull sobrescreve as minhas skills?", "Não. Ele só atualiza pastas com o marcador .runelay. Uma pasta sem ele é sua."],
      ["Quais pastas o runelay push lê?", "~/.claude/skills, ~/.agents/skills, ~/.codex/skills, ~/.cursor/skills, ~/.grok/skills, ~/.gemini/skills e ~/.config/opencode/skills. Duplicadas são juntadas."],
    ],
  },
};

const memory = {
  slug: "features/memory",
  icon: "brain",
  related: ["features/skills", "features/agents", "docs/migrate"],
  en: {
    title: "Shared memory for Claude Code, Codex and Cursor · Runelay",
    description: "Notes every agent reads and writes, with [[links]], versions, health checks and pinned memories. What one agent learns, all of them know.",
    eyebrow: "Feature · Memory",
    h1: "Shared memory",
    lead: "Notes every agent reads and writes. What one agent learns, all of them know.",
    cardTitle: "Shared memory",
    cardText: "Linked, versioned notes every agent reads and writes.",
    hero: hero("/memory", "Interactive preview of the runelay memory"),
    body: [
      rows(
        row(
          "Linked and versioned",
          "Notes link to each other with <code>[[slug]]</code>, and every change is versioned. Agents read with <code>read_memory</code> and save new facts with <code>write_memory</code>.",
          stage("memory-list", "Memory list"),
        ),
        row("Health checks", "The panel flags memories worth reviewing: notes untouched for 30 days, links that point nowhere and notes nothing links to.", stage("health", "Memory health")),
        row(
          "Pinned memories go everywhere",
          "Pinned memories go into every agent's instructions, and only the panel can pin, never an agent. <code>runelay pull</code> writes the brief into <code>CLAUDE.md</code> and <code>AGENTS.md</code>, only between its own markers.",
          "",
          cmd("runelay pull"),
        ),
      ),
    ],
    faq: [
      ["Does memory go back to local files?", "No. The brief tells agents to save new facts with write_memory, so memory flows back to runelay instead of local files."],
      ["Can I bring the memories I already have?", "Yes. runelay push imports memories and global instructions from Claude Code, Codex, Cursor, Grok, Gemini and OpenCode."],
    ],
  },
  pt: {
    title: "Memória compartilhada para Claude Code, Codex e Cursor · Runelay",
    description: "Notas que todo agente lê e escreve, com [[links]], versões, checagem de saúde e memórias fixadas. O que um agente aprende, todos sabem.",
    eyebrow: "Recurso · Memória",
    h1: "Memória compartilhada",
    lead: "Notas que todo agente lê e escreve. O que um agente aprende, todos sabem.",
    cardTitle: "Memória compartilhada",
    cardText: "Notas ligadas e versionadas que todo agente lê e escreve.",
    hero: hero("/memory", "Prévia interativa da memória do runelay"),
    body: [
      rows(
        row(
          "Ligadas e versionadas",
          "As notas se ligam com <code>[[slug]]</code>, e toda mudança gera uma versão. Os agentes leem com <code>read_memory</code> e salvam fatos novos com <code>write_memory</code>.",
          stage("memory-list", "Lista de memórias"),
        ),
        row("Checagem de saúde", "O painel aponta memórias que merecem revisão: notas sem mexer há 30 dias, links que não levam a lugar nenhum e notas que nada liga.", stage("health", "Saúde da memória")),
        row(
          "Fixadas vão para todo lugar",
          "Memórias fixadas entram nas instruções de todo agente, e só o painel fixa, nunca um agente. O <code>runelay pull</code> escreve o resumo no <code>CLAUDE.md</code> e no <code>AGENTS.md</code>, só entre os marcadores dele.",
          "",
          cmd("runelay pull"),
        ),
      ),
    ],
    faq: [
      ["A memória volta para arquivos locais?", "Não. O resumo pede aos agentes que salvem fatos novos com write_memory, então a memória volta para o runelay em vez de arquivos locais."],
      ["Dá para trazer as memórias que eu já tenho?", "Sim. O runelay push importa memórias e instruções globais do Claude Code, Codex, Cursor, Grok, Gemini e OpenCode."],
    ],
  },
};

const agentLinks = (lang) => {
  const label = lang === "en" ? "Guides" : "Guias";
  const items = [
    ["guides/claude-code", "Claude Code"],
    ["guides/codex", "Codex"],
    ["guides/cursor", "Cursor"],
    ["guides/antigravity", "Antigravity"],
    ["guides/grokbot", "Grokbot"],
    ["guides/hermes-agent", "Hermes Agent"],
    ["guides/openclaw", "OpenClaw"],
    ["guides/mausbot", "MausBot"],
    ["guides/opencode", "OpenCode"],
    ["guides/openbot", "OpenBot"],
    ["guides/kimi-code", "Kimi Code"],
    ["guides/agentes-chat", "agentes.chat"],
  ];
  return `<p class="feature-links"><span>${label}:</span> ${items.map(([slug, name]) => `<a href="/${slug}/">${name}</a>`).join(" · ")}</p>`;
};

const agents = {
  slug: "features/agents",
  icon: "terminal",
  related: ["features/connections", "features/memory", "guides/share-mcp-across-agents"],
  en: {
    title: "One MCP endpoint for Claude Code, Codex, Cursor and more · Runelay",
    description: "Every agent talks to the same Runelay endpoint with its own API key. Connect Claude Code, Codex, Cursor, Antigravity, Grokbot or any MCP client.",
    eyebrow: "Feature · Agents",
    h1: "Works with every agent",
    lead: "Claude Code, Codex, Cursor, Antigravity, Grokbot or any MCP client talks to one endpoint, with its own key.",
    cardTitle: "Works with every agent",
    cardText: "One endpoint, one key per agent.",
    hero: hero("/api-keys", "Interactive preview of the runelay API keys"),
    body: [
      rows(
        row("One endpoint for all of them", "Every agent talks to <code>PUBLIC_URL/v1/mcp</code> with its own API key (<code>rnl_…</code>). Adding a new agent is one key and one line of config.", orbit(), agentLinks("en")),
        row(
          "One key per agent",
          "Each key belongs to one organization and has its own rate limit. Revoke one without breaking the others. Every request made with a key is audited: tool calls with source, tool, result and duration.",
          stage("keys", "API keys"),
        ),
        row(
          "Set up in one command",
          "<code>runelay migrate</code> brings the MCP servers, memories, skills and instructions your agents already have. <code>runelay connect</code> registers runelay in Claude Code, Codex, Cursor, Grok, Gemini CLI, Antigravity, OpenCode, Kimi Code, Hermes Agent, OpenClaw and MausBot.",
          "",
          cmd("runelay migrate") + cmd("runelay connect"),
        ),
      ),
    ],
    faq: [
      ["Which agents does it work with?", "Any MCP client. runelay connect wires Claude Code, Codex, Cursor, Grok, Gemini CLI, Antigravity, OpenCode, Kimi Code, Hermes Agent, OpenClaw and MausBot for you; the others take the endpoint and a key."],
      ["Do agents get my account credentials?", "No. They only hold their runelay key. Account tokens stay encrypted on your server."],
    ],
  },
  pt: {
    title: "Um endpoint MCP para Claude Code, Codex, Cursor e mais · Runelay",
    description: "Todo agente fala com o mesmo endpoint do Runelay, cada um com a sua chave de API. Conecte Claude Code, Codex, Cursor, Antigravity, Grokbot ou qualquer cliente MCP.",
    eyebrow: "Recurso · Agentes",
    h1: "Funciona com todo agente",
    lead: "Claude Code, Codex, Cursor, Antigravity, Grokbot ou qualquer cliente MCP falam com um endpoint só, cada um com a sua chave.",
    cardTitle: "Funciona com todo agente",
    cardText: "Um endpoint, uma chave por agente.",
    hero: hero("/api-keys", "Prévia interativa das chaves de API do runelay"),
    body: [
      rows(
        row("Um endpoint para todos", "Todo agente fala com <code>PUBLIC_URL/v1/mcp</code> usando a sua própria chave de API (<code>rnl_…</code>). Adicionar um agente novo é uma chave e uma linha de configuração.", orbit(), agentLinks("pt")),
        row(
          "Uma chave por agente",
          "Cada chave pertence a uma organização e tem o seu próprio limite de requisições. Revogue uma sem quebrar as outras. Toda requisição feita com uma chave é auditada: chamadas de tool com origem, tool, resultado e duração.",
          stage("keys", "Chaves de API"),
        ),
        row(
          "Configura com um comando",
          "O <code>runelay migrate</code> traz os servidores MCP, memórias, skills e instruções que os seus agentes já têm. O <code>runelay connect</code> registra o runelay no Claude Code, Codex, Cursor, Grok, Gemini CLI, Antigravity, OpenCode, Kimi Code, Hermes Agent, OpenClaw e MausBot.",
          "",
          cmd("runelay migrate") + cmd("runelay connect"),
        ),
      ),
    ],
    faq: [
      ["Com quais agentes funciona?", "Qualquer cliente MCP. O runelay connect configura Claude Code, Codex, Cursor, Grok, Gemini CLI, Antigravity, OpenCode, Kimi Code, Hermes Agent, OpenClaw e MausBot para você; os outros recebem o endpoint e uma chave."],
      ["Os agentes recebem as credenciais das minhas contas?", "Não. Eles guardam só a chave do runelay. Os tokens das contas ficam criptografados no seu servidor."],
    ],
  },
};

export const FEATURES = [connections, skills, memory, agents];
