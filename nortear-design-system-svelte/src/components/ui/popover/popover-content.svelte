<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import PopoverPortal from "./popover-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		align = "center",
		// NÃO-MODAL por padrão, e é aqui que esta stack se alinha às outras quatro.
		//
		// O bits-ui é a única lib das cinco sem `modal` nenhum: o que ele tem é
		// `trapFocus` no Content, e o padrão DELE é `true`. Sem esta linha o painel
		// prendia o foco — `Tab` não saía —, contrariando o que a própria docs page
		// desta stack afirma ("Não-modal por padrão — o usuário pode interagir com o
		// resto da página") e divergindo do Vanilla, que é a referência.
		//
		// Desligar o trap NÃO tira o que o contrato promete: em
		// `focus-scope.svelte.js`, `#handleOpenAutoFocus` (foco entra no painel) e
		// `#handleCloseAutoFocus` (foco volta ao gatilho) rodam fora do `trap` —
		// ele gateia só `#setupEventListeners`, o ouvinte que puxa de volta o foco
		// que escapou. Quem precisar do modo preso passa `trapFocus` explicitamente.
		trapFocus = false,
		portalProps,
		...restProps
	}: PopoverPrimitive.ContentProps & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();

	// `role="dialog"` exige nome acessível (axe aria-dialog-name). Mesmo critério
	// do Vanilla, que é a referência cross-stack: um heading interno vira
	// aria-labelledby; sem heading, o texto do trigger vira aria-label.
	// Só age quando o consumidor não nomeou — nomear à mão sempre vence.
	$effect(() => {
		const el = ref;
		if (!el) return;
		if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return;

		const heading = el.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
		if (heading) {
			if (!heading.id) heading.id = `${el.id || "popover"}-title`;
			el.setAttribute("aria-labelledby", heading.id);
			return;
		}
		const trigger = el.ownerDocument.querySelector<HTMLElement>(
			'[aria-haspopup="dialog"][aria-expanded="true"]',
		);
		el.setAttribute("aria-label", trigger?.textContent?.trim() || "Popover");
	});
</script>

<PopoverPortal {...portalProps}>
	<!-- role="dialog": o bits-ui não emite role no conteúdo, mas põe
	     aria-haspopup="dialog" no trigger. Sem o par, o leitor de tela anuncia
	     "abre diálogo" e o que abre não é um diálogo. O Vanilla — referência
	     cross-stack — já define role="dialog" no painel. -->
	<PopoverPrimitive.Content
		bind:ref
		data-slot="popover-content"
		role="dialog"
		{sideOffset}
		{align}
		{trapFocus}
		class={cn("nds-popover-content", className)}
		{...restProps}
	/>
</PopoverPortal>
