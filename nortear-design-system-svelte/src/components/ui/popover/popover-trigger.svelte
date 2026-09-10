<script lang="ts">
	import { cn } from "@/lib/utils.js";
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { usarContextoPopover } from "./context.svelte.js";

	const contexto = usarContextoPopover();

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: PopoverPrimitive.TriggerProps = $props();

	// Clique no gatilho com o painel ABERTO fecha — e é `overlay`, não `api`. O
	// drawer manda esse caminho para `api` porque ali o gatilho fica coberto pelo
	// véu; o popover é não-modal, o gatilho continua clicável, e o clique é
	// vontade de quem usa.
	function aoClicar(e: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (e.currentTarget.dataset.state === "open") contexto?.anotarMotivo("overlay");
		onclick?.(e);
	}
</script>

<PopoverPrimitive.Trigger
	bind:ref
	data-slot="popover-trigger"
	class={cn("", className)}
	onclick={aoClicar}
	{...restProps}
/>
