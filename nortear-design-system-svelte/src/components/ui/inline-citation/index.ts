import Root, {
	type InlineCitationCommands,
	type InlineCitationLabels,
} from "./inline-citation.svelte";

export {
	Root,
	//
	// A MARCA. Ela é AUTÔNOMA e vive dentro de texto corrido — quem escreve a
	// frase a põe onde a afirmação precisa de apoio —, e por isso não sai do
	// barril moldura nenhuma: o design system não é dono do parágrafo da
	// resposta, que é do modelo e é desenhado pelo Markdown ou pela conversa.
	//
	// A PRÉVIA NÃO SAI DAQUI, e não sairia mesmo que alguém pedisse: ela é filha
	// da marca e nasce da própria peça. Uma porta que a exportasse ensinaria uma
	// composição que a peça não pede — e a primeira coisa que quem copiasse essa
	// composição perderia é a ordem de tabulação que a filiação garante.
	Root as InlineCitation,
	type InlineCitationCommands,
	type InlineCitationLabels,
};
