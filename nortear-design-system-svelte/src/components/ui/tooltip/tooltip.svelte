<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { fornecerDescription } from "./tooltip-descricao.svelte";

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
		...restProps
	}: TooltipPrimitive.RootProps & { defaultOpen?: boolean } = $props();

	// O id do balão nasce aqui, e não no conteúdo: o gatilho precisa dele mesmo
	// antes de o balão existir, para saber o que escrever quando abrir. Ver o
	// porquê em tooltip-descricao.svelte.ts.
	const id = `nds-tooltip-${uid}`;
	let montado = $state(false);

	fornecerDescription({
		get id() {
			return id;
		},
		get aberto() {
			return open;
		},
		get montado() {
			return montado;
		},
		marcarMontado(valor: boolean) {
			montado = valor;
		},
	});
</script>

<TooltipPrimitive.Root bind:open {...restProps} />
