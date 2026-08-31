import Root, {
	type AgentStatusIntent,
	type AgentStatusLabels,
} from "./agent-status.svelte";

export {
	Root,
	//
	// O ESTADO DA EXECUÇÃO. Ele é AUTÔNOMO e fica ao lado do campo de mensagem —
	// acima dele ou ao pé da conversa —, e por isso não sai do barril da moldura:
	// nenhum arquivo do campo sabe que ele existe. Sai inteiro, e não só em tipo,
	// porque é quem consome que o monta, no lugar que escolher.
	Root as AgentStatus,
	type AgentStatusIntent,
	type AgentStatusLabels,
};
