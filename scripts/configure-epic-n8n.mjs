import { readFile, writeFile } from "node:fs/promises";

const workflowPath = new URL("../OUT/EPIC - fluxo de agendamento.json", import.meta.url);
const workflow = JSON.parse(await readFile(workflowPath, "utf8"));

const endpoint = "https://crm.lisboacapital.com.br/api/public/hooks/epic-leads";
const credential = {
  httpHeaderAuth: {
    id: "br5TOpMcJI89zVaX",
    name: "X-EPIC-Webhook-Secret",
  },
};

const configurations = new Map([
  ["CRM — Nutrição (placeholder)", ["CRM — EPIC / Nutrição", "nutrition"]],
  ["CRM — EPIC / Nutrição", ["CRM — EPIC / Nutrição", "nutrition"]],
  ["CRM — Qualificado 30 (placeholder)", ["CRM — EPIC / Qualificado 30", "qualified_30"]],
  ["CRM — EPIC / Qualificado 30", ["CRM — EPIC / Qualificado 30", "qualified_30"]],
  ["CRM — Qualificado 45 (placeholder)", ["CRM — EPIC / Qualificado 45", "qualified_45"]],
  ["CRM — EPIC / Qualificado 45", ["CRM — EPIC / Qualificado 45", "qualified_45"]],
  ["CRM — Estratégico (placeholder)", ["CRM — EPIC / Estratégico", "strategic"]],
  ["CRM — EPIC / Estratégico", ["CRM — EPIC / Estratégico", "strategic"]],
  ["CRM — Reunião agendada (placeholder)", ["CRM — EPIC / Reunião agendada", "scheduled"]],
  ["CRM — EPIC / Reunião agendada", ["CRM — EPIC / Reunião agendada", "scheduled"]],
]);

const renames = new Map();
for (const node of workflow.nodes) {
  const configuration = configurations.get(node.name);
  if (!configuration) continue;
  const [newName, stageKey] = configuration;
  renames.set(node.name, newName);
  node.name = newName;
  delete node.disabled;
  node.parameters = {
    method: "POST",
    url: endpoint,
    authentication: "genericCredentialType",
    genericAuthType: "httpHeaderAuth",
    sendBody: true,
    contentType: "raw",
    rawContentType: "application/json",
    body: `={{ JSON.stringify({ ...$json, crm_stage_key: '${stageKey}' }) }}`,
    options: {
      timeout: 15000,
    },
  };
  node.retryOnFail = true;
  node.maxTries = 3;
  node.waitBetweenTries = 1000;
  node.credentials = credential;
}

for (const [oldName, newName] of renames) {
  if (oldName !== newName && workflow.connections[oldName]) {
    workflow.connections[newName] = workflow.connections[oldName];
    delete workflow.connections[oldName];
  }
}
for (const connection of Object.values(workflow.connections)) {
  for (const outputs of Object.values(connection)) {
    for (const branch of outputs) {
      for (const edge of branch) {
        edge.node = renames.get(edge.node) ?? edge.node;
      }
    }
  }
}

workflow.meta = {
  ...workflow.meta,
  lovableCrmWebhook: endpoint,
  lovableCrmCredential: "X-EPIC-Webhook-Secret",
};

await writeFile(workflowPath, `${JSON.stringify(workflow, null, 2)}\n`, "utf8");
