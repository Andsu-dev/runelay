import { defineMessages } from "@/lib/i18n/define-messages";

export const overviewMessages = defineMessages(
  {
    header: {
      welcome: "Bem-vindo de volta, {name}",
      range: "Últimos {days} dias em {organization}.",
    },
    kinds: {
      connectors: "Conectores",
      skills: "Skills",
      memories: "Memórias",
      search: "Busca",
      context: "Contexto",
    },
    calls: { one: "{count} chamada", other: "{count} chamadas" },
    errors: { one: "{count} erro", other: "{count} erros" },
    callsWidget: {
      title: "Chamadas",
      days: "{days} dias",
      noPrevious: "Sem período anterior para comparar.",
      vsPrevious: "Em relação ao período anterior.",
      sparkline: "Chamadas por dia",
    },
    delta: {
      tooltip: "Em relação aos 30 dias anteriores",
    },
    errorRate: {
      title: "Taxa de erro",
      average: "{ms} ms em média",
      failed: { one: "{count} chamada falhou", other: "{count} chamadas falharam" },
      strip: "Erros por dia",
    },
    connections: {
      title: "Conexões",
      viewAll: "Ver todas",
      tools: "{count} tools",
      attention: "{count} pedem atenção",
    },
    daily: {
      title: "Atividade por dia",
      figure: "Chamadas por dia",
      barLabel: "{day}: {connectors} chamadas de conectores, {context} de contexto, {errors} erros",
    },
    usageByKind: {
      title: "Uso por tipo",
      gauge: "Chamadas por tipo",
      callsShare: "{calls} chamadas · {share}",
      callsUnit: "chamadas",
    },
    topConnectors: {
      title: "Top conectores",
      empty: "Nenhum conector foi chamado no período.",
    },
    topTools: {
      title: "Tools mais usadas",
      empty: "Nenhuma tool foi chamada no período.",
    },
    recentSkills: {
      title: "Skills recentes",
      reads: { one: "{count} leitura", other: "{count} leituras" },
      empty: "Nenhuma skill foi lida no período.",
    },
    recentMemories: {
      title: "Memórias recentes",
      accesses: { one: "{count} acesso", other: "{count} acessos" },
      empty: "Nenhuma memória foi usada no período.",
    },
    empty: {
      title: "Nenhuma chamada ainda",
      description: "Crie uma chave de API e conecte seu primeiro agente. As chamadas aparecem aqui.",
      action: "Criar chave de API",
    },
  },
  {
    header: {
      welcome: "Welcome back, {name}",
      range: "Last {days} days in {organization}.",
    },
    kinds: {
      connectors: "Connectors",
      skills: "Skills",
      memories: "Memories",
      search: "Search",
      context: "Context",
    },
    calls: { one: "{count} call", other: "{count} calls" },
    errors: { one: "{count} error", other: "{count} errors" },
    callsWidget: {
      title: "Calls",
      days: "{days} days",
      noPrevious: "No previous period to compare.",
      vsPrevious: "Compared with the previous period.",
      sparkline: "Calls per day",
    },
    delta: {
      tooltip: "Compared with the previous 30 days",
    },
    errorRate: {
      title: "Error rate",
      average: "{ms} ms on average",
      failed: { one: "{count} call failed", other: "{count} calls failed" },
      strip: "Errors per day",
    },
    connections: {
      title: "Connections",
      viewAll: "View all",
      tools: "{count} tools",
      attention: "{count} need attention",
    },
    daily: {
      title: "Daily activity",
      figure: "Calls per day",
      barLabel: "{day}: {connectors} connector calls, {context} context, {errors} errors",
    },
    usageByKind: {
      title: "Usage by type",
      gauge: "Calls by type",
      callsShare: "{calls} calls · {share}",
      callsUnit: "calls",
    },
    topConnectors: {
      title: "Top connectors",
      empty: "No connector was called in this period.",
    },
    topTools: {
      title: "Most used tools",
      empty: "No tool was called in this period.",
    },
    recentSkills: {
      title: "Recent skills",
      reads: { one: "{count} read", other: "{count} reads" },
      empty: "No skill was read in this period.",
    },
    recentMemories: {
      title: "Recent memories",
      accesses: { one: "{count} access", other: "{count} accesses" },
      empty: "No memory was used in this period.",
    },
    empty: {
      title: "No calls yet",
      description: "Create an API key and connect your first agent. Calls show up here.",
      action: "Create API key",
    },
  },
);
