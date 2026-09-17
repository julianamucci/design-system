<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { createContextoPopover, type PopoverCloseReason } from "./context.svelte.js";

	/**
	 * MODAL OU NÃO-MODAL — versão curta. O bloco canônico é o cabeçalho do
	 * `popover.ts` do Vanilla, medido na fonte das cinco libs em 2026-09-02.
	 *
	 * O Popover é NÃO-MODAL POR PADRÃO: o foco ENTRA no painel ao abrir (é o que
	 * o separa do tooltip), mas NÃO fica preso: sair com `Tab` do último
	 * focável, ou com `Shift+Tab` do primeiro, FECHA o painel (motivo `overlay`)
	 * e DEVOLVE o foco ao GATILHO — decisão da dona em 2026-09-17. Painel sem
	 * focável nenhum fecha com qualquer dos dois. Foco levado a OUTRO elemento
	 * da página — que não o gatilho — também fecha (`overlay`), e o foco fica
	 * onde foi posto (D15). No modo MODAL não vale: lá o
	 * foco fica preso e não há "sair". Por isso o painel só recebe `aria-modal`
	 * no modo modal. `Escape`
	 * fecha e devolve o foco ao gatilho; clique fora fecha; o gatilho declara
	 * `aria-expanded` e `aria-haspopup="dialog"`; nenhuma região viva.
	 *
	 * `modal` foi ENTREGUE nas cinco em 2026-09-02: prende o foco, trava a
	 * rolagem e anuncia `aria-modal` (e, desde 2026-09-17, esconde o resto da
	 * página do leitor de tela), os quatro juntos. O padrão continua
	 * não-modal.
	 *
	 * Mecanismo desta stack: o bits-ui é a ÚNICA das quatro libs sem `modal` — o
	 * que ele tem, os dois no Content, é `trapFocus` (padrão da LIB `true`) e
	 * `preventScroll` (padrão `false`). São esses dois que passam a ser o
	 * mecanismo de `modal` aqui; quem os liga é `popover-content.svelte`, lendo
	 * o contexto que esta raiz publica.
	 *
	 * E, desde 2026-09-17, igual nas cinco: no modo modal o resto da página fica
	 * escondido do leitor de tela (`aria-hidden`), sempre. O bits não esconde
	 * nada, então quem faz é `popover-hide-others.ts`, ligado pelo mesmo painel.
	 */
	let {
		open = $bindable(false),
		/**
		 * Modo MODAL. Padrão `false`, que é o popover normal desta casa.
		 *
		 * `true` prende o foco no painel, trava a rolagem da página, faz o
		 * painel anunciar `aria-modal="true"` e esconde o resto da página do
		 * leitor de tela. Os quatro andam juntos: anunciar inércia sem prender o
		 * foco nem esconder o resto é mentir para quem usa leitor de tela.
		 *
		 * A prop é NOSSA — a raiz da lib não tem `modal` para receber, então ela
		 * não entra no spread abaixo.
		 */
		modal = false,
		/**
		 * Chamado a cada mudança de estado — e no FECHAMENTO chega também o
		 * motivo, no vocabulário do design system. É a forma de base-ui
		 * (`onOpenChange(open, detalhes)`) e radix-ng (`evento.reason`): o motivo
		 * viaja com a mudança DESTA instância.
		 */
		onOpenChange,
		...restProps
	}: Omit<PopoverPrimitive.RootProps, "onOpenChange"> & {
		modal?: boolean;
		onOpenChange?: (open: boolean, reason?: PopoverCloseReason) => void;
	} = $props();

	let motivoPendente: PopoverCloseReason | null = null;

	/**
	 * Fecha o painel POR CÓDIGO e entrega o motivo — o caminho que a lib não faz
	 * (hoje, o `Tab` para fora do painel no modo não-modal).
	 *
	 * Medido na fonte do bits (`bits/popover/components/popover.svelte`): o
	 * `onOpenChange` da lib só roda no ESCRITOR do `boxWith` da raiz, ou seja,
	 * quando quem fecha é a própria lib. Escrever no `open` ligável daqui fecha
	 * o painel EM SILÊNCIO, sem chamar ninguém — então a entrega do motivo é
	 * manual, exatamente como já é no `confirmAndClose` de quem consome.
	 */
	function dismiss(reason: PopoverCloseReason): void {
		if (!open) return;
		// A anotação pendente não vale mais: quem fecha é esta chamada, e o
		// motivo dela é o que chega a quem escuta.
		motivoPendente = null;
		open = false;
		onOpenChange?.(false, reason);
	}

	createContextoPopover(
		() => modal === true,
		(reason) => {
			motivoPendente = reason;
		},
		dismiss,
	);

	function aoMudar(o: boolean) {
		// `api` é o padrão para o que não foi gesto — o formulário que salvou e
		// fechou cai aqui, e é por isso que NÃO é `close-button` como no drawer:
		// com ele, "concluiu" chegaria ao relatório como "apertou fechar".
		const reason = o ? undefined : (motivoPendente ?? "api");
		// Limpa nos dois sentidos: anotação que não virou fechamento não vaza.
		motivoPendente = null;
		onOpenChange?.(o, reason);
	}
</script>

<PopoverPrimitive.Root bind:open onOpenChange={aoMudar} {...restProps} />
