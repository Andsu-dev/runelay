import { fail, ok, type Result } from "@runelay/shared";
import { connectCommand } from "@/commands/connect.command";
import { signIn } from "@/commands/login.command";
import { cliEnv } from "@/config/env";
import { CLIENT_AGENT_LABELS, type ClientId } from "@/constants/clients.constants";
import { openBrowser } from "@/lib/browser";
import { ask, bold, cyan, dim, green, interactive, red, startSpinner } from "@/lib/terminal";
import { removeMigratedServers, scanClientConfigs } from "@/services/client-config.service";
import { resolveConnection } from "@/services/config.service";
import { collectContext } from "@/services/context-collector.service";
import { pushContext } from "@/services/context-push.service";
import { scanLocalCredentials } from "@/services/credential-reader.service";
import { planMigration } from "@/services/migration-plan.service";
import { fetchStatus, listSourcesByStatus, pushSources } from "@/services/runelay-api.service";
import type { CollectedContext } from "@/types/collect.types";
import type { Connection } from "@/types/config.types";
import type { MigrationPlan } from "@/types/migration.types";

const KEYCHAIN_NOTICE =
  "Vou ler os logins de MCP que o Codex e o Claude Code guardam no Keychain para as contas chegarem já conectadas. O macOS pode pedir permissão para cada item. Os tokens vão só para o seu runelay, cifrados.";

const plural = (total: number, one: string, many: string) => `${total} ${total === 1 ? one : many}`;

const hasLogin = (planned: MigrationPlan["sources"][number]) =>
  Boolean(planned.credential) || Object.keys(headersOf(planned)).length > 0;

const joinNames = (names: string[]) => (names.length ? `: ${names.join(", ")}` : "");

const printSummary = (organizationName: string, plan: MigrationPlan, context: CollectedContext) => {
  const agents = new Set([...plan.sources.map((planned) => planned.agent), ...context.lines.map((line) => line.agent)]);
  console.log(`\n${bold(`O que vai para ${organizationName}:`)}`);
  for (const agent of agents) {
    const sources = plan.sources.filter((planned) => planned.agent === agent);
    const connected = sources.filter(hasLogin);
    const lines = context.lines.filter((line) => line.agent === agent);
    const count = (kind: string) =>
      lines.filter((line) => line.kind === kind).reduce((total, line) => total + line.added, 0);
    const parts = [
      sources.length
        ? `${plural(sources.length, "conta", "contas")} (${connected.length} com login salvo${joinNames(connected.map((planned) => planned.source.name))})`
        : "",
      count("memories") ? plural(count("memories"), "memória", "memórias") : "",
      count("skills") ? plural(count("skills"), "skill", "skills") : "",
      count("instructions") ? "instruções globais" : "",
    ].filter(Boolean);
    if (parts.length) console.log(`  ${cyan(agent.padEnd(20))} ${parts.join(" · ")}`);
  }
  const withLogin = plan.sources.filter(hasLogin).length;
  const instructions = context.lines.filter((line) => line.kind === "instructions").length;
  console.log(
    `\n  Total: ${plural(plan.sources.length, "conta", "contas")} (${withLogin} com login salvo, ${plan.sources.length - withLogin} podem pedir login), ${context.memories.length - instructions} memórias, ${context.skills.length} skills, ${plural(instructions, "instrução", "instruções")}`,
  );
  if (plan.localCommands.length)
    console.log(dim(`  Ficam no agente (comando local, só pelo painel)${joinNames(plan.localCommands)}`));
};

const headersOf = ({ source }: MigrationPlan["sources"][number]) =>
  source.config.kind === "stdio" || source.config.kind === "google" ? {} : source.config.headers;

const askToProceed = async (organizationName: string, yes: boolean, replaceFlag: boolean) => {
  if (yes) return { proceed: true, replace: replaceFlag };
  if (replaceFlag) {
    const answer = await ask(`Enviar tudo para ${bold(organizationName)}? ${dim("[S/n]")}`);
    return { proceed: !/^n/i.test(answer), replace: true };
  }
  const answer = await ask(
    `Enviar tudo para ${bold(organizationName)}? ${dim("[S/n/t]  t = enviar e deixar só o runelay nos agentes")}`,
  );
  return { proceed: !/^n/i.test(answer), replace: /^t/i.test(answer) };
};

