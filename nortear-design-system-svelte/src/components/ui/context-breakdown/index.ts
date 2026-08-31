import Root, { type ContextBreakdownLabels } from "./context-breakdown.svelte";

export {
	Root,
	//
	// A REPARTIÇÃO DO CONTEXTO. Ela é AUTÔNOMA e convive com a medição da janela
	// sem que nenhuma das duas saiba da outra, então não sai do barril de peça
	// nenhuma: quem a usa a monta no lugar que escolher. Sai inteira — componente
	// e vocabulário —, porque é quem consome que decide a repartição.
	//
	// A API NÃO DIVERGE do primitivo de referência no que se pode chamar de
	// contrato, e é o caso raro em que isso vale ser dito: a peça é só leitura,
	// então não há retorno nem evento — o ponto em que as cinco stacks costumam
	// deixar de se parecer simplesmente não existe aqui. O que diverge é a FORMA,
	// e ela está registrada no bloco de módulo do componente: lá é fábrica com
	// objeto de opções, aqui é componente com props.
	//
	// `ContextPart` NÃO sai por aqui, e a ausência é decisão: ele é vocabulário
	// compartilhado, mora em `@shared/primitives/token-budget` e quem monta a
	// repartição já o importa de lá. Reexportá-lo criaria um segundo endereço
	// para o mesmo tipo, que é como duas definições do mesmo dado começam.
	Root as ContextBreakdown,
	type ContextBreakdownLabels,
};
