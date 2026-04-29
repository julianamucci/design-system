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

  const title = 'Editar perfil';

  function handleOpenChange(value: boolean) {
    onOpenChange?.(value);
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    onAction?.();
  }
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button variant="outline" {...props}>Editar perfil</Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
      </DialogDescription>
    </DialogHeader>
    <form class="grid gap-3" onsubmit={handleSubmit}>
      <div class="grid gap-1.5">
        <Label for="profile-name">Nome completo</Label>
        <Input id="profile-name" defaultValue="Maria Silva" />
      </div>
      <div class="grid gap-1.5">
        <Label for="profile-username">Nome de usuário</Label>
        <Input id="profile-username" defaultValue="@mariasilva" />
      </div>
      <DialogFooter>
        <DialogClose>
          {#snippet child({ props })}
            <Button type="button" variant="outline" {...props}>Cancelar</Button>
          {/snippet}
        </DialogClose>
        <Button type="submit">Salvar alterações</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
