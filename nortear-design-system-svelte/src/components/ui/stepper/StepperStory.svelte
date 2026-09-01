<script lang="ts">
  import { untrack } from 'svelte';
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
   * Invólucro das stories: o Storybook para Svelte não aceita `slot` na render
   * function, então a composição inteira mora aqui e as stories mandam dados.
   *
   * Um caminho só: o valor da prop é o estado INICIAL, e a partir daí quem manda
   * é o clique. Um ramo controlado e outro não controlado com a mesma marcação
   * seria duplicação, e a metade menos exercitada apodrece sem ninguém notar.
   */

  interface StepEntry {
    step: number;
    title: string;
    description?: string;
    completed?: boolean;
    disabled?: boolean;
  }

  const DEFAULT_STEPS: StepEntry[] = [
    { step: 1, title: 'Conta' },
    { step: 2, title: 'Endereço' },
    { step: 3, title: 'Pagamento' },
    { step: 4, title: 'Revisão' },
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
    onStepSelect?: (step: number) => void;
    class?: string;
  }

  let {
    steps = DEFAULT_STEPS,
    value = 2,
    ariaLabel = 'Progresso do cadastro',
    labels = DEFAULT_LABELS,
    onStepSelect,
    class: className,
  }: Props = $props();

  // `untrack`: o inicializador captura o valor de montagem de propósito — a
  // ressincronização com o control é do efeito abaixo, e só dele.
  let current = $state(untrack(() => value));

  // Ressincroniza quando o control da story muda o valor. O efeito lê só
  // `value`, então clicar numa etapa não é desfeito no próximo quadro.
  $effect(() => {
    current = value;
  });

  function handleSelect(step: number): void {
    current = step;
    onStepSelect?.(step);
  }
</script>

<Stepper
  value={current}
  aria-label={ariaLabel}
  {labels}
  onStepSelect={handleSelect}
  class={className}
>
  {#each steps as entry, index (entry.step)}
    <StepperItem step={entry.step} completed={entry.completed} disabled={entry.disabled}>
      <StepperTrigger>
        <StepperIndicator />
        <StepperTitle>{entry.title}</StepperTitle>
        {#if entry.description}
          <StepperDescription>{entry.description}</StepperDescription>
        {/if}
      </StepperTrigger>
      {#if index < steps.length - 1}
        <StepperSeparator />
      {/if}
    </StepperItem>
  {/each}
</Stepper>
