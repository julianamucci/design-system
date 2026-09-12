<script lang="ts">
	import * as Tooltip from "@/components/ui/tooltip/index.js";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		SIDEBAR_COOKIE_MAX_AGE,
		SIDEBAR_COOKIE_NAME,
		SIDEBAR_MOBILE_QUERY,
		SIDEBAR_WIDTH,
		SIDEBAR_WIDTH_ICON,
	} from "./constants.js";
	import { setSidebar } from "./context.svelte.js";

	// `defaultOpen` existia no conteúdo compartilhado, na tabela de props desta
	// stack e em dezesseis exemplos da docs page — e em lugar nenhum no
	// componente. Prop que não existe é aceita e ignorada em silêncio: o exemplo
	// "recolhida" nascia expandido, e nenhum teste reprovava. É o estado inicial
	// de quem não controla `open` de fora.
	let {
		ref = $bindable(null),
		defaultOpen = true,
		open = $bindable(defaultOpen),
		onOpenChange = () => {},
		mobileQuery = SIDEBAR_MOBILE_QUERY,
		class: className,
		style,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		defaultOpen?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/**
		 * Consulta de mídia abaixo da qual a barra vira gaveta sobreposta.
		 *
		 * O ponto de virada é do produto, não do design system — e é por aqui que
		 * um teste exercita o caminho móvel sem redimensionar o navegador.
		 */
		mobileQuery?: string;
	} = $props();

	const sidebar = setSidebar({
		open: () => open,
		mobileQuery: () => mobileQuery,
		setOpen: (value: boolean) => {
			open = value;
			onOpenChange(value);

			// This sets the cookie to keep the sidebar state.
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${open}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
	});
</script>

<svelte:window onkeydown={sidebar.handleShortcutKeydown} />

<!--
	Provedor de balão SEM `delayDuration`: o trilho HERDA os 300 ms que o wrapper
	da casa (`@/components/ui/tooltip`) fixa como padrão — D5 do PRD do tooltip,
	2026-09-12, igual nas cinco stacks.

	Havia `delayDuration={0}` cravado aqui, resíduo do shadcn: zero não é atraso,
	é ausência de atraso, então todo ponteiro que ATRAVESSAVA o trilho recolhido
	acendia balão. Declarar o número de novo — mesmo o número certo — recria a
	divergência que a decisão fechou: o dia em que a casa mudar de 300, o trilho
	fica para trás sozinho. O valor mora num lugar só, e é o wrapper.

	Trocar por `TooltipPrimitive.Provider` da bits-ui seria o defeito ao
	contrário: o padrão DELA é 700 ms, que ninguém escolheu.
-->
<Tooltip.Provider>
	<div
		data-slot="sidebar-wrapper"
		style="--sidebar-width: {SIDEBAR_WIDTH}; --sidebar-width-icon: {SIDEBAR_WIDTH_ICON}; {style}"
		class={cn("nds-sidebar-wrapper", className)}
		bind:this={ref}
		{...restProps}
	>
		{@render children?.()}
	</div>
</Tooltip.Provider>
