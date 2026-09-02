<script lang="ts">
	import { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import { createContextoHoverCard } from "./context.svelte.js";

	// ─── Acessibilidade: o cartão é enriquecimento, e o teclado não entra nele ──
	//
	// Abre por PONTEIRO e por FOCO, fecha no `blur` do gatilho e não move o foco
	// para o painel — então um Tab a partir do gatilho fecha o cartão antes de
	// alcançar o que houver dentro. Conteúdo interativo no painel é inalcançável
	// por teclado, e isso vale nas cinco stacks: é a forma do gesto, não defeito de
	// uma delas. Daí as três regras — nada de ação, link ou campo no painel; o
	// gatilho continua sendo o caminho; abrir por foco é obrigatório.
	//
	// O gatilho não recebe `aria-describedby` nem `aria-labelledby`: o painel é
	// `role="dialog"` e já tira o nome do texto do gatilho, então apontar um para o
	// outro faria o leitor anunciar a mesma coisa duas vezes.
	//
	// **Mecanismo desta stack** (medido em `node_modules`): o gatilho abre em
	// `pointerenter` (com guarda de toque) e em `focus` filtrado por foco visível —
	// foco programático NÃO abre. O painel cancela o fechamento no próprio
	// `pointerenter`, e o Escape tem manipulador próprio. O primitivo ainda descreve
	// o gatilho como botão de menu (`role`, `aria-haspopup`, `aria-expanded`); os
	// três são removidos em `hover-card-trigger.svelte`, com o motivo lá.
	//
	// Bloco canônico, com a comparação contra tooltip e popover e as três condições
	// da WCAG 1.4.13: `hover-card.ts` do Vanilla.

	// PATCH: api — `defaultOpen` não existe no LinkPreview do bits-ui, mas é a
	// API documentada do HoverCard nas 5 stacks (ver PATCHES.md#svelte-hovercard-defaultopen).
	// Vira o valor inicial de `open`, preservando `bind:open` no consumidor.
	//
	// Espera padrão do design system: 600ms para abrir, 300ms para fechar. O
	// bits-ui traz 700/300, e este arquivo trazia 0/0 — o cartão abria no mesmo
	// instante do hover, que é justamente o que a diretriz de uso desaconselha,
	// e a story chamada "Default (700ms / 300ms)" documentava um tempo que nunca
	// existiu.
	let {
		defaultOpen = false,
		open = $bindable(defaultOpen),
		openDelay = 600,
		closeDelay = 300,
		...restProps
	}: HoverCardPrimitive.RootProps & { defaultOpen?: boolean } = $props();

	createContextoHoverCard();
</script>

<HoverCardPrimitive.Root bind:open {openDelay} {closeDelay} {...restProps} />
