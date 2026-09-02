<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Command as CommandPrimitive } from "bits-ui";

	export type CommandRootApi = CommandPrimitive.Root;

	let {
		api = $bindable(null),
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		...restProps
	}: CommandPrimitive.RootProps & {
		api?: CommandRootApi | null;
	} = $props();
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

	Uma divergência ABERTA, e ela é de conteúdo: o VAZIO **não é anunciado**
	nesta stack. `Command.Empty` mora DENTRO do listbox (onde só `option` e
	`group` são filhos permitidos) e por isso sai como `role="option"`
	desabilitado, e não como região viva. vanilla, vue e angular põem a mensagem
	fora da lista com `role="status"` + `aria-live`, que é o que
	`accessibility.screenReader.onFilter` promete nas cinco docs pages.
	**Decisão da dona**, com o caminho medido: `Command.Root` aceita
	`onStateChange`, que entrega `filtered.count` — dá para montar a região viva
	fora da `Command.List` sem tocar na lib. Ver `command-empty.svelte`.
-->

<CommandPrimitive.Root
	bind:this={api}
	bind:value
	bind:ref
	data-slot="command"
	class={cn("nds-command", className)}
	{...restProps}
/>
