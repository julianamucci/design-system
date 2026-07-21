<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { Button } from '@/components/ui/button';
  import DOMPurify from 'dompurify';

  interface Props {
    label?: string;
    contentText?: string;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    label = 'Exibir filtros avançados',
    contentText = 'Conteúdo colapsável controlado externamente.',
    onOpenChange,
  }: Props = $props();

  let open = $state(false);

  function toggle() {
    open = !open;
    onOpenChange?.(open);
  }
</script>

<div class="nds-stack" data-spacing="sm" style="width: 320px">
  <Button variant="outline" size="sm" onclick={toggle}>
    {open ? 'Fechar via botão externo' : 'Abrir via botão externo'}
  </Button>
  <Collapsible bind:open>
    <CollapsibleTrigger
      class="nds-cluster nds-rounded-md nds-py-2 nds-text-body nds-font-medium transition-colors nds-hover-bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-align="center" data-spacing="sm" style="padding-inline: 0.75rem"
    >
      {@html DOMPurify.sanitize(label)}
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="nds-rounded-md nds-border-default bg-muted/50 nds-px-4 nds-text-body nds-mt-2" style="padding-block: 0.75rem">
        {contentText}
      </div>
    </CollapsibleContent>
  </Collapsible>
</div>
