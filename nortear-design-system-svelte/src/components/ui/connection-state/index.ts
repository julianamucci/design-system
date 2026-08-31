import Root, { type ConnectionStateLabels } from "./connection-state.svelte";

export {
	Root,
	//
	// O ESTADO DA LIGAÇÃO. Ele é AUTÔNOMO e fica onde a conversa acontece — ao
	// lado da linha da execução, ou acima dela —, e por isso não sai do barril
	// de moldura nenhuma: nenhum arquivo do campo sabe que ele existe. Sai
	// inteiro, e não só em tipo, porque é quem consome que o monta, no lugar que
	// escolher.
	//
	// O NOME DA PORTA É O NOME DA PEÇA, e ele coincide com o do tipo de estado
	// que vem de `@shared/primitives/chat-protocol`. Não é conflito: um é
	// componente e o outro é vocabulário, e quem precisar dos dois no mesmo
	// arquivo apelida o tipo. Renomear a porta para fugir disso ensinaria uma
	// tag que ninguém escreve.
	Root as ConnectionState,
	type ConnectionStateLabels,
};
