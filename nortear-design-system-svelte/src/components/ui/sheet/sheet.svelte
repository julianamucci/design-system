<script lang="ts">
	import { Dialog as SheetPrimitive } from "bits-ui";
	import { claimOpenSheet, releaseOpenSheet, type OpenSheetPanel } from "./single-panel";

	let {
		open = $bindable(false),
		onOpenChange,
		...restProps
	}: SheetPrimitive.RootProps = $props();

	/**
	 * Este painel, para o registro de "um por vez" (`single-panel.ts`).
	 *
	 * O `dismiss` avisa `onOpenChange(false)` À MÃO porque a lib não avisa: o
	 * `onOpenChange` do bits-ui sai do setter interno dela, então mudar o valor
	 * ligado por fora fecha o painel em silêncio. Sem esta chamada o painel
	 * recolhido sumiria da tela e do relatório ao mesmo tempo, e quem escuta
	 * ficaria com uma abertura sem fechamento. A palavra que sai daí é `api` —
	 * nenhum gesto da pessoa fechou este painel.
	 */
	const panel: OpenSheetPanel = {
		dismiss() {
			if (!open) return;
			open = false;
			onOpenChange?.(false);
		},
	};

	// Abriu, toma a vez e recolhe quem estava na tela; fechou, solta a vez.
	// Ler `open` (e não só o `onOpenChange`) é o que alcança também a abertura
	// por ESTADO EXTERNO, que a lib não anuncia.
	$effect(() => {
		if (open) claimOpenSheet(panel);
		else releaseOpenSheet(panel);
	});

	// Desmontar não é fechar: a soltura tira este painel do registro sem avisar
	// fechamento nenhum. Uma docs page que troca de idioma com o painel aberto é
	// exatamente este caminho, e um `dialog_close` aqui seria um fechamento que
	// ninguém provocou.
	$effect(() => () => releaseOpenSheet(panel));
</script>

<SheetPrimitive.Root bind:open {onOpenChange} {...restProps} />
