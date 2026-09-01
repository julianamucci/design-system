import Root, { type ActivityGraphLabels } from "./activity-graph.svelte";

export {
	Root,
	//
	// A GRADE DE ATIVIDADE. Ela é AUTÔNOMA e fica onde a conversa acontece —
	// abaixo da linha da execução, ou entre as mensagens —, e por isso não sai
	// do barril de moldura nenhuma: nenhum arquivo do campo sabe que ela existe.
	//
	// NÃO HÁ PORTA PARA A CONTA. `resolveActivityCalendar` é primitivo
	// compartilhado, e reexportá-lo daqui ensinaria que a conta é da peça —
	// quando o motivo de ela morar no compartilhado é justamente ser a mesma
	// nas cinco stacks.
	Root as ActivityGraph,
	type ActivityGraphLabels,
};
