<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Command as CommandPrimitive, computeCommandScore } from "bits-ui";
	import {
		createCommandEmptyContext,
		createCommandLabelRegistry,
		createCommandSearchContext,
	} from "./command-context.js";

	export type CommandRootApi = CommandPrimitive.Root;

	type CommandStateSnapshot = Parameters<
		NonNullable<CommandPrimitive.RootProps["onStateChange"]>
	>[0];

	let {
		api = $bindable(null),
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		onStateChange,
		// Padrão da lib é `true` — desligado aqui, ver o bloco "Atalhos de
		// estilo vim" na marcação. Quem consome ainda pode religar.
		vimBindings = false,
		filter,
		children,
		...restProps
	}: CommandPrimitive.RootProps & {
		api?: CommandRootApi | null;
	} = $props();

	/**
	 * O filtro compara a busca com o valor E com o rótulo do comando (C9).
	 *
	 * A lib pontua o `value` mais as `keywords`; o rótulo entra aqui, somado às
	 * `keywords` de quem consome, na hora de pontuar — ver o porquê em
	 * `command-context.ts` (registro de rótulos). O atalho não entra: o rótulo
	 * é o texto do comando sem ele. Rótulo igual ao valor não se repete, para
	 * a busca não casar pedaços das duas cópias emendadas. O `filter` de quem
	 * consome continua valendo, e recebe as mesmas palavras.
	 */
	const labels = createCommandLabelRegistry();

	function filterWithLabel(itemValue: string, search: string, keywords?: string[]): number {
		const label = labels.labelOf(itemValue);
		const words =
			label && label.toLowerCase() !== itemValue.toLowerCase()
				? [...(keywords ?? []), label]
				: keywords;
		return (filter ?? computeCommandScore)(itemValue, search, words);
	}

	/**
	 * Quantos comandos sobraram do filtro, na última publicação da lib.
	 *
	 * Nasce em 0 porque é com 0 que o estado da lib nasce — a contagem só é
	 * calculada quando o primeiro comando se registra, um tique depois. Começar
	 * em outro valor faria a paleta SEM comando nenhum (a que está carregando,
	 * por exemplo) nunca se declarar vazia, que é o oposto do que as outras
	 * stacks fazem.
	 */
	let filteredCount = $state(0);

	createCommandEmptyContext(() => filteredCount === 0);

	/**
	 * O placeholder do campo, que o campo publica e a lista usa como nome — ver
	 * `command-context.ts`. A raiz só guarda: é o ancestral comum dos dois.
	 */
	let searchPlaceholder = $state<string | undefined>(undefined);

	createCommandSearchContext({
		get placeholder() {
			return searchPlaceholder;
		},
		set placeholder(next) {
			searchPlaceholder = next;
		},
	});

	/**
	 * A lib publica o estado depois de filtrar e ordenar, uma vez por tique.
	 * O `onStateChange` de quem consome continua sendo chamado: este é o único
	 * ponto do componente que precisa do estado, e sequestrá-lo tiraria da API
	 * um gancho público.
	 */
	function handleStateChange(state: CommandStateSnapshot) {
		filteredCount = state.filtered.count;
		onStateChange?.(state);
	}

	/**
	 * As props que a lib funde para a raiz, sem `role` e sem `tabindex` — ver o
	 * comentário da marcação. Cópia, e não mutação: o objeto é da lib. O
	 * espalhamento copia também as chaves de símbolo, e é numa delas que vem o
	 * `attachRef` que preenche `ref`.
	 */
	function withoutRootFocus(props: Record<string, unknown>): Record<string, unknown> {
		const rest = { ...props };
		delete rest.role;
		delete rest.tabindex;
		return rest;
	}
</script>

