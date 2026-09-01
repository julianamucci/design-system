<script lang="ts">
	/**
	 * A tokenização vem de `@shared/primitives/code-highlight` (TS puro) e devolve
	 * dados, não HTML — cada span vira um nó do template, então não há `{@html}` e
	 * nada a sanitizar. Cores, layout e destaque vivem em `nds/code-block.css`.
	 */
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import Check from "@lucide/svelte/icons/check";
	import Copy from "@lucide/svelte/icons/copy";
	import { cn, type WithElementRef } from "@/lib/utils.js";
	import { Button } from "@/components/ui/button";
	import { copyText } from "@shared/primitives/clipboard";
	import {
		highlightCode,
		parseLineRanges,
		resolveLanguage,
		type LineRangeInput,
	} from "@shared/primitives/code-highlight";
	import { LABELS_CODE_BLOCK_DEFAULT } from "@shared/primitives/code-block-labels";
	import {
		codeLineMarks,
		hasLineKinds,
		type CodeLineKind,
	} from "@shared/primitives/code-block-lines";

	let {
		ref = $bindable(null),
		code,
		language,
		title,
		showLineNumbers = true,
		highlightLines,
		lineKinds,
		actions,
		footer,
		copyLabel = LABELS_CODE_BLOCK_DEFAULT.copy,
		copiedLabel = LABELS_CODE_BLOCK_DEFAULT.copied,
		addedLabel = LABELS_CODE_BLOCK_DEFAULT.lineAdded,
		removedLabel = LABELS_CODE_BLOCK_DEFAULT.lineRemoved,
		regionLabel = LABELS_CODE_BLOCK_DEFAULT.region,
		class: className,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Código a exibir. É exatamente o que o botão copiar coloca no clipboard. */
		code: string;
		/** Linguagem ou extensão (`tsx`, `svelte`, `.css`, `bash`). Desconhecida → sem cor. */
		language?: string;
		/** Rótulo do header, normalmente o nome do arquivo. */
		title?: string;
		/** Numeração de linha. */
		showLineNumbers?: boolean;
		/** Linhas destacadas: `[3, '5-7']` ou `'3, 5-7'`. */
		highlightLines?: LineRangeInput;
		/**
		 * Espécie de cada linha, indexada a partir da primeira.
		 *
		 * Ligada, a calha troca o número pela marca `+`/`−` e deixa de ser
		 * `aria-hidden`. Indexada por linha, e não por intervalo como
		 * `highlightLines`: destaque é decoração esparsa, espécie é classificação
		 * completa — ver `@shared/primitives/code-block-lines`.
		 */
		lineKinds?: ReadonlyArray<CodeLineKind>;
		/**
		 * Controles de quem compõe, no cabeçalho.
		 *
		 * Entram ANTES do copiar, e a ordem é decisão de acessibilidade, não de
		 * gosto: a fila é encostada no fim do cabeçalho, então acrescentar do lado
		 * de dentro deixa o copiar ancorado no canto do bloco em toda composição.
		 * Quem aprendeu que copiar é o último controle do cabeçalho continua com
		 * essa verdade quando a composição acrescenta executar, alternar ou baixar
		 * (WCAG 3.2.4, identificação consistente). O rótulo "Copiado!" fica colado
		 * ao botão que ele descreve pelo mesmo motivo, e a ordem de foco segue a
		 * visual.
		 */
		actions?: Snippet;
		/** Observações abaixo do código. Aceita string ou snippet. */
		footer?: string | Snippet;
		copyLabel?: string;
		copiedLabel?: string;
		/**
		 * Palavra que o leitor recebe na calha de uma linha adicionada.
		 *
		 * Existe pelo mesmo motivo de `copyLabel`: é texto falado, e texto falado
		 * que quem consome não possa trocar decide o idioma do produto pelo
		 * componente.
		 */
		addedLabel?: string;
		/** Palavra que o leitor recebe na calha de uma linha removida. */
		removedLabel?: string;
		/**
		 * Nome acessível da região que rola.
		 *
		 * A região tem `tabindex="0"` porque quem navega por teclado precisa
		 * alcançar o código que passa da altura máxima; com nome ela deixa de ser
		 * uma parada anônima. Distinga quando houver mais de um bloco na mesma
		 * tela.
		 */
		regionLabel?: string;
	} = $props();

	// A linguagem RESOLVIDA, não a recebida: `.css` e `css` são a mesma coisa, e
	// um valor desconhecido vira `text`. É o que a raiz registra e o que story,
	// teste e devtools leem — sem isto, "caiu em texto simples" não é observável.
	const resolvedLanguage = $derived(resolveLanguage(language));
	const lines = $derived(highlightCode(code, resolvedLanguage));
	const highlighted = $derived(parseLineRanges(highlightLines));

	// Uma entrada por linha, ou vazio fora do modo de espécie. A calha só perde o
	// `aria-hidden` quando há entrada, e é a diferença que importa: número de
	// linha é redundante com a posição e sai da leitura; sinal de adição e
	// remoção é o único portador não-cromático da distinção.
	const marks = $derived(
		codeLineMarks(lineKinds, lines.length, {
			...LABELS_CODE_BLOCK_DEFAULT,
			lineAdded: addedLabel,
			lineRemoved: removedLabel,
		}),
	);
	const kindMode = $derived(hasLineKinds(lineKinds));

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Limpa o timer no unmount: sem isso, desmontar dentro dos 2s escreve num
	// $state de componente já destruído.
	$effect(() => () => clearTimeout(timer));

	async function handleCopy() {
		// copyText já cobre o fallback fora de contexto seguro; false = não copiou,
		// e nesse caso não confirmamos nada. Chamar navigator.clipboard direto
		// deixa o botão inerte em http sem localhost, onde as outras stacks ainda
		// copiam.
		if (!(await copyText(code))) return;
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => { copied = false; }, 2000);
	}
