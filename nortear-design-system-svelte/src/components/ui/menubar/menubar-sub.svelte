<script lang="ts">
	import { Menubar as MenubarPrimitive } from "bits-ui";
	import { setMenuSub } from "@/components/ui/dropdown-menu/sub-escape";

	let { open = $bindable(false), ...restProps }: MenubarPrimitive.SubProps = $props();

	// O Escape dentro do submenu fecha só ele e devolve o foco ao gatilho — ver
	// `dropdown-menu/sub-escape.ts`: a lib é a mesma do DropdownMenu. Escrever
	// `open` por fora não passa pelo aviso da lib, então o aviso sai daqui.
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

<MenubarPrimitive.Sub bind:open {...restProps} />
