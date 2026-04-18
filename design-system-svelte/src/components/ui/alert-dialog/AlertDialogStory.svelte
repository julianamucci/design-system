<script lang="ts">
  import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
  } from './index';
  import { Button } from '@/components/ui/button';

  interface Props {
    triggerLabel?: string;
    triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    title?: string;
    description?: string;
    cancelLabel?: string;
    actionLabel?: string;
    defaultOpen?: boolean;
    disabled?: boolean;
  }

  let {
    triggerLabel = 'Excluir conta',
    triggerVariant = 'destructive',
    title = 'Excluir conta',
    description = 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel = 'Cancelar',
    actionLabel = 'Excluir',
    defaultOpen = false,
    disabled = false,
  }: Props = $props();
</script>

<AlertDialog {defaultOpen}>
  <AlertDialogTrigger asChild>
    <Button variant={triggerVariant} {disabled}>{triggerLabel}</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <AlertDialogDescription>{description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
      <AlertDialogAction>{actionLabel}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
