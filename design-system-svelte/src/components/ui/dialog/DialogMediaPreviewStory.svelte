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
    <div
      role="img"
      aria-label="Imagem ilustrativa de pôr-do-sol em gradiente laranja"
      class="nds-aspect-video nds-w-full nds-rounded-md bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600"
    ></div>
  </DialogContent>
</Dialog>
