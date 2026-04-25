<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { Settings2, ChevronDown } from 'lucide-svelte';

  let open = $state(false);
</script>

<Collapsible bind:open class="w-72">
  <CollapsibleTrigger
    class="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  >
    <span class="flex items-center gap-2">
      <Settings2 aria-hidden="true" class="h-4 w-4 text-muted-foreground" />
      {open ? 'Ocultar filtros avançados' : 'Exibir filtros avançados'}
    </span>
    <ChevronDown
      aria-hidden="true"
      class="h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180"
    />
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2 space-y-2">
      <div class="flex items-center gap-2 text-muted-foreground">
        <span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
        Filtro avançado 1
      </div>
      <div class="flex items-center gap-2 text-muted-foreground">
        <span class="h-1.5 w-1.5 rounded-full bg-primary"></span>
        Filtro avançado 2
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>
