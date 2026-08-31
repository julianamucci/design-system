import Root, {
	type CostBudget,
	type CostMeterLabels,
} from "./cost-meter.svelte";

export {
	Root,
	//
	// O CUSTO DE UMA EXECUÇÃO. Ele é AUTÔNOMO e fica onde a execução é relatada —
	// ao lado da medição da janela, ou ao pé da linha de estado —, e por isso não
	// sai do barril de moldura nenhuma: nenhum arquivo do campo sabe que ele
	// existe. Sai inteiro, e não só em tipo, porque é quem consome que o monta,
	// no lugar que escolher.
	//
	// O DINHEIRO É DE QUEM CONSOME: a porta entrega a peça, e a quantia chega
	// escrita de fora. Uma porta que exportasse um formatador convidaria a peça a
	// decidir moeda e idioma, que é exatamente o que ela não faz.
	Root as CostMeter,
	type CostBudget,
	type CostMeterLabels,
};
