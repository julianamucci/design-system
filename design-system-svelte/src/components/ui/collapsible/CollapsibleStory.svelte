<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { ChevronDown } from 'lucide-svelte';
  import { sanitizeHtml } from '@/lib/sanitize-html';

  interface Props {
    label?: string;
    open?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    contentText?: string;
    class?: string;
  }

  let {
    label = 'Exibir filtros avançados',
    open = $bindable(false),
    defaultOpen = false,
    disabled = false,
    contentText = 'Conteúdo colapsável visível quando aberto.',
    class: className = '',
  }: Props = $props();

  // eslint-disable-next-line svelte/state_referenced_locally
  let internalOpen = $state(defaultOpen || open);
</script>

{#key defaultOpen}
  <Collapsible bind:open={internalOpen} {disabled} class={className}>
    <CollapsibleTrigger
      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      {disabled}
    >
      {@html sanitizeHtml(label)}
      <ChevronDown
        aria-hidden="true"
        class="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180"
      />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2">
        {contentText}
      </div>
    </CollapsibleContent>
  </Collapsible>
{/key}
