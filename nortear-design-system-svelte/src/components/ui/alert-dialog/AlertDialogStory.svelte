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
    onOpenChange?: (open: boolean) => void;
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
    onOpenChange,
  }: Props = $props();

  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionVariant = $derived(tone === 'destructive' ? 'destructive' : 'default');
</script>

<AlertDialog bind:open {onOpenChange}>
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
      <AlertDialogAction variant={actionVariant} onclick={onConfirm}>{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
