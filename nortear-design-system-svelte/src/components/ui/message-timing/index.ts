import Root, {
	type MessageTimingLabels,
	type MessageTimingStat,
} from "./message-timing.svelte";

export {
	Root,
	//
	// O TEMPO DA RESPOSTA. Ele é AUTÔNOMO e mora ao pé de uma mensagem já
	// pronta, e por isso não sai do barril da conversa: nenhum arquivo da
	// moldura sabe que ele existe. Sai inteiro, e não só em tipo, porque é quem
	// consome que o monta, no lugar que escolher.
	Root as MessageTiming,
	type MessageTimingLabels,
	type MessageTimingStat,
};
