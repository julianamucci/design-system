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
  // wrapper existe porque ela precisa estar ausente DESDE A MONTAGEM, e não
  // removida depois: o primitivo desta stack grava o id da descrição no estado
  // da raiz e não o apaga ao destruí-la, então tirar o parágrafo em tempo de
  // execução deixaria `aria-describedby` apontando para um id que não existe
  // mais. Nascendo sem descrição, o id nunca é gravado e o atributo nunca é
  // declarado — que é o comportamento correto e o que a story mede.
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
