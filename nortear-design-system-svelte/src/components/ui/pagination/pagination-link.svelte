<script lang="ts">
	import { Pagination as PaginationPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";
	import { buttonVariants, type ButtonSize } from "@/components/ui/button/index.js";
	let {
		ref = $bindable(null),
		class: className,
		size = "icon",
		isActive,
		appearance = "ghost",
		page,
		href,
		children,
		...restProps
	}: PaginationPrimitive.PageProps & {
		size?: ButtonSize;
		isActive: boolean;
		/**
		 * Aparência dos controles NÃO ativos. Padrão `ghost`.
		 *
		 * A página atual continua `outline` sempre: é ela que o realce existe
		 * para marcar, e deixá-la seguir o eixo apagaria a marcação justamente
		 * quando a faixa inteira fosse `outline`.
		 *
		 * Não se resolve por `class`: `buttonVariants` já escreveu uma variante,
		 * e quem chega depois pelo `cn` não desfaz a que veio antes.
		 */
		appearance?: "ghost" | "outline";
		/**
		 * Endereço da página. É ele que decide a TAG do controle.
		 *
		 * Com `href` o controle é `<a href>`: destino de verdade, abre em nova
		 * aba, é indexável. Sem ele é `<button type="button">`, porque âncora sem
		 * destino anuncia "link" ao leitor de tela e promete uma ida que não
		 * acontece — o que acontece é uma ação na própria página.
		 */
		href?: string;
	} = $props();

	// O bits-ui fixa `aria-label="Page N"` — em inglês — nos próprios props da
	// Page, e vence o que o consumidor passa. Resultado: a paginação inteira era
	// anunciada em inglês. O snippet `child` é a única forma de escrever depois do
	// merge da lib. Consumidor que passar `aria-label` continua vencendo.
	//
	// A página atual NÃO ganha rótulo diferente: quem anuncia "página atual" é o
	// `aria-current="page"`, nativamente e em qualquer idioma. Um rótulo especial
	// aqui divergia das outras stacks e duplicava o anúncio.
	const ariaLabel = $derived(
		((restProps as Record<string, unknown>)["aria-label"] as string | undefined) ??
			`Ir para página ${page.value}`,
	);

	/**
	 * Props da âncora: os do bits MENOS o `onkeydown`.
	 *
	 * O handler da lib chama `preventDefault()` no Enter para trocar a página na
	 * própria tela. Numa âncora com destino isso CANCELA a navegação — o teclado
	 * deixaria de fazer o que o mouse faz. No caminho do botão ele continua
	 * inteiro, que é onde ele resolve alguma coisa.
	 */
	function anchorProps(props: Record<string, unknown>): Record<string, unknown> {
		const withoutKeydown = { ...props };
		delete withoutKeydown.onkeydown;
		return withoutKeydown;
	}
</script>

{#snippet Content()}
	{#if children}
		{@render children?.()}
	{:else}
		{page.value}
	{/if}
{/snippet}

<PaginationPrimitive.Page
	bind:ref
	{page}
	aria-current={isActive ? "page" : undefined}
	data-slot="pagination-link"
	data-active={isActive ? "true" : undefined}
	class={cn(buttonVariants({ size, variant: isActive ? "outline" : appearance }), className)}
	{...restProps}
>
	{#snippet child({ props })}
		{#if href}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- o destino vem do consumidor, e um design system não tem roteador para resolver -->
			<a {...anchorProps(props)} {href} aria-label={ariaLabel}>
				{@render Content()}
			</a>
		{:else}
			<!--
				Sem `type` explícito o botão é `submit` e envia o formulário que o
				cercar — a faixa costuma viver dentro de um, em filtro de tabela.
			-->
			<button {...props} type="button" aria-label={ariaLabel}>
				{@render Content()}
			</button>
		{/if}
	{/snippet}
</PaginationPrimitive.Page>
