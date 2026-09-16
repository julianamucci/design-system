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
  import Share2 from '@lucide/svelte/icons/share-2';

  interface Props {
    /** Espera antes de abrir no ponteiro; sem valor, vale o padrão do provedor. */
    delayDuration?: number;
    /** Janela de cortesia do GRUPO: dentro dela o balão vizinho abre sem esperar. */
    skipDelayDuration?: number;
  }

  // Três ações de ícone no MESMO provedor — é o andaime das duas cenas que
  // dependem do grupo: a barra de ações e a espera compartilhada. Cada botão
  // carrega o seu `aria-label`, porque em touch não há ponteiro e o balão não
  // aparece.
  let { delayDuration, skipDelayDuration }: Props = $props();
</script>

<div class="nds-p-8" style="contain: layout;">
  <TooltipProvider {delayDuration} {skipDelayDuration}>
    <div class="nds-cluster" data-justify="center" data-align="center" data-spacing="lg">
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Salvar" {...props}>
              <Save aria-hidden="true" class="nds-size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Excluir" {...props}>
              <Trash2 aria-hidden="true" class="nds-size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Excluir item</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            <Button variant="outline" size="icon" aria-label="Compartilhar" {...props}>
              <Share2 aria-hidden="true" class="nds-size-4" />
            </Button>
          {/snippet}
        </TooltipTrigger>
        <TooltipContent>Compartilhar link</TooltipContent>
      </Tooltip>
    </div>
  </TooltipProvider>
</div>
