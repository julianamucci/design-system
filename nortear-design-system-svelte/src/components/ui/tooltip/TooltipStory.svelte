<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';
  import Save from '@lucide/svelte/icons/save';
  import Trash2 from '@lucide/svelte/icons/trash-2';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant = 'default' | 'withShortcut' | 'longText';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    delayDuration?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    ariaLabel?: string;
    contentText?: string;
    variant?: Variant;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'top',
    align = 'center',
    sideOffset = 4,
    // Sem default: o andaime não OPINA sobre a espera, ele repassa. Story que
    // omite o arg entrega `undefined` ao `TooltipProvider`, e aí vale o padrão
    // do provedor (300 ms) — que é o que a story `Hover (provider default)`
    // precisa exercitar para o portão ter dentes. Um `= 0` aqui fazia o andaime
    // desligar a espera em silêncio, e um `= 300` mediria este arquivo em vez
    // do primitivo.
    delayDuration,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = 'Salvar',
    ariaLabel = 'Salvar',
    contentText = 'Salvar (Ctrl+S)',
    variant = 'default',
  }: Props = $props();
</script>

<!--
  A FOLGA faz parte do andaime, e o número é medido, não estimado.

  Medido em 2026-09-16 nas stacks irmãs: com ~280 px de quadro sobram ~36 px
  acima do gatilho, menos do que balão, seta e afastamento somam (~38 px), e a
  lib vira o balão para baixo — corretamente. Quem afirma o lado PEDIDO (o
  `Playground`) reprovava então por falta de sala, e não por defeito de
  posicionamento. Com 400 px e o gatilho centrado na altura, o lado pedido cabe.

  Quem EXIGE o aperto é a story `Collision`, que tem cena própria encostada na
  borda e mede a premissa antes de afirmar a virada.
-->
<div
  class="nds-cluster nds-w-full nds-min-h-100 nds-p-8"
  data-justify="center"
  data-align="center"
  data-spacing="md"
  style="contain: layout;"
>
  <TooltipProvider {delayDuration}>
    {#key `${side}-${align}-${sideOffset}-${defaultOpen}-${variant}-${delayDuration}`}
        <Tooltip bind:open>
          <TooltipTrigger>
            {#snippet child({ props })}
              {#if variant === 'longText'}
                <!-- Gatilho de TEXTO: o rótulo visível já é o nome acessível, e
                     um aria-label diferente dele quebraria a WCAG 2.5.3
                     (Label in Name). -->
                <Button variant="outline" {...props}>{triggerLabel}</Button>
              {:else}
                <Button variant="outline" size="icon" aria-label={ariaLabel} {...props}>
                  {#if triggerLabel.toLowerCase().includes('excluir') || triggerLabel.toLowerCase().includes('delete') || triggerLabel.toLowerCase().includes('eliminar')}
                    <Trash2 aria-hidden="true" class="nds-size-4" />
                  {:else}
                    <Save aria-hidden="true" class="nds-size-4" />
                  {/if}
                </Button>
              {/if}
            {/snippet}
          </TooltipTrigger>
          <TooltipContent {side} {align} {sideOffset}>
            {#if variant === 'withShortcut'}
              <span>{contentText.replace(/\s*\([^)]*\)\s*$/, '')}</span>
              <!-- `.nds-kbd` + `data-slot="kbd"`: a classe é a do design system
                   (as anteriores — `text-background`, altura e corpo cravados em
                   style inline — saíram da folha na migração e não pintavam
                   nada), e o `data-slot` é o que faz
                   `.nds-tooltip-content:has([data-slot="kbd"])` encurtar o
                   respiro à direita do balão. -->
              <kbd data-slot="kbd" class="nds-kbd">Ctrl</kbd>
              <kbd data-slot="kbd" class="nds-kbd">S</kbd>
            {:else if variant === 'longText'}
              {contentText}
            {:else}
              {contentText}
            {/if}
          </TooltipContent>
        </Tooltip>
    {/key}
  </TooltipProvider>
</div>
