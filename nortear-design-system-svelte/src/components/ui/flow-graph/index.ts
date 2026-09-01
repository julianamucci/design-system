import Root, { type FlowGraphLabels } from "./flow-graph.svelte";

export {
	Root,
	//
	// O GRAFO DE FLUXO. Ele é AUTÔNOMO e fica onde a conversa acontece — abaixo
	// da linha da execução, ou entre as mensagens —, e por isso não sai do
	// barril de moldura nenhuma: nenhum arquivo do campo sabe que ele existe.
	//
	// NÃO HÁ PORTA PARA A CONTA. `resolveFlowGraph` é primitivo compartilhado, e
	// reexportá-lo daqui ensinaria que a conta é da peça — quando o motivo de
	// ela morar no compartilhado é justamente ser a mesma nas cinco stacks.
	Root as FlowGraph,
	type FlowGraphLabels,
};
