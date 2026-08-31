import Root, { type ApprovalScopeItem } from "./approval-card.svelte";

export {
	Root,
	//
	// O CARTÃO DE AUTORIZAÇÃO. Ele é AUTÔNOMO e fica À VISTA, onde a conversa
	// acontece — acima da caixa recolhida de onde saiu, e nunca dentro dela —, e
	// por isso não sai do barril de moldura nenhuma: nenhum arquivo da conversa
	// sabe que ele existe. Sai inteiro, e não só em tipo, porque é quem consome
	// que o monta, no lugar que escolher.
	//
	// A API DIVERGE do primitivo de referência num ponto, e é assim que tem de
	// ser: lá o espaço dos controles é uma lista de nós do documento passada por
	// propriedade; aqui os controles entram por um SNIPPET, que é a forma desta
	// stack para "o componente dá o lugar, e quem consome decide". O aviso da
	// escolha continua sendo `onChoose`, com o mesmo nome e a mesma forma.
	// Divergência de API de framework não se "alinha": registra-se.
	//
	// O que NÃO diverge é o resto, e é o que importa: o desenho, a marcação, a
	// região viva que envolve a pergunta e o alcance e para antes dos controles,
	// a lista de definição do alcance, e o atributo `data-approval-choice` — o
	// único pedaço do contrato que atravessa a fronteira do que a peça desenha.
	Root as ApprovalCard,
	type ApprovalScopeItem,
};
