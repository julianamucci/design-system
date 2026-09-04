<script lang="ts">
	import { Tooltip as TooltipPrimitive } from "bits-ui";
	//
	// Sem `data-slot="tooltip-provider"` de propósito, e não por esquecimento: o
	// `Provider` do bits-ui desestrutura a lista fechada de props que conhece e
	// renderiza `{@render children()}`. Não existe elemento onde o atributo
	// pudesse pousar, e criar um wrapper só para carimbá-lo colocaria uma caixa
	// no fluxo que o CSS `.nds-tooltip-*` não prevê. É a mesma razão de a raiz
	// não ter `data-slot="tooltip"`. Divergência de API de framework:
	// registrada, não "alinhada".
	//

	let { delayDuration = 0, ...restProps }: TooltipPrimitive.ProviderProps = $props();
</script>

<TooltipPrimitive.Provider {delayDuration} {...restProps} />
