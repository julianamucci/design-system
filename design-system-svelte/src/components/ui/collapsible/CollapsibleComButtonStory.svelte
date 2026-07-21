<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { ChevronDown } from 'lucide-svelte';

  let open = $state(false);
</script>

<div class="nds-stack" data-spacing="sm" style="width: 18rem">
  <div class="nds-cluster" data-justify="between">
    <span class="nds-text-body nds-font-medium">Filtros avançados</span>
    <Collapsible bind:open>
      <CollapsibleTrigger
        class="nds-cluster nds-rounded-md nds-text-body nds-font-medium nds-transition-colors nds-hover-bg-accent nds-hover-text-accent-foreground nds-focus-ring" data-align="center" data-spacing="xs" style="padding-inline: 0.75rem; padding-block: 0.375rem"
      >
        {open ? 'Ocultar' : 'Exibir'}
        <ChevronDown
          aria-hidden="true"
          class="nds-transition-transform nds-chevron" style="height: 1rem; width: 1rem"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="nds-rounded-md nds-border-default nds-bg-muted-50 nds-px-4 nds-text-body nds-mt-2" data-spacing="xs" style="padding-block: 0.75rem">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
  <p class="nds-text-caption nds-text-muted-foreground">Filtro básico ativo</p>
</div>
