<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	import { usarContextoPopover } from "./context.svelte.js";

	const contexto = usarContextoPopover();

	let { ref = $bindable(null), onclick, ...restProps }: PopoverPrimitive.CloseProps = $props();

	function aoClicar(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		contexto?.anotarMotivo("close-button");
		onclick?.(e);
	}
</script>

<PopoverPrimitive.Close bind:ref data-slot="popover-close" onclick={aoClicar} {...restProps} />
