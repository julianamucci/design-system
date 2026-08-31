import Root, { type TerminalBlockLabels } from "./terminal-block.svelte";

export {
	Root,
	//
	// O BLOCO DE TERMINAL. Ele é AUTÔNOMO e fica onde a conversa acontece —
	// abaixo da linha da execução, ou numa sequência de comandos —, e por isso
	// não sai do barril de moldura nenhuma: nenhum arquivo do campo sabe que ele
	// existe. Sai inteiro, e não só em tipo, porque é quem consome que o monta,
	// no lugar que escolher.
	//
	// A SEQUÊNCIA É DE QUEM CONSOME: a porta entrega UM comando, e empilhá-los é
	// o que produz a sequência. Uma porta que recebesse a lista decidiria
	// ordenação e agrupamento, que são política de produto.
	Root as TerminalBlock,
	type TerminalBlockLabels,
};
