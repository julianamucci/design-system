<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	import { usarDescription } from "./tooltip-descricao.svelte";

	let { ref = $bindable(null), ...restProps }: TooltipPrimitive.TriggerProps = $props();

	const descricao = usarDescription();

	// Escrito no nó, e não em prop: o `mergeProps` da lib põe as props DELA
	// depois das nossas, então um `aria-describedby` passado por prop seria
	// sobrescrito pela string vazia que ela calcula. Ler `montado` põe este
	// efeito no mesmo flush da escrita da lib, e efeitos de usuário rodam depois
	// dos de render — por isso a última palavra é esta.
	// Ver tooltip-descricao.svelte.ts.
	$effect(() => {
		const target = ref;
		if (!target || !descricao) return;
		const ligado = descricao.isOpen && descricao.montado;
		if (ligado) target.setAttribute("aria-describedby", descricao.id);
		else target.removeAttribute("aria-describedby");
	});
</script>

<TooltipPrimitive.Trigger bind:ref data-slot="tooltip-trigger" {...restProps} />
