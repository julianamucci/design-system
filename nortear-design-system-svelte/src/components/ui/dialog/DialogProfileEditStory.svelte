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
  <DialogContent class="nds-sm-max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription>
        Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
      </DialogDescription>
    </DialogHeader>
    <form class="nds-grid" data-spacing="sm" onsubmit={handleSubmit}>
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-name">Nome completo</Label>
        <!--
          `value` e não `defaultValue`: conferido em bits-ui e no próprio
          `input.svelte` desta stack, `defaultValue` não é prop de nada aqui —
          cai no rest, vira atributo inerte e o campo renderiza VAZIO. É o
          mesmo defeito de estado silencioso que o `defaultOpen` já causou.
        -->
        <Input id="profile-name" value="Maria Silva" />
      </div>
      <div class="nds-grid" data-spacing="xs">
        <Label for="profile-username">Nome de usuário</Label>
        <Input id="profile-username" value="@mariasilva" />
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
