<script lang="ts">
  import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './index';
  import { Button } from '@/components/ui/button';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
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

  function definir(valor: boolean) {
    open = valor;
    onOpenChange?.(valor);
  }
</script>

<div class="nds-stack nds-w-cap-sm" data-spacing="sm">
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado externo: <strong>{open ? 'aberto' : 'fechado'}</strong>
  </p>
  <!-- Nomes próprios, diferentes do trigger: dois botões com o mesmo nome
       acessível são ambíguos na lista de controles do leitor de tela. -->
  <div class="nds-cluster" data-spacing="sm">
    <Button variant="outline" size="sm" onclick={() => definir(true)}>
      Abrir pelo estado externo
    </Button>
    <Button variant="outline" size="sm" onclick={() => definir(false)}>
      Fechar pelo estado externo
    </Button>
  </div>
  <Collapsible bind:open onOpenChange={(v: boolean) => onOpenChange?.(v)} class="nds-w-full">
    <CollapsibleTrigger
      class="nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4"
      data-justify="between"
    >
      <span>{@html DOMPurify.sanitize(open ? 'Ocultar filtros avançados' : label)}</span>
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
</div>
