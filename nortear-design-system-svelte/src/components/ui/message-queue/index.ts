import Root, { type MessageQueueLabels } from "./message-queue.svelte";

export {
	Root,
	//
	// A FILA DE ENVIO. Ela é AUTÔNOMA e fica ACIMA do campo — o campo não sabe
	// que ela existe, e por isso ela não sai do barril da moldura: quem consome
	// empilha as duas peças. Sai inteira, e não só em tipo, porque é quem consome
	// que a monta.
	Root as MessageQueue,
	type MessageQueueLabels,
};
