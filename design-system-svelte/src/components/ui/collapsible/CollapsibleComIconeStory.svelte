<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { Settings2, ChevronDown } from 'lucide-svelte';

  let open = $state(false);
</script>

<Collapsible bind:open class="nds-w-full nds-max-w-xs">
  <CollapsibleTrigger
    class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-bg-card nds-px-4 nds-text-body nds-font-medium nds-transition-colors nds-hover-bg-accent nds-hover-text-accent-foreground nds-focus-ring" data-align="center" data-justify="between" style="padding-block: 0.75rem"
  >
    <span class="nds-cluster" data-spacing="sm">
      <Settings2 aria-hidden="true" class="nds-text-muted-foreground" style="height: 1rem; width: 1rem" />
      {open ? 'Ocultar filtros avançados' : 'Exibir filtros avançados'}
    </span>
    <ChevronDown
      aria-hidden="true"
      class="nds-shrink-0 nds-text-muted-foreground nds-transition-transform nds-chevron" style="height: 1rem; width: 1rem"
    />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="nds-rounded-md nds-border-default nds-bg-muted-50 nds-px-4 nds-text-body nds-mt-2" data-spacing="sm" style="padding-block: 0.75rem">
      <div class="nds-cluster nds-text-muted-foreground" data-align="center" data-spacing="sm">
        <span class="nds-rounded-full nds-bg-primary" style="height: 0.375rem; width: 0.375rem"></span>
        Filtro avançado 1
      </div>
      <div class="nds-cluster nds-text-muted-foreground" data-align="center" data-spacing="sm">
        <span class="nds-rounded-full nds-bg-primary" style="height: 0.375rem; width: 0.375rem"></span>
        Filtro avançado 2
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>
