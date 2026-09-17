<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import PopoverPortal from "./popover-portal.svelte";
	import { cn, type WithoutChildrenOrChild } from "@/lib/utils.js";
	import type { ComponentProps } from "svelte";
	import { usarContextoPopover } from "./context.svelte.js";
	import { hideOthers } from "./popover-hide-others.js";

	// O modo vem da RAIZ, não desta peça: `modal` é uma decisão do popover
	// inteiro, e o painel é só quem a executa.
	const contexto = usarContextoPopover();
	const modal = $derived(contexto?.modal === true);

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		align = "center",
		/**
		 * Deslocamento no eixo do ALINHAMENTO, em pixels. O par dele é o
		 * `sideOffset`, que desloca no eixo PRINCIPAL.
		 *
		 * DECLARADA, e não só repassada por spread. Até 2026-09-16 a diferença
		 * entre as duas coisas estava registrada como se fosse a mesma: a prop
		 * aparecia no bloco de interface da docs page desta stack e não existia
		 * em lugar nenhum do componente. "Repassado à lib" faz parecer entregue,
		 * e foi essa leitura que a remedição derrubou — `alignOffset` tinha ZERO
		 * ocorrência nos arquivos de popover desta stack.
		 */
		alignOffset = 0,
		// `trapFocus` e `preventScroll` SÃO o mecanismo de `modal` nesta stack.
		//
		// O bits-ui é a única lib das quatro sem `modal` nenhum, e os padrões DELE
		// são `trapFocus: true` e `preventScroll: false` — ou seja, o painel prendia
		// o foco mesmo no modo padrão, contrariando o que a docs page desta stack
		// afirma ("Não-modal por padrão") e divergindo do Vanilla, que é a
		// referência. Amarrados a `modal`, os dois passam a seguir o contrato: sem
		// `modal`, o foco não fica preso (o `Tab` para fora fecha o painel e volta
		// ao gatilho, ver `handleKeydown`) e a página rola; com `modal`, o foco fica
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
		/**
		 * Id do painel — é para ele que o `aria-controls` do gatilho aponta.
		 *
		 * DECLARADO aqui, e escrito no elemento pelo snippet `child` abaixo, por
		 * uma medição de 2026-09-17: o bits-ui 2.19 gera o id do Content e o
		 * PERDE no caminho — `popper-layer.svelte` o desestrutura das props e
		 * só o repassa à camada flutuante, cujas props de conteúdo não têm `id`.
		 * O painel nascia sem id nenhum, o estado do gatilho só publica
		 * `aria-controls` quando `contentNode.id` é verdadeiro, e o atributo
		 * nunca aparecia — aberto na montagem ou por clique.
		 */
		id: idProp,
		// Destacados para COMPOR com a anotação do motivo: sem isto, o handler
		// de quem consome sobrescreveria o nosso, ou o nosso o dele.
		onEscapeKeydown,
		onInteractOutside,
		onFocusOutside,
		onOpenAutoFocus,
		onCloseAutoFocus,
		onkeydown,
		customAnchor,
		child: childProp,
		children,
		...restProps
	}: Omit<PopoverPrimitive.ContentProps, "trapFocus" | "preventScroll"> & {
		trapFocus?: boolean;
		preventScroll?: boolean;
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof PopoverPortal>>;
	} = $props();

	/**
	 * `alignOffset` com `align="center"` — a metade da D14 que o bits não entrega.
	 *
	 * O bits posiciona pelo `@floating-ui`, e o middleware `offset` dele só
	 * aplica `alignmentAxis` quando há alinhamento (`start`/`end`): com
	 * `center`, o padrão, o deslocamento do eixo cruzado some sem aviso
	 * (`@floating-ui/core`, `if (alignment && typeof alignmentAxis === 'number')`).
	 * A base-ui e o radix-ng passam o valor também como `crossAxis`, e o vanilla
	 * o soma em qualquer alinhamento. Medido em 2026-09-17 pela `SideTop`, com
	 * `alignOffset: 8`: 0px no eixo cruzado.
	 *
	 * A correção entrega à lib uma âncora MEDÍVEL — o retângulo da âncora real
	 * deslizado no eixo cruzado — pelo `customAnchor`, que a lib aceita como
	 * referência virtual. O deslocamento entra ANTES das colisões, como no
	 * vanilla. Positivo empurra para o fim do eixo: direita em `top`/`bottom`,
	 * baixo em `left`/`right`. A âncora real é a de quem compõe, se houver, ou
	 * o gatilho registrado no contexto — lido a cada medição, porque o registro
	 * não é reativo.
	 */
	function resolveAnchor(): Element | null {
		if (typeof customAnchor === "string") return document.querySelector(customAnchor);
		if (customAnchor instanceof Element) return customAnchor;
		return contexto?.triggerElement ?? null;
	}

	const effectiveAnchor = $derived.by(() => {
		const shift = alignOffset ?? 0;
		if (align !== "center" || !shift) return customAnchor;
		// Âncora medível de quem compõe: desliza a medição dela.
		const measurable =
			customAnchor && typeof customAnchor !== "string" && !(customAnchor instanceof Element)
				? customAnchor
				: null;
		const horizontalShift = restProps.side !== "left" && restProps.side !== "right";
		return {
			get contextElement() {
				return resolveAnchor() ?? undefined;
			},
			getBoundingClientRect(): DOMRect {
				const rect = measurable
					? measurable.getBoundingClientRect()
					: (resolveAnchor()?.getBoundingClientRect() ?? new DOMRect());
				return horizontalShift
					? new DOMRect(rect.x + shift, rect.y, rect.width, rect.height)
					: new DOMRect(rect.x, rect.y + shift, rect.width, rect.height);
			},
		};
	});

	const effectiveTrapFocus = $derived(trapFocus ?? modal);
	const effectivePreventScroll = $derived(preventScroll ?? modal);

	const uid = $props.id();
	const panelId = $derived(idProp ?? `popover-content-${uid}`);

	/**
	 * O que conta como "primeiro elemento focável".
	 *
	 * `[tabindex="-1"]` fica de fora de propósito, e a regra vale para TODOS os
	 * seletores: é o marcador de foco PROGRAMÁTICO, não de parada na ordem de
	 * tabulação — e o próprio painel o carrega, posto pelo gerenciador de foco
	 * da lib (`focus-scope.svelte.js` devolve `tabindex: -1` nas props). Lista
	 * copiada do vanilla, que é a referência cross-stack.
	 */
	const FOCUSABLE = [
		"a[href]",
		"button:not([disabled])",
		"input:not([disabled])",
		"select:not([disabled])",
		"textarea:not([disabled])",
		"[tabindex]",
	]
		.map((selector) => `${selector}:not([tabindex="-1"])`)
		.join(", ");

	/**
	 * Para onde o foco vai ao ABRIR — o contrato C2, igual nas cinco desde
	 * 2026-09-16.
	 *
	 * Primeiro `[data-autofocus]` DENTRO do painel; sem marca, o primeiro
	 * focável; sem nenhum, o próprio painel. `[data-autofocus]` com
	 * `tabindex="-1"` VALE como alvo — é foco programático, que é exatamente o
	 * que o atributo pede —, e por isso ele é procurado ANTES e sem o filtro de
	 * tabulação que o `FOCUSABLE` aplica.
	 *
	 * O `preventDefault` desliga o auto-foco da lib, que iria ao primeiro
	 * TABULÁVEL e ignoraria a marca. O `requestAnimationFrame` é o mesmo quadro
	 * que ela usaria (`focus-scope.svelte.js`, `#handleOpenAutoFocus`): o painel
	 * nasce invisível esperando a medição do floating-ui, e `focus()` em
	 * elemento invisível é no-op.
	 *
	 * Quem consome é chamado primeiro e tem a palavra final: se ele já preveniu,
	 * a intenção dele é mais específica que esta política.
	 *
	 * O quadro pendente é GUARDADO e CANCELADO no fechamento, e o callback ainda
	 * confere que o painel segue aberto. Medido em 2026-09-17, com um rastro de
	 * cada `focus()` na suíte: este quadro rodou DEPOIS de o painel fechar e
	 * devolver o foco ao gatilho — o `isConnected` passava, porque o painel
	 * continua no DOM durante a saída —, focou o Cancelar do painel que saía, e a
	 * remoção do painel jogou o foco no `body`. É a causa do "focus did not
	 * return to trigger" da `Playground` e do foco no `body` da `Focused`: a
	 * devolução acontecia, e este quadro a desfazia.
	 */
	let focoPendente = 0;

	function handleOpenAutoFocus(event: Event): void {
		saiuPorTab = false;
		leftByFocus = false;
		onOpenAutoFocus?.(event);
		if (event.defaultPrevented) return;
		const el = ref;
		if (!el) return;
		event.preventDefault();
		cancelAnimationFrame(focoPendente);
		focoPendente = requestAnimationFrame(() => {
			focoPendente = 0;
			if (!el.isConnected || el.getAttribute("data-state") !== "open") return;
			const declared = el.querySelector<HTMLElement>("[data-autofocus]");
			const target = declared ?? el.querySelector<HTMLElement>(FOCUSABLE);
			(target ?? el).focus();
		});
	}

	/**
	 * `Tab` para FORA do painel FECHA e devolve o foco ao GATILHO — só no modo
	 * não-modal. Decisão da dona de 2026-09-17, igual nas cinco; o modelo é o
	 * ramo `!modal && e.key === 'Tab'` do `handleKeydown` do vanilla.
	 *
	 * "Para fora" é `Tab` a partir do ÚLTIMO focável, `Shift+Tab` a partir do
	 * PRIMEIRO, ou qualquer dos dois num painel sem focável nenhum. O motivo é
	 * `overlay`: saiu do painel sem decidir nada, como quem clica fora.
	 *
	 * Quem fecha é a TECLA, e não a camada de foco da lib, por medição: o painel
	 * mora em portal no FIM do `<body>`, então tabular para fora do último
	 * focável leva o foco para fora do DOCUMENTO — sem `focusin` em elemento
	 * nenhum, e o `onFocusOutside` do bits só existe por `focusin`. A suíte
	 * provou isso em 2026-09-17: o painel ficava aberto.
	 *
	 * Com `preventDefault`, porque o destino é o gatilho e não a ordem da página.
	 * `saiuPorTab` faz o `onCloseAutoFocus` abaixo confirmar o mesmo destino: a
	 * lib devolveria o foco ao elemento focado ANTES de abrir, que nem sempre é o
	 * gatilho (painel aberto por código).
	 */
	let saiuPorTab = false;

	// ─── Foco levado a OUTRO elemento do documento FECHA (D15) ──────────────
	//
	// Decisão da dona de 2026-09-17, igual nas cinco: no modo não-modal o painel
	// fica aberto só enquanto o foco está nele. Foco posto em outro elemento
	// fecha com `overlay`, uma vez, e FICA onde foi posto — `leftByFocus` faz o
	// `handleCloseAutoFocus` cancelar a devolução ao gatilho que a lib faria.
	//
	// O caminho é um ouvinte de `focusin` no documento, NOSSO: foco que sai do
	// DOCUMENTO (outra janela, barra de endereço) não gera `focusin` e não
	// fecha, que é o contrato. Quem fecha é `contexto.dismiss`.
	//
	// Até 2026-09-17 o caminho era o `onFocusOutside` do bits, e ele tem uma
	// JANELA CEGA logo depois de abrir: a camada dispensável só pendura o
	// ouvinte de `focusin` num `afterSleep(1)` depois de montar
	// (`use-dismissable-layer.svelte.js`), e o foco de abertura desta peça
	// chega num `requestAnimationFrame` — que pode vir ANTES. Foco levado a
	// outro elemento nesse intervalo não fechava nada. Medido pela `Focused`
	// com os passos na ordem das cinco: o passo "foco levado por código para
	// Antes" logo depois de reabrir reprovava de forma intermitente (painel
	// aberto, foco em "Antes"), e passava três vezes em três com 300 ms de
	// espera antes do `focus()`. O ouvinte daqui nasce no `$effect` da
	// montagem, antes do quadro de foco, e a peça não passa mais o callback à
	// lib — senão quem consome ouviria cada perda de foco duas vezes.
	//
	// Os conflitos, e onde cada um vira UM fechamento:
	//  - GATILHO: conta como parte do painel. Foi a disputa medida que tirou
	//    esta detecção entre 2026-09-16 e 2026-09-17: o `pointerdown` no
	//    gatilho o foca antes do `click`, a perda de foco fechava e o `click`,
	//    que ALTERNA, reabria. Com o gatilho ignorado aqui, só o `click` fecha.
	//  - CLIQUE FORA num focável: o `focusin` chega um tique depois; a camada
	//    de interação chega 10 ms depois (debounce da lib) e cai no
	//    `handleClose` da raiz, que não faz nada com o painel já fechado. Clique
	//    fora num NÃO focável não gera `focusin` e segue só pela interação.
	//  - TAB DA BORDA: `handleKeydown` fecha e foca o gatilho — ignorado aqui —,
	//    e o `dismiss` da raiz não fecha o que já está fechado.
	//  - QUADRO DE FOCO DE ABERTURA: cancelado aqui, como no Tab, para não focar
	//    um controle do painel que está saindo e roubar o foco do destino.
	let leftByFocus = false;

	function handleFocusOutside(event: FocusEvent): void {
		const el = ref;
		const target = event.target;
		// Foco que entra no PRÓPRIO painel não é perda de foco.
		if (!el || (target instanceof Node && el.contains(target))) return;
		onFocusOutside?.(event);
		if (event.defaultPrevented || modal) return;
		if (el.getAttribute("data-state") !== "open") return;
		if (target instanceof Node && contexto?.triggerElement?.contains(target)) return;
		leftByFocus = true;
		cancelAnimationFrame(focoPendente);
		contexto?.dismiss("overlay");
	}

	$effect(() => {
		const el = ref;
		if (!el) return;
		const doc = el.ownerDocument;
		doc.addEventListener("focusin", handleFocusOutside);
		return () => doc.removeEventListener("focusin", handleFocusOutside);
	});

	// ─── Modo modal: o resto da página escondido do leitor de tela ───────────
	//
	// Decisão da dona de 2026-09-17, igual nas cinco: SEMPRE que o modo é modal,
	// com ou sem peça de fechar. O bits não tem `modal` e não esconde nada — ver
	// `popover-hide-others.ts`, que também guarda o valor anterior de cada
	// elemento e o devolve exato. Aqui só se liga e desliga: nasce com o painel
	// no DOM e desfaz quando ele sai (ou quando a peça desmonta), e no modo
	// não-modal nem começa.
	$effect(() => {
		const el = ref;
		if (!el || !modal) return;
		return hideOthers(el);
	});

	function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }): void {
		onkeydown?.(event);
		if (event.defaultPrevented || modal || event.key !== "Tab") return;
		const el = ref;
		if (!el) return;
		const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
			(node) => !node.closest("[hidden]"),
		);
		const active = el.ownerDocument.activeElement;
		const isLeaving =
			!focusable.length ||
			(event.shiftKey ? active === focusable[0] : active === focusable[focusable.length - 1]);
		if (!isLeaving) return;
		event.preventDefault();
		saiuPorTab = true;
		cancelAnimationFrame(focoPendente);
		contexto?.dismiss("overlay");
		contexto?.triggerElement?.focus();
	}

	function handleCloseAutoFocus(event: Event): void {
		cancelAnimationFrame(focoPendente);
		onCloseAutoFocus?.(event);
		if (leftByFocus) {
			// O foco já está no destino que alguém escolheu: a lib o devolveria
			// ao elemento focado antes de abrir.
			leftByFocus = false;
			if (!event.defaultPrevented) event.preventDefault();
			return;
		}
		if (!saiuPorTab) return;
		saiuPorTab = false;
		if (event.defaultPrevented) return;
		event.preventDefault();
		contexto?.triggerElement?.focus();
	}

	// `role="dialog"` exige nome acessível (axe aria-dialog-name). Mesmo critério
	// do Vanilla, que é a referência cross-stack: um heading interno vira
	// aria-labelledby; sem heading, o texto do trigger vira aria-label.
	// Só age quando o consumidor não nomeou — nomear à mão sempre vence.
	$effect(() => {
		const el = ref;
		if (!el) return;

		// `aria-describedby`: a descrição é lida EM SEGUIDA ao nome, e os dois
		// papéis não se disputam — `labelledby` NOMEIA, `describedby` DESCREVE.
		// Nas cinco desde 2026-09-16: o conteúdo compartilhado já prometia o
		// atributo em três chaves × três idiomas e esta stack não o entregava,
		// enquanto uma story AFIRMAVA a ligação. Só age quando quem consome não
		// descreveu — descrever à mão sempre vence.
		if (!el.getAttribute("aria-describedby")) {
			const description = el.querySelector<HTMLElement>('[data-slot="popover-description"]');
			if (description) {
				if (!description.id) description.id = `${el.id || "popover"}-description`;
				el.setAttribute("aria-describedby", description.id);
			}
		}

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
		// O `aria-label` do gatilho vem ANTES do texto dele — mesma ordem do
		// vanilla (a referência), do react e do angular. Sem ela, gatilho só de
		// ícone não tem texto nenhum a herdar e o painel se chamava "Popover",
		// que não diz de que painel se trata.
		el.setAttribute(
			"aria-label",
			trigger?.getAttribute("aria-label")?.trim() || trigger?.textContent?.trim() || "Popover",
		);
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
		{alignOffset}
		customAnchor={effectiveAnchor}
		trapFocus={effectiveTrapFocus}
		preventScroll={effectivePreventScroll}
		onOpenAutoFocus={handleOpenAutoFocus}
		onCloseAutoFocus={handleCloseAutoFocus}
		onkeydown={handleKeydown}
		aria-modal={modal ? "true" : undefined}
		class={cn("nds-popover-content", className)}
		onEscapeKeydown={(e) => {
			contexto?.anotarMotivo("escape");
			onEscapeKeydown?.(e);
		}}
		onInteractOutside={(e) => {
			contexto?.anotarMotivo("overlay");
			onInteractOutside?.(e);
		}}
		{...restProps}
	>
		{#snippet child({ props, wrapperProps, ...snippetProps })}
			{#if childProp}
				{@render childProp({ props: { ...props, id: panelId }, wrapperProps, ...snippetProps })}
			{:else}
				<div {...wrapperProps}>
					<div {...props} id={panelId}>
						{@render children?.()}
					</div>
				</div>
			{/if}
		{/snippet}
	</PopoverPrimitive.Content>
</PopoverPortal>
