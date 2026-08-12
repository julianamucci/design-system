<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  let open = $state(false);
</script>

<!-- Trigger estilizado como botão do design system: as classes do Button moram
     no PRÓPRIO trigger, então é ele quem carrega aria-expanded e aria-controls.
     Markup igual ao do Vanilla, a referência cross-stack. -->
<Collapsible bind:open class="nds-w-full nds-max-w-sm">
  <CollapsibleTrigger
    class="nds-button nds-button-outline nds-cluster nds-w-full nds-px-4"
    data-justify="between"
  >
    <span>Exibir opções avançadas</span>
    <ChevronDown
      aria-hidden="true"
      class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
    />
  </CollapsibleTrigger>
  <CollapsibleContent
    class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
    data-spacing="sm"
  >
    <p>Opção avançada 1</p>
    <p>Opção avançada 2</p>
    <p>Opção avançada 3</p>
  </CollapsibleContent>
</Collapsible>
