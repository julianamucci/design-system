import Root, { type ToolGroupLabels } from "./tool-group.svelte";

export {
	Root,
	//
	// O GRUPO DE CHAMADAS. Ele é AUTÔNOMO e mora junto da resposta — acima dela,
	// dentro do turno do agente —, e por isso não sai do barril de nenhuma outra
	// peça: nenhum arquivo da conversa sabe que ele existe. Sai inteiro, e não só
	// em tipo, porque é quem consome que o monta, no lugar que escolher.
	Root as ToolGroup,
	type ToolGroupLabels,
};
