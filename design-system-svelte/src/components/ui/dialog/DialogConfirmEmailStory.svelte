<script lang="ts">
  import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onAction?: () => void;
  }

  let { open = $bindable(true), onOpenChange, onAction }: Props = $props();

  const title = 'Confirmar novo email';

  function handleOpenChange(value: boolean) {
    onOpenChange?.(value);
  }

  function handleAction() {
    onAction?.();
  }
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Confirmar email</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        Enviaremos um link de confirmação para o novo endereço. O email atual continua ativo até a confirmação.
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-1.5">
      <Label for="confirm-new-email">Novo email</Label>
      <Input id="confirm-new-email" type="email" placeholder="voce@example.com" />
    </div>
    <DialogFooter>
      <DialogClose>
        {#snippet child({ props })}
          <Button variant="outline" {...props}>Cancelar</Button>
        {/snippet}
      </DialogClose>
      <Button onclick={handleAction}>Enviar confirmação</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
