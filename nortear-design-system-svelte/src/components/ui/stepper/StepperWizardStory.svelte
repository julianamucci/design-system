<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { Button } from '@/components/ui/button';
  import {
    Stepper,
    StepperDescription,
    StepperIndicator,
    StepperItem,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
    type StepperLabels,
  } from './index';

  /**
   * Fluxo completo: o indicador acima do painel da etapa, com voltar e avançar
   * embaixo.
   *
   * É aqui que a decisão 5 do componente aparece exercitada: o Stepper NÃO tem
   * região viva, então quem anuncia o avanço é o painel que trocou de conteúdo —
   * e é para ele que esta composição move o foco. Sem isso, quem usa leitor de
   * tela troca de etapa e continua ouvindo a lista.
   *
   * O foco só se move em resposta a uma ação da pessoa; não há efeito que o
   * roube na montagem.
   */

  interface StepEntry {
    step: number;
    title: string;
    description: string;
    body: string;
  }

  const DEFAULT_STEPS: StepEntry[] = [
    { step: 1, title: 'Conta',     description: 'Seus dados',       body: 'Nome, email e senha de acesso.' },
    { step: 2, title: 'Endereço',  description: 'Onde entregar',    body: 'Rua, número, cidade e CEP.' },
    { step: 3, title: 'Pagamento', description: 'Forma de pagar',   body: 'Cartão, boleto ou transferência.' },
    { step: 4, title: 'Revisão',   description: 'Confira e envie',  body: 'Revise os dados antes de enviar.' },
  ];

  const DEFAULT_LABELS: StepperLabels = {
    completed: 'Etapa concluída',
    current: 'Etapa atual',
  };

  interface Props {
    steps?: StepEntry[];
    value?: number;
    ariaLabel?: string;
    labels?: StepperLabels;
    backLabel?: string;
    nextLabel?: string;
    onStepSelect?: (step: number) => void;
  }

  let {
    steps = DEFAULT_STEPS,
    value = 2,
    ariaLabel = 'Progresso do cadastro',
    labels = DEFAULT_LABELS,
    backLabel = 'Voltar',
    nextLabel = 'Avançar',
    onStepSelect,
  }: Props = $props();

  const uid = $props.id();
  const panelId = `${uid}-panel`;
  const panelTitleId = `${uid}-panel-title`;

  // `untrack`: o inicializador captura o valor de montagem de propósito — a
  // ressincronização com o control é do efeito abaixo, e só dele.
  let current = $state(untrack(() => value));
  let panelEl: HTMLDivElement | null = $state(null);

  $effect(() => {
    current = value;
  });

  const active = $derived(steps.find((entry) => entry.step === current) ?? steps[0]);

  async function goTo(step: number): Promise<void> {
    if (step < 1 || step > steps.length) return;
    current = step;
    onStepSelect?.(step);
    // O painel só existe com o conteúdo novo depois do quadro seguinte; focar
    // antes moveria o foco para o texto antigo.
    await tick();
    panelEl?.focus();
  }
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  <Stepper value={current} aria-label={ariaLabel} {labels} onStepSelect={goTo}>
    {#each steps as entry, index (entry.step)}
      <StepperItem step={entry.step}>
        <StepperTrigger>
          <StepperIndicator />
          <StepperTitle>{entry.title}</StepperTitle>
          <StepperDescription>{entry.description}</StepperDescription>
        </StepperTrigger>
        {#if index < steps.length - 1}
          <StepperSeparator />
        {/if}
      </StepperItem>
    {/each}
  </Stepper>

  <!-- `tabindex="-1"` permite foco programático sem entrar na ordem de
       tabulação; `aria-labelledby` faz o leitor anunciar o título da etapa ao
       receber o foco. -->
  <div
    bind:this={panelEl}
    id={panelId}
    tabindex="-1"
    aria-labelledby={panelTitleId}
    class="nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack"
    data-spacing="sm"
  >
    <h3 id={panelTitleId} class="nds-text-body nds-font-semibold">{active.title}</h3>
    <p class="nds-text-body">{active.body}</p>
  </div>

  <div class="nds-cluster" data-spacing="md">
    <Button variant="outline" disabled={current === 1} onclick={() => goTo(current - 1)}>
      {backLabel}
    </Button>
    <Button disabled={current === steps.length} onclick={() => goTo(current + 1)}>
      {nextLabel}
    </Button>
  </div>
</div>
