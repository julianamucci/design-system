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
    createAlertDialogCloseWatch,
    type AlertDialogCloseReason,
  } from './index';
  import { Button } from '@/components/ui/button';

  interface Props {
    triggerLabel?: string;
    title?: string;
    description?: string;
    cancelLabel?: string;
    actionLabel?: string;
    onOpenChange?: (open: boolean) => void;
    /**
     * Por onde o diálogo fechou, no vocabulário do design system. É o mesmo
     * caminho que a docs page usa para preencher o `reason` do `dialog_close`:
     * a lib só avisa QUE fechou, e quem traduz o gesto é o `close-reason.ts`.
     */
    onClose?: (reason: AlertDialogCloseReason) => void;
    /** Handler do consumidor na ação que confirma. */
    onConfirm?: () => void;
  }

  const {
    triggerLabel = 'Excluir conta',
    title = 'Excluir conta',
    description = 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel = 'Cancelar',
    actionLabel = 'Excluir',
    onOpenChange,
    onClose,
    onConfirm,
  }: Props = $props();

  let open = $state(false);

  // O gesto observado fica guardado até o diálogo de fato fechar. Uma instância
  // por montagem: o pendente é do painel, não do módulo.
  const closeWatch = createAlertDialogCloseWatch();

  function onChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
    if (value) {
      // Abrir zera o gesto pendente: o diálogo começa sem motivo anotado.
      closeWatch.reset();
      return;
    }
    onClose?.(closeWatch.takeReason());
  }

  // Confirmar é decisão de DENTRO, e se marca ANTES: o fechamento sai síncrono
  // de dentro do clique, e sem a marca o motivo cairia no `close-button` do
  // Cancelar — "confirmou" chegaria ao relatório como "desistiu".
  function handleConfirm() {
    closeWatch.markConfirmation();
    onConfirm?.();
  }
</script>

<div class="nds-stack" data-spacing="sm">
  <!--
    O botão externo escreve o estado direto, e por isso NÃO passa pelo
    `onOpenChange` — é ele que zera o gesto pendente na abertura.
  -->
  <Button
    variant="destructive"
    onclick={() => {
      closeWatch.reset();
      open = true;
    }}>{triggerLabel}</Button
  >

  <AlertDialog bind:open onOpenChange={onChange}>
    <!-- O Escape é o único caminho de saída que a lib anuncia por evento. -->
    <AlertDialogContent {...closeWatch.listeners}>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <!--
          O clique no Cancelar é o `close-press` que a lib não publica: o
          Cancelar e a ação saem pelo mesmo caminho de fechamento dela.
        -->
        <AlertDialogCancel {...closeWatch.cancelTrigger}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction variant="destructive" onclick={handleConfirm}
          >{actionLabel}</AlertDialogAction
        >
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</div>
