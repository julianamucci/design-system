import Root, { type AgentPlanLabels } from "./agent-plan.svelte";

export {
	Root,
	//
	// O PLANO. Ele é AUTÔNOMO e fica ao lado da linha de estado da execução —
	// nenhum arquivo de uma sabe que a outra existe, e nenhuma é prop da outra.
	// Por isso sai inteiro do barril, e não só em tipo: é quem consome que o
	// monta, no lugar que escolher.
	Root as AgentPlan,
	type AgentPlanLabels,
};
