<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { fornecerDescription } from "./tooltip-descricao.svelte";
	//
	// ─── Acessibilidade: a decisão, medida nas cinco stacks em 2026-09-02 ────────
	//
	// 1. Abre por FOCO além de ponteiro, e o foco abre sem espera (WCAG 2.1.1).
	// 2. Escape fecha sem mover o foco (WCAG 1.4.13, Dismissible).
	// 3. Pairável e persistente por COORDENADA: a folha dá `pointer-events: none`
	//    ao balão, então quem segura a abertura é a área de tolerância entre
	//    gatilho e balão, e não um hover no nó (WCAG 1.4.13, Hoverable).
	// 4. O gatilho é DESCRITO pelo balão (`aria-describedby`, e só enquanto o balão
	//    existe), nunca NOMEADO por ele. Gatilho icon-only carrega `aria-label`
	//    próprio: em touch não há hover.
	// 5. Nada de região viva — o balão é `role="tooltip"`, e o anúncio chega pela
	//    descrição do gatilho, ao focar.
	//
	// Texto canônico, com o porquê de cada uma: cabeçalho do tooltip do Vanilla,
	// que é a referência de comportamento.
	//
	// Mecanismo nesta stack: os primitivos do `bits-ui`, cujo `SafePolygon` mede a
	// tolerância em coordenada. A ponte `id`/`aria-describedby` é montada por
	// fora — ver tooltip-descricao.svelte.ts.
	//

	const uid = $props.id();

	// `delayDuration` NÃO tem default aqui: a espera é decisão do Provider, que é
	// quem a compartilha entre os tooltips vizinhos. Fixar 0 na raiz fazia toda
	// instância ignorar o Provider em silêncio — o hover abria na hora mesmo com
	// espera configurada, e nenhuma asserção via, porque nenhuma media o tempo.
	//
	// `defaultOpen` não existe no bits-ui: a prop era aceita e ignorada, e as
	// oito demonstrações da docs page que a usavam nunca abriam o balão. A API
	// real é `open` (bindable), e inicializá-la com `defaultOpen` cobre o uso
	// não-controlado que o conteúdo compartilhado documenta.
	let {
		defaultOpen = false,
		open = $bindable(defaultOpen),
		onOpenChange,
		...restProps
	}: TooltipPrimitive.RootProps & { defaultOpen?: boolean } = $props();

	// O balão nunca nasce aberto PARA A LIB — ele abre um tick depois, e a ORDEM
	// é o assunto. O bits registra a âncora quando o gatilho monta e calcula a
	// posição uma vez, ao nascer o floating layer: aberto no MESMO tick, ele
	// nasce sem âncora e não há recálculo. `isPositioned` fica falso para sempre,
	// o wrapper congela em `translate(0, -200%)` e as variáveis saem
	// `undefinedpx` — medido em 2026-09-04. Era o que a pessoa via, porque TODAS
	// as demonstrações da docs page nascem abertas; a mesma cena aberta por hover
	// posicionava certo.
	//
	// O adiamento é da LIB, não do estado: `open` continua sendo a verdade para
	// quem controla de fora, e o retorno da lib volta por `onOpenChange`. Por
	// isso não dá para resolver com `defaultOpen` — as stories passam `open`
	// direto, controlado.
	let raizMontada = $state(false);
	$effect(() => {
		raizMontada = true;
	});
	const abertoParaLib = $derived(raizMontada && open);

	// O id do balão nasce aqui, e não no conteúdo: o gatilho precisa dele mesmo
	// antes de o balão existir, para saber o que escrever quando abrir. Ver o
	// porquê em tooltip-descricao.svelte.ts.
	const id = `nds-tooltip-${uid}`;
	let montado = $state(false);

	fornecerDescription({
		get id() {
			return id;
		},
		get isOpen() {
			return open;
		},
		get montado() {
			return montado;
		},
		marcarMontado(value: boolean) {
			montado = value;
		},
	});
</script>

<TooltipPrimitive.Root
	{...restProps}
	open={abertoParaLib}
	onOpenChange={(v) => {
		open = v;
		onOpenChange?.(v);
	}}
/>
