<script lang="ts">
  /**
   * O painel comandado por ESTADO EXTERNO — sem gatilho nenhum dentro do Sheet.
   *
   * O andaime comum (`SheetStory.svelte`) sempre monta um `SheetTrigger`, e a
   * story `Controlled` clicava justamente nele: o que ela provava era o gatilho
   * do componente, não o estado de quem o consome. Aqui o botão mora FORA do
   * `<Sheet>` e a única coisa que ele faz é escrever no estado ligado — que é
   * como as outras quatro stacks mostram o painel controlado.
   */
  import {
    Sheet,
    SheetBody,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    createSheetCloseWatch,
    type SheetCloseReason,
  } from './index';
  import { Button } from '@/components/ui/button';

  interface Props {
    triggerLabel?: string;
    title?: string;
    description?: string;
    actionLabel?: string;
    cancelLabel?: string;
    /** Recebe POR ONDE o painel fechou, no vocabulário do design system. */
    onClose?: (reason: SheetCloseReason) => void;
  }

  let {
    triggerLabel = 'Abrir pelo estado externo',
    title = 'Controlado pelo pai',
    description = 'Este painel é comandado por estado externo e devolve cada mudança a quem é dono dele.',
    actionLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onClose,
  }: Props = $props();

  let open = $state(false);

  const closeWatch = createSheetCloseWatch();

  function handleOpenChange(next: boolean): void {
    if (next) {
      closeWatch.reset();
      return;
    }
    onClose?.(closeWatch.takeReason());
  }
</script>

<div class="nds-stack" data-spacing="sm" style="contain: layout">
  <!--
    O botão que comanda o painel não é o gatilho do componente: o anúncio dele é
    de quem o montou, e é por isso que o `aria-haspopup` vem escrito aqui.
  -->
  <Button aria-haspopup="dialog" onclick={() => (open = true)}>{triggerLabel}</Button>

  <Sheet bind:open onOpenChange={handleOpenChange}>
    <SheetContent side="right" {...closeWatch.listeners}>
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        <SheetDescription>{description}</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <p class="nds-text-body nds-text-muted-foreground">
          O valor ligado manda no painel, e o painel devolve cada mudança a quem é dono dele.
        </p>
      </SheetBody>
      <SheetFooter>
        <SheetClose>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{cancelLabel}</Button>
          {/snippet}
        </SheetClose>
        <Button onclick={() => { closeWatch.markConfirmation(); open = false; handleOpenChange(false); }}>
          {actionLabel}
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
</div>
