<script lang="ts">
  import { untrack } from 'svelte';
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import DOMPurify from 'dompurify';

  interface Props {
    label?: string;
    open?: boolean;
    defaultOpen?: boolean;
    disabled?: boolean;
    contentText?: string;
    onOpenChange?: (open: boolean) => void;
    class?: string;
  }

  let {
    label = 'Exibir filtros avançados',
    open = $bindable(false),
    defaultOpen = false,
    disabled = false,
    contentText = 'Conteúdo colapsável visível quando aberto.',
    onOpenChange,
    class: className = 'nds-w-full nds-max-w-sm',
  }: Props = $props();

  let internalOpen = $state(untrack(() => (defaultOpen || open)));

  // Markup alinhado ao Vanilla (referência cross-stack): nada de `style` inline,
  // porque inline vence a folha e a declaração sai do tema, da densidade e da
  // escala. Tudo aqui é classe .nds-*.
</script>

{#key defaultOpen}
  <Collapsible
    bind:open={internalOpen}
    onOpenChange={(v: boolean) => onOpenChange?.(v)}
    {disabled}
    class={className}
  >
    <CollapsibleTrigger
      class="nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4"
      data-justify="between"
      {disabled}
    >
      <span>{@html DOMPurify.sanitize(label)}</span>
      <ChevronDown
        aria-hidden="true"
        class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
      />
    </CollapsibleTrigger>
    <CollapsibleContent
      class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
      data-spacing="sm"
    >
      <p>{contentText}</p>
    </CollapsibleContent>
  </Collapsible>
{/key}
