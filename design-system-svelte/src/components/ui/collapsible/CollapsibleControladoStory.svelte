<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { Button } from '@/components/ui/button';
  import { sanitizeHtml } from '@/lib/sanitize-html';

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

<div class="flex flex-col gap-3 w-[320px]">
  <Button variant="outline" size="sm" onclick={toggle}>
    {open ? 'Fechar via botão externo' : 'Abrir via botão externo'}
  </Button>
  <Collapsible bind:open>
    <CollapsibleTrigger
      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {@html sanitizeHtml(label)}
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="rounded-md border border-border bg-muted/50 px-4 py-3 text-sm mt-2">
        {contentText}
      </div>
    </CollapsibleContent>
  </Collapsible>
</div>
