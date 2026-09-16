<script lang="ts">
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from './index';
  import { Button } from '@/components/ui/button';

  // Sigla técnica no cabeçalho de uma métrica, com o balão definindo o termo.
  // A descoberta é passiva e não custa espaço vertical; para detalhe interativo
  // o caso seria de Popover.
</script>

<div class="nds-p-8" style="contain: layout;">
  <TooltipProvider>
    <div class="nds-stack" data-spacing="xs" style="align-items: flex-start">
      <div class="nds-cluster" data-spacing="sm">
        <p class="nds-text-caption nds-font-medium nds-text-muted-foreground nds-uppercase nds-tracking-wider">
          LCP
        </p>
        <Tooltip defaultOpen>
          <TooltipTrigger>
            {#snippet child({ props })}
              <Button variant="outline" size="icon-sm" aria-label="O que é LCP" {...props}>i</Button>
            {/snippet}
          </TooltipTrigger>
          <!-- Sem `nds-max-w-xs`: a utilitária vale `max-width: 20rem` e a
               `.nds-tooltip-content` já vale o mesmo — no balão ela é classe
               que não pinta nada. -->
          <TooltipContent side="top">
            Largest Contentful Paint — tempo até o maior elemento visível ser renderizado.
          </TooltipContent>
        </Tooltip>
      </div>
      <p class="nds-text-h3 nds-m-0">1,8 s</p>
    </div>
  </TooltipProvider>
</div>
