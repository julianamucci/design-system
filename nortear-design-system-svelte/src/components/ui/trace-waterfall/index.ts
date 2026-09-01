import Root, { type TraceWaterfallLabels } from "./trace-waterfall.svelte";

export {
	Root,
	//
	// A CASCATA DE TRECHOS. Ela é AUTÔNOMA e fica onde a conversa acontece —
	// abaixo da linha da execução, ou entre as mensagens —, e por isso não sai
	// do barril de moldura nenhuma: nenhum arquivo do campo sabe que ela existe.
	//
	// NÃO HÁ PORTA PARA A CONTA. `resolveTraceWaterfall` é primitivo
	// compartilhado, e reexportá-lo daqui ensinaria que a conta é da peça —
	// quando o motivo de ela morar no compartilhado é justamente ser a mesma
	// nas cinco stacks.
	Root as TraceWaterfall,
	type TraceWaterfallLabels,
};
