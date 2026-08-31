import Root, {
	type QuotaAllowance,
	type QuotaBannerLabels,
} from "./quota-banner.svelte";

export {
	Root,
	//
	// A FAIXA DE COTA. Ela é AUTÔNOMA e fica onde a cota se gasta — acima do
	// campo, ao lado da medição da janela —, e por isso não sai do barril de
	// moldura nenhuma: nenhum arquivo da conversa sabe que ela existe. Sai
	// inteira, e não só em tipo, porque é quem consome que a monta, no lugar que
	// escolher.
	//
	// A CONTA NÃO SAI DAQUI: o resto, a razão, o limiar e o nível vivem em
	// `@shared/primitives/token-budget`, e é de lá que as outras medições da tela
	// leem as MESMAS respostas. Uma porta que reexportasse a subtração convidaria
	// cada consumidor a escrever a sua — e um dia uma delas mostraria "-14
	// mensagens restantes".
	//
	// A API DIVERGE do primitivo de referência num ponto, e é assim que tem de
	// ser: lá o espaço dos controles é uma lista de nós do documento passada por
	// propriedade; aqui os controles entram como um SNIPPET, que é a forma desta
	// stack para "o componente dá o lugar, e quem consome decide" — a mesma que a
	// conversa e o cartão de autorização já fixaram. Divergência de API de
	// framework não se "alinha": registra-se.
	//
	// O que NÃO diverge é o resto, e é o que importa: a marcação, as classes
	// `.nds-*`, o `data-slot` de cada parte, o `data-level` sempre presente, a
	// ausência de região viva e de papel ARIA, e a ordem — manchete, medidor,
	// razão, controles.
	Root as QuotaBanner,
	type QuotaAllowance,
	type QuotaBannerLabels,
};
