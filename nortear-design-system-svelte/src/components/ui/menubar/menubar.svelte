<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { setMenubarRoot } from "./tab-leaves-menu";

	/**
	 * `value` declarado como bindable — e não `defaultValue`.
	 *
	 * Esta lib não tem a prop de valor inicial que as outras stacks expõem: o menu
	 * aberto é o `value` (bindable). Toda a docs page desta stack abria os
	 * exemplos pela prop inexistente, que era aceita e descartada em silêncio — e
	 * as demonstrações renderizavam FECHADAS ao lado de rótulos que prometiam
	 * "Menu Arquivo (com submenu)". Nada ficava vermelho.
	 *
	 * Declarar `value` aqui faz o `bind:value` funcionar de fora e mantém o menu
	 * interativo mesmo quando quem consome passa só o valor inicial — a cópia
	 * local continua mudando ao abrir e fechar. A divergência de nome em relação
	 * às outras stacks é de API de framework, e fica registrada assim.
	 */
	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		onValueChange,
		...restProps
	}: MenubarPrimitive.RootProps = $props();

	// A raiz, para o Tab que a lib deixa sem fechar quando o gatilho do menu
	// aberto é a última parada da página — ver `tab-leaves-menu.ts`. O
	// `onValueChange` sai do `restProps` só para que o fechamento vindo daqui
	// também avise quem consome.
	setMenubarRoot({
		isOpen: () => value !== "",
		close: () => {
			value = "";
			onValueChange?.("");
		},
	});
</script>

<MenubarPrimitive.Root
	bind:ref
	bind:value
	{onValueChange}
	data-slot="menubar"
	class={cn("nds-menubar", className)}
	{...restProps}
/>
