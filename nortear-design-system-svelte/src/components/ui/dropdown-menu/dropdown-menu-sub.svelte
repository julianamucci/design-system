<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
	import { setMenuSub } from "./sub-escape";

	let { open = $bindable(false), ...restProps }: DropdownMenuPrimitive.SubProps = $props();

	// O Escape dentro do submenu fecha só ele e devolve o foco ao gatilho — ver
	// `sub-escape.ts`. Escrever `open` por fora não passa pelo aviso da lib, então
	// o aviso sai daqui.
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

<DropdownMenuPrimitive.Sub bind:open {...restProps} />
