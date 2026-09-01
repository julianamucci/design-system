import Root, { type ComputerUseLabels } from "./computer-use.svelte";

export {
	Root,
	//
	// A TELA DO COMPUTADOR. Ela é AUTÔNOMA e fica onde a conversa acontece —
	// abaixo da linha da execução, ou entre as mensagens —, e por isso não sai do
	// barril de moldura nenhuma: nenhum arquivo do campo sabe que ela existe. Sai
	// inteira, e não só em tipo, porque é quem consome que a monta, no lugar que
	// escolher.
	//
	// A TELA QUE APARECE DENTRO É DE QUEM CONSOME, e o barril não a entrega: a
	// peça desenha a moldura, e o que se põe no quadro é espaço. Uma porta que
	// exportasse uma tela pronta ensinaria que a peça sabe desenhar a tela — que
	// é exatamente o contrário do contrato (§1 da guideline 17).
	Root as ComputerUse,
	type ComputerUseLabels,
};
