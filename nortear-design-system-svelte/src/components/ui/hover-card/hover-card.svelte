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
	// **Descrição sim, papel não** (decisão de 2026-09-02, que INVERTE a anterior).
	// O painel era `role="dialog"` nomeado pelo gatilho, e o gatilho não apontava
	// para ele — para não anunciar a mesma coisa duas vezes. O argumento estava
	// certo e resolvia o problema errado: a duplicação vinha de o painel ser um
	// diálogo homônimo, e isso era escolha nossa. Medido, o defeito era outro — com
	// o cartão ABERTO na tela, o leitor anunciava só o gatilho, porque nada leva o
	// foco ao painel e o `blur` fecha o cartão. Agora o painel não tem papel, e o
	// gatilho o DESCREVE por `aria-describedby` enquanto o cartão está aberto.
	//
	//  · GANHA-SE o anúncio do conteúdo, no foco do gatilho;
	//  · PERDE-SE o painel como nó com papel próprio na árvore de acessibilidade.
	//
	// O painel também não tem nome próprio: `aria-label` em elemento sem papel é
	// `aria-prohibited-attr` no axe, então o nome saiu junto com o papel em vez de
	// sobrar apontando para nada. `aria-labelledby` continua fora (trocaria o nome
	// do link pelo do cartão), e `aria-describedby` só existe enquanto o painel
	// existe — escrito na montagem seria `aria-valid-attr-value`.
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

	// A abertura entra no contexto por FUNÇÃO: lida assim, dentro do efeito do
	// conteúdo, ela é rastreada e a descrição some no mesmo instante em que o
	// cartão fecha.
	createContextoHoverCard(() => open);
</script>

<HoverCardPrimitive.Root bind:open {openDelay} {closeDelay} {...restProps} />
