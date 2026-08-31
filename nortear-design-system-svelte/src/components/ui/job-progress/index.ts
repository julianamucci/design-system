import Root, {
	type JobProgressIntent,
	type JobProgressLabels,
} from "./job-progress.svelte";

export {
	Root,
	//
	// O ANDAMENTO DE TRABALHO LONGO. Ele é AUTÔNOMO e fica onde a conversa
	// acontece — ao lado da linha da execução, ou numa fila dela —, e por isso
	// não sai do barril de moldura nenhuma: nenhum arquivo do campo sabe que ele
	// existe. Sai inteiro, e não só em tipo, porque é quem consome que o monta,
	// no lugar que escolher.
	//
	// A FILA É DE QUEM CONSOME: a porta entrega UMA peça, e empilhá-las é o que
	// produz a fila. Uma porta que recebesse a lista decidiria ordenação e
	// agrupamento, que são política de produto.
	Root as JobProgress,
	type JobProgressIntent,
	type JobProgressLabels,
};
