<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import PopoverPortal from "./popover-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { usarContextoPopover } from "./context.svelte.js";

	// O modo vem da RAIZ, não desta peça: `modal` é uma decisão do popover
	// inteiro, e o painel é só quem a executa.
	const contexto = usarContextoPopover();
	const modal = $derived(contexto?.modal === true);

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		align = "center",
		// `trapFocus` e `preventScroll` SÃO o mecanismo de `modal` nesta stack.
		//
		// O bits-ui é a única lib das quatro sem `modal` nenhum, e os padrões DELE
		// são `trapFocus: true` e `preventScroll: false` — ou seja, o painel prendia
		// o foco mesmo no modo padrão, contrariando o que a docs page desta stack
		// afirma ("Não-modal por padrão") e divergindo do Vanilla, que é a
		// referência. Amarrados a `modal`, os dois passam a seguir o contrato: sem
		// `modal`, `Tab` sai do painel e a página rola; com `modal`, o foco fica
		// preso e a rolagem trava.
		//
		// Ligar e desligar o trap NÃO mexe no resto do contrato: em
		// `focus-scope.svelte.js`, `#handleOpenAutoFocus` (foco entra no painel) e
		// `#handleCloseAutoFocus` (foco volta ao gatilho) rodam FORA do `trap` —
		// ele gateia só `#setupEventListeners`, o ouvinte que puxa de volta o foco
		// que escapou. Quem quiser um dos dois sem o outro ainda pode passá-los
		// explicitamente; o padrão é o modo do popover.
		trapFocus = undefined,
		preventScroll = undefined,
		portalProps,
		...restProps
	}: Omit<PopoverPrimitive.ContentProps, "trapFocus" | "preventScroll"> & {
		trapFocus?: boolean;
		preventScroll?: boolean;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();

	const effectiveTrapFocus = $derived(trapFocus ?? modal);
	const effectivePreventScroll = $derived(preventScroll ?? modal);

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
		trapFocus={effectiveTrapFocus}
		preventScroll={effectivePreventScroll}
		aria-modal={modal ? "true" : undefined}
		class={cn("nds-popover-content", className)}
		{...restProps}
	/>
</PopoverPortal>
