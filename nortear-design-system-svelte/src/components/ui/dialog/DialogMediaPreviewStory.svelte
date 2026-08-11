<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let { open = $bindable(true), onOpenChange }: Props = $props();

  const title = 'Pôr-do-sol na praia';

  function handleOpenChange(value: boolean) {
    onOpenChange?.(value);
  }
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Ver imagem</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent class="nds-sm-max-w-lg">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        Captura realizada em outubro de 2026, costa norte.
      </DialogDescription>
    </DialogHeader>
    <!--
      Marcador de mídia com as classes REAIS do sistema. O gradiente que estava
      aqui (`bg-gradient-to-br from-orange-400 …`) era resíduo do Tailwind: as
      quatro classes não existem mais no CSS, então a caixa renderizava
      transparente e o rótulo falava de uma cor que ninguém via. A forma segue
      o Vanilla, que é a referência de markup.
    -->
    <div
      data-slot="dialog-body"
      role="img"
      aria-label="Imagem ilustrativa de pôr-do-sol"
      class="nds-dialog-body nds-aspect-video nds-w-full nds-rounded-md nds-bg-muted nds-cluster nds-text-caption nds-text-muted-foreground"
      data-align="center"
      data-justify="center"
    >
      Pré-visualização da mídia
    </div>
  </DialogContent>
</Dialog>
