<script lang="ts">
	/**
	 * Descrição do painel — `<p>`, como nas outras quatro stacks e na folha.
	 *
	 * Não usa a peça da lib, e o motivo está em
	 * `alert-dialog-description-registry.ts`: a da lib deixava o
	 * `aria-describedby` do painel apontando para um id sumido quando a descrição
	 * saía em tempo de execução. Aqui ela se registra no painel enquanto está
	 * montada e sai do registro ao desmontar; é o painel quem declara o atributo.
	 */
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { getDescriptionRegistry } from "./alert-dialog-description-registry.js";

	const uid = $props.id();

	let {
		ref = $bindable(null),
		id = `alert-dialog-description-${uid}`,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement> = $props();

	const registry = getDescriptionRegistry();

	// Relê o `id`: se quem consome o trocar, o registro acompanha. Sem id não há
	// o que referenciar, e o painel fica sem o atributo.
	$effect(() => {
		if (!id) return;
		return registry?.register(id);
	});
</script>

<p
	bind:this={ref}
	{id}
	data-slot="alert-dialog-description"
	class={cn("nds-alert-dialog-description", className)}
	{...restProps}
>
	{@render children?.()}
</p>
