import Root, {
	type ContextDisplayForm,
	type ContextDisplayLabels,
} from "./context-display.svelte";

export { CONTEXT_DISPLAY_FORMS } from "./context-display.svelte";

export {
	Root,
	//
	// O USO DO CONTEXTO. Ele é AUTÔNOMO e fica ao lado do campo de mensagem —
	// acima dele ou ao pé da conversa —, e por isso não sai do barril da moldura:
	// nenhum arquivo do campo sabe que ele existe. Sai inteiro, e não só em tipo,
	// porque é quem consome que o monta, no lugar que escolher.
	Root as ContextDisplay,
	type ContextDisplayForm,
	type ContextDisplayLabels,
};
