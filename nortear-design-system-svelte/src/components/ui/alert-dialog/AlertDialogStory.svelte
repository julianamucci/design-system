<script lang="ts">
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Tone = 'destructive' | 'default';

  interface Props {
    open?: boolean;
    triggerLabel?: string;
    triggerVariant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary' | 'link';
    title?: string;
    description?: string;
    cancelLabel?: string;
    actionLabel?: string;
    tone?: Tone;
    onConfirm?: () => void;
    onCancel?: () => void;
  }

  let {
    open = $bindable(false),
    triggerLabel = 'Excluir conta',
    triggerVariant = 'destructive',
    title = 'Excluir sua conta?',
    description = 'Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos e não poderão ser recuperados.',
    cancelLabel = 'Cancelar',
    actionLabel = 'Excluir conta',
    tone = 'destructive',
    onConfirm,
    onCancel,
  }: Props = $props();

  const actionClass = $derived(
    tone === 'destructive'
      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      : ''
  );
</script>

<AlertDialog bind:open>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant={triggerVariant}>{triggerLabel}</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onclick={onCancel}>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction class={actionClass} onclick={onConfirm}>{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