</script>

<div
	bind:this={ref}
	data-slot="code-block"
	data-numbered={showLineNumbers ? "true" : "false"}
	data-line-kinds={kindMode ? "true" : undefined}
	data-language={resolvedLanguage}
	class={cn("nds-code-block-root", className)}
	{...restProps}
>
	<div class="nds-code-block-header">
		{#if title}
			<span class="nds-code-block-title">{title}</span>
		{/if}
		<span class="nds-code-block-actions">
			<!-- Controles de quem compõe, ANTES do copiar: a fila é encostada no fim
			     do cabeçalho, então acrescentar do lado de dentro deixa o copiar
			     ancorado no canto do bloco em toda composição (WCAG 3.2.4). -->
			{#if actions}{@render actions()}{/if}
			{#if copied}
				<span class="nds-code-block-copy-label" aria-hidden="true">{copiedLabel}</span>
			{/if}
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				data-slot="code-block-copy"
				aria-label={copied ? copiedLabel : copyLabel}
				onclick={handleCopy}
			>
				{#if copied}
					<Check class="nds-icon" aria-hidden="true" />
				{:else}
					<Copy class="nds-icon" aria-hidden="true" />
				{/if}
			</Button>
		</span>
	</div>

	<!-- aria-live fora do botão: leitor de tela anuncia a confirmação sem que o
	     rótulo do botão mude no meio da interação. -->
	<span class="nds-sr-only" role="status" aria-live="polite">{copied ? copiedLabel : ""}</span>

	<!-- tabindex="0" é intencional: a região rola e precisa ser alcançável por
	     teclado (WCAG 2.1.1), o que a play function do Playground verifica. O
	     compilador ainda avisa a11y_no_noninteractive_tabindex porque a regra
	     só aceita roles de widget — nem region nem group a dispensam.

	     O papel e o nome vêm com ele: a regra 6 da §8 da guideline 17 pede os
	     dois, e `tabindex` sozinho fazia uma parada de foco que o leitor de tela
	     não sabia nomear. `group` e não `region` porque `region` com nome vira
	     landmark, e uma página de documentação tem dezenas de blocos — seriam
	     dezenas de entradas de mesmo papel e mesmo nome na lista de regiões do
	     leitor, que é o que o docblock da `scroll-area` já avisa que torna a
	     lista inútil. -->
	<div class="nds-code-block-scroll" role="group" aria-label={regionLabel} tabindex="0">
		<!-- lang="en": o conteúdo é código — identificador e palavra reservada.
		     Sem isto, a voz do leitor de tela em pt-BR tenta pronunciá-lo como
		     português. WCAG 3.1.2. -->
		<pre class="nds-code-block-pre" lang="en"><code class="nds-code-block-code">{#each lines as spans, i (i)}<span
			class="nds-code-block-line"
			data-highlighted={highlighted.has(i + 1) ? "true" : undefined}
			data-kind={marks[i]?.kind}
		>{#if marks[i]}<span class="nds-code-block-gutter">{marks[i].mark}{#if marks[i].label}<span class="nds-sr-only">{marks[i].label}</span>{/if}</span>{:else}<span class="nds-code-block-gutter" aria-hidden="true">{i + 1}</span>{/if}<span
			class="nds-code-block-text"
		>{#each spans as span, j (j)}{#if span.token !== "plain"}<span data-token={span.token}>{span.text}</span>{:else}{span.text}{/if}{/each}{spans.length === 0 ? "\n" : ""}</span></span>{/each}</code></pre>
	</div>

	{#if footer}
		<div class="nds-code-block-footer">
			{#if typeof footer === "string"}{footer}{:else}{@render footer()}{/if}
		</div>
	{/if}
</div>
