import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { tick } from 'svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import { Stepper } from './index';
import StepperStory from './StepperStory.svelte';
import StepperDocs from '@/components/docs/StepperDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { stepperSource } from './stepper.source';

const FLOW_LABEL = 'Progresso do cadastro';
const LABELS = { completed: 'Etapa concluída', current: 'Etapa atual' };
const TOTAL_STEPS = 4;

const meta: Meta = {
  title: 'Components/Navigation/Stepper',
  component: Stepper,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: {
      page: withAutoDocsTab(StepperDocs),
      source: { transform: stepperSource },
    },
  },
  // A aba "API Reference" é montada só a partir destes argTypes: o docgen do
  // Svelte está desligado no .storybook/main.ts. Props com `control: false` são
  // documentação — o `render` não as encaminha, e control ativo sem fiação vira
  // controle morto.
  argTypes: {
    value: {
      control: { type: 'number', min: 1, max: TOTAL_STEPS },
      description:
        'Número da etapa atual, contando de 1. É dele que cada etapa deriva o próprio estado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    'aria-label': {
      control: 'text',
      description:
        'Nome acessível do fluxo, na raiz. Sem ele o leitor de tela anuncia só uma lista.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    labels: {
      control: 'object',
      description:
        'Palavras de estado do fluxo — completed e current. Ficam só para leitor de tela e são o que separa concluída de futura para quem não vê a marca de verificação.',
      table: {
        type: { summary: '{ completed?: string; current?: string }' },
        defaultValue: { summary: '—' },
      },
    },
    onStepSelect: {
      control: false,
      description:
        'Callback de seleção, disparado pelo controle de uma etapa disponível com o número dela.',
      table: { type: { summary: '(step: number) => void' } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz. Esta stack usa class, não className.',
      table: { type: { summary: 'string' } },
    },
    step: {
      control: false,
      description:
        'Número desta etapa, no StepperItem. Define a posição e, comparado ao valor atual, o estado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    completed: {
      control: false,
      description:
        'No StepperItem: força a etapa a contar como concluída mesmo estando depois da atual.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: false,
      description:
        'No StepperItem: torna a etapa indisponível — o controle sai da ordem de tabulação e o ponteiro deixa de alcançá-la.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    value: 2,
    'aria-label': FLOW_LABEL,
    labels: LABELS,
    onStepSelect: fn(),
  },
};

export default meta;
type Story = StoryObj;

const itemAt = (root: HTMLElement, step: number): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="stepper-item"][data-step="${step}"]`)!;

const triggerOf = (item: HTMLElement): HTMLButtonElement =>
  item.querySelector<HTMLButtonElement>('[data-slot="stepper-trigger"]')!;

/** Estado esperado de uma etapa a partir do valor do fluxo — o mesmo do componente. */
const expectedState = (step: number, value: number): string =>
  step < value ? 'completed' : step === value ? 'active' : 'inactive';

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: StepperStory,
    props: {
      value: args.value,
      ariaLabel: args['aria-label'],
      labels: args.labels,
      onStepSelect: args.onStepSelect,
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const value = Number(args.value);
    const flowLabel = String(args['aria-label']);

    /**
     * Precondição de CADA passo, e não herança do anterior: o painel Interactions
     * reexecuta a play no mesmo DOM. Clicar no gatilho da própria etapa atual é
     * idempotente e devolve o fluxo ao valor com que a story montou.
     */
    const resetFlow = async () => {
      const item = itemAt(canvasElement, value);
      if (item.dataset.state !== 'active') {
        await userEvent.click(triggerOf(item));
        await tick();
      }
    };

    await step('A raiz é uma lista ordenada nomeada, com um item por etapa', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;
      await expect(root.tagName).toBe('OL');
      // A ordem e a contagem são o conteúdo: a lista as anuncia sozinha.
      await expect(canvas.getByRole('list', { name: flowLabel })).toBe(root);
      await expect(canvas.getAllByRole('listitem')).toHaveLength(TOTAL_STEPS);
    });

    await step('Cada etapa deriva o próprio estado do valor do fluxo', async () => {
      await resetFlow();
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;
      await expect(root).toHaveAttribute('data-value', String(value));
      for (let n = 1; n <= TOTAL_STEPS; n += 1) {
        await expect(itemAt(canvasElement, n)).toHaveAttribute(
          'data-state',
          expectedState(n, value),
        );
      }
    });

    await step('Exatamente um controle carrega aria-current="step"', async () => {
      await resetFlow();
      const marked = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[aria-current="step"]'),
      );
      await expect(marked).toHaveLength(1);
      await expect(marked[0]).toHaveAttribute('data-slot', 'stepper-trigger');
      await expect(marked[0].closest('[data-slot="stepper-item"]')).toHaveAttribute(
        'data-step',
        String(value),
      );
    });

    await step('Indicador e traço ficam fora da árvore de acessibilidade', async () => {
      const decorations = Array.from(
        canvasElement.querySelectorAll<HTMLElement>(
          '[data-slot="stepper-indicator"], [data-slot="stepper-separator"]',
        ),
      );
      // Um indicador por etapa e um traço entre cada par.
      await expect(decorations).toHaveLength(TOTAL_STEPS + (TOTAL_STEPS - 1));
      for (const decoration of decorations) {
        await expect(decoration).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('A palavra de estado chega ao leitor de tela sem ocupar a tela', async () => {
      await resetFlow();
      const label = triggerOf(itemAt(canvasElement, value)).querySelector<HTMLElement>(
        '[data-slot="stepper-state-label"]',
      )!;
      await expect(label).toHaveTextContent(LABELS.current);
      // Medida, e não nome de classe: é a largura de 1px que prova o recorte.
      await expect(label.getBoundingClientRect().width).toBeLessThan(2);
    });

    await step('Não há região viva anunciando o avanço por cima da tela', async () => {
      await expect(canvasElement.querySelector('[aria-live]')).toBeNull();
      await expect(
        canvasElement.querySelector('[role="status"], [role="alert"], [role="log"]'),
      ).toBeNull();
    });
  },
};
