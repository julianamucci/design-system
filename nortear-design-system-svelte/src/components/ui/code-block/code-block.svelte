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
	import {
		highlightCode,
		parseLineRanges,
		resolveLanguage,
		type LineRangeInput,
	} from "@shared/primitives/code-highlight";

	let {
		ref = $bindable(null),
		code,
		language,
		title,
		showLineNumbers = true,
		highlightLines,
		footer,
		copyLabel = "Copiar código",
		copiedLabel = "Copiado!",
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
		/** Observações abaixo do código. Aceita string ou snippet. */
		footer?: string | Snippet;
		copyLabel?: string;
		copiedLabel?: string;
	} = $props();

	const lines = $derived(highlightCode(code, resolveLanguage(language)));
	const highlighted = $derived(parseLineRanges(highlightLines));

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Limpa o timer no unmount: sem isso, desmontar dentro dos 2s escreve num
	// $state de componente já destruído.
	$effect(() => () => clearTimeout(timer));

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
		} catch {
			// Clipboard indisponível (http sem localhost, permissão negada): não
			// quebra a página, só não confirma.
			return;
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => { copied = false; }, 2000);
	}
</script>

<div
	bind:this={ref}
	data-slot="code-block"
	data-numbered={showLineNumbers ? "true" : "false"}
	class={cn("nds-code-block-root", className)}
	{...restProps}
>
	<div class="nds-code-block-header">
		{#if title}
			<span class="nds-code-block-title">{title}</span>
		{/if}
		<span class="nds-code-block-actions">
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

	<div class="nds-code-block-scroll" tabindex="0">
		<pre class="nds-code-block-pre"><code class="nds-code-block-code">{#each lines as spans, i (i)}<span
			class="nds-code-block-line"
			data-highlighted={highlighted.has(i + 1) ? "true" : undefined}
		><span class="nds-code-block-gutter" aria-hidden="true">{i + 1}</span><span
			class="nds-code-block-text"
		>{#each spans as span, j (j)}{#if span.token !== "plain"}<span data-token={span.token}>{span.text}</span>{:else}{span.text}{/if}{/each}{#if spans.length === 0}
{/if}</span></span>{/each}</code></pre>
	</div>

	{#if footer}
		<div class="nds-code-block-footer">
			{#if typeof footer === "string"}{footer}{:else}{@render footer()}{/if}
		</div>
	{/if}
</div>
