<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { ChevronDown } from 'lucide-svelte';
  import DOMPurify from 'dompurify';

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

  let internalOpen = $state(defaultOpen || open);
</script>

{#key defaultOpen}
  <Collapsible bind:open={internalOpen} {disabled} class={className}>
    <CollapsibleTrigger
      class="nds-cluster nds-rounded-md nds-py-2 nds-text-body nds-font-medium nds-transition-colors nds-hover-bg-accent nds-hover-text-accent-foreground nds-focus-ring nds-disabled-none nds-disabled-opacity-50" data-align="center" data-spacing="sm" style="padding-inline: 0.75rem"
      {disabled}
    >
      {@html DOMPurify.sanitize(label)}
      <ChevronDown
        aria-hidden="true"
        class="nds-shrink-0 nds-transition-transform nds-chevron" style="height: 1rem; width: 1rem"
      />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="nds-rounded-md nds-border-default nds-bg-muted-50 nds-px-4 nds-text-body nds-mt-2" style="padding-block: 0.75rem">
        {contentText}
      </div>
    </CollapsibleContent>
  </Collapsible>
{/key}
