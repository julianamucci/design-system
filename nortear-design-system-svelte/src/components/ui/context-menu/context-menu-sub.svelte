<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { setMenuSub } from "@/components/ui/dropdown-menu/sub-escape";

	let { open = $bindable(false), ...restProps }: ContextMenuPrimitive.SubProps = $props();

	// O Escape dentro do submenu fecha só ele e devolve o foco ao gatilho — ver
	// `dropdown-menu/sub-escape.ts`: a lib é a mesma do DropdownMenu. Escrever
	// `open` por fora não passa pelo aviso da lib, então o aviso sai daqui, como
	// no fechamento por Tab da raiz.
	let trigger: HTMLElement | null = null;
	setMenuSub({
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
