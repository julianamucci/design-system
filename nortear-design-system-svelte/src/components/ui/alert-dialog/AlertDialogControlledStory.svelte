<script lang="ts">
  // Demo do modo controlado — e o gatilho fica FORA do diálogo, de propósito.
  //
  // A story usava o gatilho do próprio componente, e assim ela não provava
  // nada: abrir pelo trigger interno é indistinguível de um diálogo não
  // controlado. Com um botão externo mexendo no estado, fica visível que quem
  // manda é o pai — que é a única coisa que a palavra "controlado" promete.
  //
  // O botão externo escreve `open` direto, sem passar pelo callback: o pai já
  // sabe da abertura, porque foi ele que a causou. `onOpenChange` é o
  // componente PEDINDO a mudança, e por isso só dispara na saída — Escape,
  // Cancelar ou a ação que confirma (o clique no véu não fecha, D1).
  //
  // A ação NÃO escreve `open = false`: ela já fecha pelo `Dialog.Close` da lib,
  // e o `handleClose` de lá sai cedo quando `open` já é falso — escrever antes
  // engolia o `onOpenChange(false)` da confirmação, e o pai nunca sabia.
  //
  // Rótulos padrão: o conjunto destrutivo de `demonstration.labels`, o mesmo
  // das outras stories de estado.
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from './index';
  import { Button } from '@/components/ui/button';

  interface Props {
    triggerLabel?: string;
    title?: string;
    description?: string;
    cancelLabel?: string;
    actionLabel?: string;
    onOpenChange?: (open: boolean) => void;
  }

  const {
    triggerLabel = 'Excluir conta',
    title = 'Excluir conta',
    description = 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel = 'Cancelar',
    actionLabel = 'Excluir',
    onOpenChange,
  }: Props = $props();

  let open = $state(false);

  function onChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
  }
</script>

<div class="nds-stack" data-spacing="sm">
  <Button variant="destructive" onclick={() => (open = true)}>{triggerLabel}</Button>

  <AlertDialog bind:open onOpenChange={onChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction variant="destructive">{actionLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
