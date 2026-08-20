<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';

  let open = $state(false);
</script>

<!-- Chevron rotativo: a rotação de 180° é 100% CSS. `.nds-chevron` gira sozinha
     quando o ancestral está em [aria-expanded="true"] — nenhum utilitário e
     nenhum style inline participam. -->
<Collapsible bind:open class="nds-w-cap-sm">
  <CollapsibleTrigger
    class="nds-button nds-button-outline nds-cluster nds-w-full nds-px-4"
    data-justify="between"
  >
    <span>Configurações avançadas</span>
    <ChevronDown
      aria-hidden="true"
      class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
    />
  </CollapsibleTrigger>
  <CollapsibleContent
    class="nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2"
    data-spacing="sm"
  >
    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Notificações</span>
      <span class="nds-font-medium">Ativadas</span>
    </div>
    <div class="nds-cluster" data-justify="between">
      <span class="nds-text-muted-foreground">Privacidade</span>
      <span class="nds-font-medium">Modo estrito</span>
    </div>
  </CollapsibleContent>
</Collapsible>
