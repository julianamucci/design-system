<script lang="ts">
	import { ContextMenu as ContextMenuPrimitive } from "bits-ui";
	import { setContextMenuRootContext } from "./context";

	let { open = $bindable(false), ...restProps }: ContextMenuPrimitive.RootProps = $props();

	// O painel fecha por aqui só no Tab que a lib deixa aberto — ver `context.ts`
	// e `dropdown-menu/tab-leaves-menu.ts`.
	// Escrever `open` por fora não passa pelo aviso da lib, então o aviso sai
	// daqui: quem consome mede o fechamento por `onOpenChange`.
	setContextMenuRootContext({
		isOpen: () => open,
		close: () => {
			open = false;
			restProps.onOpenChange?.(false);
		},
	});
</script>

<ContextMenuPrimitive.Root bind:open {...restProps} />
