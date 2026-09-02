<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Command as CommandPrimitive } from "bits-ui";
	import { createCommandEmptyContext } from "./command-context.js";

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
		...restProps
	}: CommandPrimitive.RootProps & {
		api?: CommandRootApi | null;
	} = $props();

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
	 * A lib publica o estado depois de filtrar e ordenar, uma vez por tique.
	 * O `onStateChange` de quem consome continua sendo chamado: este é o único
	 * ponto do componente que precisa do estado, e sequestrá-lo tiraria da API
	 * um gancho público.
	 */
	function handleStateChange(state: CommandStateSnapshot) {
		filteredCount = state.filtered.count;
		onStateChange?.(state);
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
-->

<CommandPrimitive.Root
	bind:this={api}
	bind:value
	bind:ref
	data-slot="command"
	onStateChange={handleStateChange}
	class={cn("nds-command", className)}
	{...restProps}
/>
