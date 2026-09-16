<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';

  // Ícone de ajuda ao lado do rótulo de um campo: o balão explica onde gerar o
  // valor esperado, sem poluir o rótulo nem exigir um Popover para o que é só
  // texto. O botão tem nome acessível próprio — em touch não há ponteiro, e sem
  // ele o "?" ficaria anônimo.
</script>

<div class="nds-p-8" style="contain: layout;">
  <TooltipProvider>
    <div class="nds-stack nds-w-sm" data-spacing="xs" style="align-items: flex-start">
      <div class="nds-cluster" data-spacing="sm">
        <label for="api-token" class="nds-text-body nds-font-medium">Token de API</label>
        <Tooltip defaultOpen>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon-sm" aria-label="Ajuda sobre Token de API" {...props}>
                ?
              </Button>
            {/snippet}
          </TooltipTrigger>
          <!-- Sem `nds-max-w-xs`: a utilitária vale `max-width: 20rem` e a
               `.nds-tooltip-content` já vale o mesmo — no balão ela é classe
               que não pinta nada. -->
          <TooltipContent side="right">
            Gere em Configurações › Acesso › Tokens
          </TooltipContent>
        </Tooltip>
      </div>
      <input id="api-token" type="text" class="nds-input" placeholder="sk-..." />
    </div>
  </TooltipProvider>
</div>
