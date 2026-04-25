<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { ChevronDown } from 'lucide-svelte';

  let open = $state(false);
</script>

<div class="flex flex-col gap-3 w-72">
  <div class="flex items-center justify-between">
    <span class="text-sm font-medium">Filtros avançados</span>
    <Collapsible bind:open>
      <CollapsibleTrigger
        class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {open ? 'Ocultar' : 'Exibir'}
        <ChevronDown
          aria-hidden="true"
          class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2 space-y-1">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  </div>
  <p class="text-xs text-muted-foreground">Filtro básico ativo</p>
</div>
