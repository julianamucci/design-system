<script lang="ts">
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';

  // A descrição é opcional (anatomy.item6 do conteúdo compartilhado). Este
  // wrapper é a composição SEM o subcomponente de descrição — a mesma que o
  // painel Code da story publica —, com os rótulos próprios do caso: o título
  // sozinho já diz o que se perde. Sem descrição registrada o painel não
  // declara `aria-describedby` (ver alert-dialog-description-registry.ts), e é
  // isso que a story mede.
  interface Props {
    open?: boolean;
    triggerLabel?: string;
    title?: string;
    cancelLabel?: string;
    actionLabel?: string;
  }

  let {
    open = $bindable(true),
    triggerLabel = 'Descartar rascunho',
    title = 'Descartar rascunho',
    cancelLabel = 'Cancelar',
    actionLabel = 'Descartar',
  }: Props = $props();
</script>

<AlertDialog bind:open>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="destructive">{triggerLabel}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction variant="destructive">{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
