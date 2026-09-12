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

	// A espera de abertura é 300 ms, fixada pela dona em 2026-09-12 para as cinco
	// stacks — ver D5 no PRD do tooltip. Era `0` aqui, e zero não é atraso: é
	// ausência de atraso, então todo ponteiro que PASSA pela barra de ferramentas
	// acendia balão. O atraso existe para separar o ponteiro que passa do que para.
	//
	// O FOCO pelo teclado continua abrindo na hora, e isso não depende de valor
	// nenhum: o `#onfocus` do gatilho do bits-ui chama `handleOpen()` direto, sem
	// passar pelo `#handleDelayedOpen` que arma o temporizador. Prender o teclado
	// à espera do hover esconderia a informação de quem não usa mouse (WCAG
	// 1.4.13). As duas metades são medidas pelas stories `Hover (provider
	// default)` e `Keyboard focus (no delay)`.
	let { delayDuration = 300, ...restProps }: TooltipPrimitive.ProviderProps = $props();
</script>

<TooltipPrimitive.Provider {delayDuration} {...restProps} />
