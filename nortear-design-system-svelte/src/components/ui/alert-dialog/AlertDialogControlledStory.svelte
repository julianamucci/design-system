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
  // componente PEDINDO a mudança, e por isso só dispara na saída (Escape,
  // clique fora, Cancel). Mesma fiação do React e do Vue.
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
    triggerLabel = 'Abrir via estado externo',
    title = 'Controlado pelo pai',
    description = 'Este diálogo é comandado por estado externo via bind:open.',
    cancelLabel = 'Fechar',
    actionLabel = 'Confirmar',
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
        <AlertDialogAction variant="destructive" onclick={() => (open = false)}>
          {actionLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
