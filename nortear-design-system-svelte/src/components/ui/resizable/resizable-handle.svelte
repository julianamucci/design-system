<script lang="ts">
	import * as ResizablePrimitive from "paneforge";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		withHandle = false,
		disabled = false,
		'aria-orientation': ariaOrientation,
		...restProps
	}: WithoutChildrenOrChild<ResizablePrimitive.PaneResizerProps> & {
		withHandle?: boolean;
		'aria-orientation'?: 'horizontal' | 'vertical';
	} = $props();

	/**
	 * `aria-orientation` derivado, e não copiado à mão em cada story.
	 *
	 * O primitivo publica o eixo só como `data-direction` (a direção do GRUPO) e
	 * a marcação de acessibilidade ficava por conta de quem escrevia a story —
	 * bastava esquecer para o `role="separator"` sair sem eixo, e nenhum teste
	 * olhava. A INVERSÃO é intencional: o divisor de um grupo horizontal é uma
	 * linha VERTICAL.
	 */
	$effect(() => {
		const el = ref;
		if (!el) return;
		if (!ariaOrientation) {
			const doGrupo = el.getAttribute('data-direction');
			if (doGrupo) el.setAttribute('aria-orientation', doGrupo === 'horizontal' ? 'vertical' : 'horizontal');
		}
		// O primitivo crava `cursor: ew-resize`/`ns-resize` em `style` inline,
		// mesmo travado — e inline vence a folha compartilhada. Um divisor
		// desabilitado que continua anunciando o cursor do arrasto promete um
		// gesto que não acontece; a correção só alcança o valor no mesmo lugar
		// onde ele foi escrito.
		if (disabled) el.style.cursor = 'default';
	});
</script>

<ResizablePrimitive.PaneResizer
	bind:ref
	data-slot="resizable-handle"
	{disabled}
	aria-orientation={ariaOrientation}
	aria-disabled={disabled ? 'true' : undefined}
	data-disabled={disabled ? '' : undefined}
	class={cn(
		"nds-resizable-handle",
		className
	)}
	{...restProps}
>
	{#if withHandle}
		<div class="nds-resizable-grip-bar"></div>
	{/if}
</ResizablePrimitive.PaneResizer>
