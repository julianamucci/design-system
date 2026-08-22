<script lang="ts">
	/**
	 * Destino DENTRO do painel.
	 *
	 * Classe diferente da do destino da barra porque o desenho é outro: o da
	 * barra é uma pílula de uma linha (`inline-flex` + `white-space: nowrap`);
	 * este é um bloco com título e, às vezes, uma linha de descrição. É a mesma
	 * separação que o Vanilla faz — e sem ela os painéis de mega-menu desta
	 * stack empurravam título e descrição para dentro de uma pílula que não
	 * quebra linha.
	 *
	 * Fecha o painel ao ser escolhido, SEMPRE — navegar é sair da página, e um
	 * painel que sobrevive ao clique fica pendurado sobre a página seguinte.
	 *
	 * O "sempre" precisa desta ponte: o encadeamento de handlers desta stack
	 * PARA no primeiro `preventDefault()`, então um `onclick` de quem consome
	 * que chama `preventDefault` (o que todo roteador de cliente faz, para
	 * navegar por conta própria) engolia o fechamento da lib junto — o painel
	 * ficava aberto exatamente no caso mais comum de aplicação real. Aqui o
	 * handler de quem consome roda primeiro e o fechamento vai depois, sem olhar
	 * `defaultPrevented`. Disparar duas vezes (quando nada foi prevenido, a lib
	 * também fecha) é inofensivo: fechar o que já está fechado não faz nada.
	 */
	import { NavigationMenu as NavigationMenuPrimitive } from "bits-ui";
	import { cn } from "@/lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		onclick,
		...restProps
	}: NavigationMenuPrimitive.LinkProps = $props();

	/** Evento de dispensa do conteúdo, o mesmo que a própria lib despacha. */
	const DISMISS = "bitsRootContentDismiss";

	function onClick(event: MouseEvent & { currentTarget: EventTarget & HTMLAnchorElement }): void {
		onclick?.(event);
		event.currentTarget.dispatchEvent(
			new CustomEvent(DISMISS, { bubbles: true, cancelable: true }),
		);
	}
</script>

<NavigationMenuPrimitive.Link
	bind:ref
	data-slot="navigation-menu-child"
	class={cn("nds-navigation-menu-child", className)}
	onclick={onClick}
	{...restProps}
/>