const migratedNamesByClient = (plan: MigrationPlan, imported: Set<string>) => {
  const identities = new Set(
    plan.sources.filter((planned) => imported.has(planned.source.name)).map((planned) => planned.identity),
  );
  return new Map(
    [...plan.namesByClient].map(([client, entries]): [ClientId, Set<string>] => [
      client,
      new Set(entries.filter((entry) => identities.has(entry.identity)).map((entry) => entry.name)),
    ]),
  );
};

const sendEverything = async (connection: Connection, plan: MigrationPlan, context: CollectedContext) => {
  const stopSources = startSpinner(`Enviando ${plural(plan.sources.length, "conta", "contas")} e conectando`);
  const sources = await pushSources(
    connection,
    plan.sources.map((planned) => planned.source),
  );
  if (sources.error) {
    stopSources(red("Contas falharam"));
    return sources;
  }
  stopSources(
    `${green("✓")} ${plural(sources.data.imported.length, "conta", "contas")}, ${sources.data.connected.length} conectadas${joinNames(sources.data.connected)}`,
  );
  for (const skipped of sources.data.skipped) console.log(dim(`  pulada ${skipped.name}: ${skipped.reason}`));

  const stopContext = startSpinner(`Enviando ${context.memories.length} memórias e ${context.skills.length} skills`);
  const pushed = await pushContext(connection, context.memories, context.skills);
  if (pushed.error) {
    stopContext(red("Memórias e skills falharam"));
    return pushed;
  }
  stopContext(`${green("✓")} ${pushed.data.memories} memórias e ${pushed.data.skills} skills`);
  return ok(sources.data);
};

const describeOrganization = async (connection: Connection) => {
  const status = await fetchStatus(connection);
  return status.data?.organizationName ?? connection.url;
};

export const migrateCommand = async (args: string[]): Promise<Result<null>> => {
  const yes = args.includes("--yes") || args.includes("-y");
  const replaceFlag = args.includes("--replace");
  const urlArgument = args.find((arg) => !arg.startsWith("-"));
  if (!interactive && !yes) return fail("INVALID_INPUT", "Sem terminal interativo. Rode runelay migrate --yes.");

  let connection = resolveConnection();
  if (connection.error) {
    const logged = await signIn(urlArgument);
    if (logged.error) return logged;
    connection = resolveConnection();
    if (connection.error) return connection;
  }
  const organizationName = await describeOrganization(connection.data);

  const useKeychain = process.platform === "darwin" && !cliEnv.RUNELAY_SKIP_KEYCHAIN;
  if (useKeychain) console.log(dim(KEYCHAIN_NOTICE));
  const scan = scanLocalCredentials(useKeychain);
  const clients = scanClientConfigs();
  const plan = planMigration(clients.sources, scan.credentials);
  const context = collectContext();
  for (const error of clients.errors) console.log(dim(`  ${error}`));
  for (const note of scan.notes) console.log(dim(`  ${note}`));
  printSummary(organizationName, plan, context);

  const { proceed, replace } = await askToProceed(organizationName, yes, replaceFlag);
  if (!proceed) {
    console.log("Nada foi enviado.");
    return ok(null);
  }

  const sent = await sendEverything(connection.data, plan, context);
  if (sent.error) return sent;

  console.log(bold("\nLigando o runelay nos agentes:"));
  await connectCommand();
  if (replace) {
    for (const [client, removed] of removeMigratedServers(migratedNamesByClient(plan, new Set(sent.data.imported)))) {
      if (removed.error) console.log(red(`  ${CLIENT_AGENT_LABELS[client]}: ${removed.error.message}`));
      else if (removed.data) console.log(`  ${CLIENT_AGENT_LABELS[client]}: ${removed.data} MCPs diretos removidos`);
    }
  }

  const rotated = plan.sources.filter(
    (planned) => planned.credential?.refreshToken && sent.data.imported.includes(planned.source.name),
  );
  for (const planned of rotated)
    console.log(
      dim(`  ${planned.source.name}: o provedor pode girar o token, e o ${planned.agent} pedir login de novo.`),
    );

  const pending = await listSourcesByStatus(connection.data, "needs_auth");
  const pendingNames = pending.data?.map((source) => source.name) ?? [];
  console.log(
    `\n${green("Pronto.")} ${sent.data.connected.length} contas conectadas${pendingNames.length ? `, ${pendingNames.length} pedindo login${joinNames(pendingNames)}` : ""}.`,
  );
  if (!pendingNames.length) return ok(null);
  const reconnectUrl = `${connection.data.url}/connectors/reconnect`;
  console.log(openBrowser(reconnectUrl) ? dim(`Abri ${reconnectUrl}`) : `Faça os logins em ${bold(reconnectUrl)}`);
  return ok(null);
};
