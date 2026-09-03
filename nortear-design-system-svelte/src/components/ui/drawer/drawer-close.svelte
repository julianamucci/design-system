<script lang="ts">
	import { Drawer as DrawerPrimitive } from "vaul-svelte";
	import { useDrawerCloseContext } from "./close-context.js";

	let {
		ref = $bindable(null),
		child,
		children,
		...restProps
	}: DrawerPrimitive.CloseProps = $props();

	// Com a dispensa DESLIGADA o `Close` do primitivo não fecha nada: o pedido
	// dele passa pela guarda do `onDialogOpenChange`, que o engole. Ver o
	// docblock de `close-context.ts` para a medida e o porquê. Aqui o botão passa
	// a escrever a abertura da raiz, que é o caminho que a guarda não intercepta.
	const closeContext = useDrawerCloseContext();
	const explicitClose = $derived(closeContext?.close ?? null);

	// O `child` recebe os MESMOS props que o primitivo entregaria — `onclick`
	// incluso —, para que quem compõe encadeando `props.onclick` continue
	// funcionando sem saber por qual dos dois caminhos o fechamento vai.
	//
	// O cast atravessa uma incompatibilidade de TIPO, não de valor: `style` chega
	// no tipo do primitivo como `StyleProperties | string` e o elemento declara
	// só `string`. O objeto que sai daqui é o mesmo que o primitivo entregaria.
	type ChildProps = Parameters<NonNullable<DrawerPrimitive.CloseProps["child"]>>[0]["props"];

	const childProps = $derived({
		...restProps,
		"data-slot": "drawer-close",
		type: "button" as const,
		onclick: () => explicitClose?.(),
	} as unknown as ChildProps);
</script>

{#if explicitClose}
	{#if child}
		{@render child({ props: childProps })}
	{:else}
		<button bind:this={ref} {...childProps}>{@render children?.()}</button>
	{/if}
{:else}
	<DrawerPrimitive.Close bind:ref data-slot="drawer-close" {child} {children} {...restProps} />
{/if}
