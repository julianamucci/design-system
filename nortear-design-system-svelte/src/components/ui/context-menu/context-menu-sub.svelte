<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { setContextMenuSubContext } from "./context";

	let { open = $bindable(false), ...restProps }: ContextMenuPrimitive.SubProps = $props();

	// O Escape dentro do submenu fecha só ele e devolve o foco ao gatilho — ver
	// `context.ts`. Escrever `open` por fora não passa pelo aviso da lib, então o
	// aviso sai daqui, como no fechamento por Tab da raiz.
	let trigger: HTMLElement | null = null;
	setContextMenuSubContext({
		setTrigger: (node) => {
			trigger = node;
		},
		closeToTrigger: () => {
			open = false;
			restProps.onOpenChange?.(false);
			trigger?.focus();
		},
	});
</script>

<ContextMenuPrimitive.Sub bind:open {...restProps} />
