<script lang="ts">
  /**
   * Dois painéis na mesma tela, e o mais novo manda.
   *
   * O Sheet é MODAL: um de cada vez. Abrir o segundo recolhe o primeiro, e essa
   * saída é um fechamento como qualquer outra — precisa dizer por quê, e a
   * palavra é `api`: nenhum gesto da pessoa fechou aquele painel, foi a
   * modalidade do componente que o recolheu.
   *
   * Os dois gatilhos ficam lado a lado, como na referência. Quem abre o segundo
   * na `play` é o ESTADO (`sheet-pair-state.svelte.ts`), não um clique — o
   * porquê está escrito lá.
   */
  import {
    Sheet,
    SheetBody,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    createSheetCloseWatch,
    type SheetCloseReason,
  } from './index';
  import { Button } from '@/components/ui/button';
  import { secondPanelState } from './sheet-pair-state.svelte';

  interface Props {
    firstTriggerLabel?: string;
    secondTriggerLabel?: string;
    /** Recebe o motivo de cada fechamento do PRIMEIRO painel. */
    onFirstClose?: (reason: SheetCloseReason) => void;
  }

  let {
    firstTriggerLabel = 'Abrir o primeiro',
    secondTriggerLabel = 'Abrir o segundo',
    onFirstClose,
  }: Props = $props();

  // Um observador por painel: o motivo é do painel que fechou, e uma instância
  // só confundiria o gesto de um com o do outro.
  const firstWatch = createSheetCloseWatch();

  function handleFirstOpenChange(next: boolean): void {
    if (next) {
      firstWatch.reset();
      return;
    }
    onFirstClose?.(firstWatch.takeReason());
  }
</script>

<div class="nds-cluster" data-spacing="md" style="contain: layout">
  <Sheet onOpenChange={handleFirstOpenChange}>
    <SheetTrigger>
      {#snippet child({ props })}
        <Button variant="outline" {...props}>{firstTriggerLabel}</Button>
      {/snippet}
    </SheetTrigger>
    <SheetContent side="left" {...firstWatch.listeners}>
      <SheetHeader>
        <SheetTitle>Primeiro painel</SheetTitle>
        <SheetDescription>Este sai de cena quando o outro entra.</SheetDescription>
      </SheetHeader>
      <SheetBody>
        <p class="nds-text-body nds-text-muted-foreground">
          Abra o segundo painel e este aqui se recolhe.
        </p>
      </SheetBody>
    </SheetContent>
  </Sheet>

  <Sheet bind:open={secondPanelState.open}>
    <SheetTrigger>
      {#snippet child({ props })}
        <Button variant="outline" {...props}>{secondTriggerLabel}</Button>
      {/snippet}
    </SheetTrigger>
    <SheetContent side="right">
      <SheetHeader>
        <SheetTitle>Segundo painel</SheetTitle>
        <SheetDescription>
          O mais novo manda: dois painéis modais ao mesmo tempo deixariam um deles inalcançável.
        </SheetDescription>
      </SheetHeader>
      <SheetBody>
        <p class="nds-text-body nds-text-muted-foreground">
          Este entrou por último, então é este que está na tela.
        </p>
      </SheetBody>
    </SheetContent>
  </Sheet>
</div>
