<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import { setContext } from "svelte";
	import { SELECT_LISTBOX_ID } from "./select-a11y.js";

	let {
		open = $bindable(false),
		value = $bindable(),
		...restProps
	}: SelectPrimitive.RootProps = $props();

	// Um id por instância — a mesma página monta vários selects. Desce por
	// contexto para o Trigger (aria-controls) e o Content (id).
	// `$props.id()` só é aceito como inicializador de declaração no topo.
	const uid = $props.id();
	setContext(SELECT_LISTBOX_ID, `nds-select-listbox-${uid}`);
</script>

<SelectPrimitive.Root bind:open bind:value={value as never} {...restProps} />