<!--
	─── DECISÃO DE ACESSIBILIDADE — versão curta ───────────────────────────────

	Bloco canônico no `command.ts` do Vanilla. Em uma frase: a paleta é um
	COMBOBOX com listbox, e o que a define é o foco NUNCA sair do campo de busca —
	as setas movem o destaque, e quem conta ao leitor de tela onde ele está é o
	`aria-activedescendant`. É o que a separa do dropdown-menu (que move o foco de
	verdade), do popover (que recebe foco) e do tooltip (que nem recebe).

	─── O mecanismo NESTA stack ───────────────────────────────────────────────────

	Medido em `bits-ui` (2026-09-02). A lib tem `Command.Root` de verdade, com
	`role="combobox"` no Input, `role="listbox"` na List e `role="option"` no
	Item. A particularidade desta stack é de onde saem os dois atributos que
	fecham o par: o bits-ui deriva `aria-controls` e `aria-activedescendant` do
	VIEWPORT, não da lista. Sem um `Command.Viewport` montado os dois nascem
	`undefined` — o campo não aponta para lista nenhuma e as setas não anunciam
	nada. Por isso `command-list.svelte` funde lista e viewport num nó só: assim
	o id apontado É o do `role="listbox"`. Ver o comentário de lá.

	O VAZIO é anunciado desde 2026-09-02, e o caminho passa por aqui: a raiz
	assina `onStateChange` — prop pública do `Command.Root`, medida em
	`bits-ui/dist/bits/command/types.d.ts` — e publica `filtered.count` num
	contexto. `command-empty.svelte` lê esse contexto e deixou de embrulhar o
	`Command.Empty` da lib, porque a região viva precisa ficar FORA do
	`Command.List` e montada o tempo todo, que é a forma do Vanilla. Ver o
	comentário de lá, que carrega a medição do axe.

	─── A raiz não tem papel nem parada de foco (2026-09-10) ─────────────────────

	O `CommandRootState` do bits-ui 2.19.0 (`command.svelte.js`, `props`) põe
	`role="application"` e `tabindex="-1"` na raiz, e o `mergeProps` aplica as
	props da lib DEPOIS das de quem consome — passar `role` por prop não vence.
	O Vanilla, que é a referência, não tem papel na raiz, e os dois atributos
	custam caro:

	  · `role="application"` manda o leitor de tela para o modo de foco na
	    região inteira e desliga os atalhos de navegação dele — um papel que a
	    ARIA reserva para widget que reimplementa TODO o teclado, e aqui quem
	    tem teclado é o combobox, que já tem papel próprio;
	  · `tabindex="-1"` torna a raiz alvo de foco por clique: clicar no
	    cabeçalho de um grupo levava o foco do campo para um `<div>` sem nome.

	O contorno é o snippet `child`, que a lib oferece para isso mesmo: ela
	entrega as props fundidas e quem renderiza é este componente, que as
	espalha sem os dois atributos (`withoutRootFocus`). O resto chega intacto: o `onkeydown` da lib continua na raiz (a tecla sobe
	do campo por bolha, e não precisa de foco na raiz para chegar), e o
	`attachRef` segue no espalhamento, então `ref` continua preenchido. O que
	o `tabindex` fazia de útil sem querer — segurar o foco perto do teclado
	depois de um clique num item — passou para a lista, que cancela o
	`mousedown` e deixa o foco no campo (ver `command-list.svelte`).

	Custo medido, e aceito: com `child`, a lib renderiza o `<label>` sr-only
	dela (o do prop `label`, vazio por padrão) como IRMÃO da raiz em vez de
	filho — o `aria-labelledby` do campo resolve por id, então nada muda para o
	leitor de tela, e o nó é `sr-only`, então nada muda na tela.

	─── Atalhos de estilo vim, desligados (2026-09-10) ──────────────────────────

	O `Command.Root` do bits-ui liga por padrão Ctrl+N/J (desce) e Ctrl+P/K
	(sobe) no `onkeydown` da raiz. Ctrl+K é o atalho que abre a paleta na docs
	page: com o campo inline focado, a mesma tecla subia o destaque E abria a
	paleta ao mesmo tempo. O conteúdo compartilhado não promete esses atalhos,
	e o PRD registra a decisão em "Atalhos de estilo vim, desligados". Guardado
	pela story `Playground` ("Ctrl+K no campo não move o destaque").

	─── O primeiro comando HABILITADO nasce em destaque (D11) ────────────────────

	Vem da lib, sem código aqui: o `CommandRootState` do bits-ui 2.19.0
	(`#selectFirstItem`, chamado ao montar, a cada busca e ao apagar a busca)
	escolhe o primeiro de `getValidItems()`, que já exclui
	`[aria-disabled="true"]`, em ordem de DOM. Guardado pela `Playground` (ao
	montar, depois de buscar, e Enter logo depois de digitar) e pela
	`ItemDisabled` (a busca cujo melhor resultado é o desabilitado).
-->

<CommandPrimitive.Root
	bind:this={api}
	bind:value
	bind:ref
	data-slot="command"
	{vimBindings}
	filter={filterWithLabel}
	onStateChange={handleStateChange}
	class={cn("nds-command", className)}
	{...restProps}
>
	{#snippet child({ props })}
		<div {...withoutRootFocus(props)}>
			{@render children?.()}
		</div>
	{/snippet}
</CommandPrimitive.Root>
