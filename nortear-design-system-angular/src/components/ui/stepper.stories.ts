import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn } from 'storybook/test';
import { NDS_STEPPER } from './stepper';
import { NdsStepperDocs } from '@/components/docs/StepperDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { FLOW_LABEL, STATE_LABELS, STEP_TITLES, TOTAL_STEPS } from './stepper.fixtures';
import { stepperPlaygroundSource, type StepperArgs } from './stepper.source';

const meta: Meta<StepperArgs> = {
  title: 'Primitives/Navigation/Stepper',
  tags: ['autodocs', 'navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_STEPPER] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsStepperDocs) },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 1, max: TOTAL_STEPS },
      description:
        'Número da etapa atual, contando de 1. É dele que cada etapa deriva o próprio estado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nome acessível do fluxo. É atributo nativo escrito no elemento da raiz, não um input.',
      table: { type: { summary: 'string (atributo aria-label)' }, defaultValue: { summary: '—' } },
    },
    labels: {
      control: 'object',
      description:
        'Palavras de estado do fluxo, lidas só por leitor de tela. Sem elas, a diferença entre concluída e futura fica só na marca de verificação.',
      table: {
        type: { summary: '{ completed?: string; current?: string }' },
        defaultValue: { summary: '{}' },
      },
    },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(stepSelect)` ficaria ligado a nada, sem erro nenhum.
    onStepSelect: {
      control: false,
      description: 'Saída da raiz, emitida com o número da etapa quando um gatilho é acionado.',
      table: { type: { summary: 'output<number>' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    value: 2,
    ariaLabel: FLOW_LABEL,
    labels: STATE_LABELS,
    onStepSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<StepperArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: stepperPlaygroundSource } },
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
    props: { ...args },
    template: `
      <ol
        ndsStepper
        [value]="value"
        [attr.aria-label]="ariaLabel"
        [labels]="labels"
        (stepSelect)="onStepSelect($event)"
      >
        <li ndsStepperItem [step]="1">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>${STEP_TITLES.account}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="2">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>${STEP_TITLES.address}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="3">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>${STEP_TITLES.payment}</span>
          </button>
          <div ndsStepperSeparator></div>
        </li>
        <li ndsStepperItem [step]="4">
          <button ndsStepperTrigger>
            <span ndsStepperIndicator></span>
            <span ndsStepperTitle>${STEP_TITLES.review}</span>
          </button>
        </li>
      </ol>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // A play NÃO clica: o Chromatic fotografa o estado final, e `visual.item1`
    // pede a fixture com o valor na segunda etapa. Provar a seleção é papel de
    // `Wizard`, onde o valor de fato anda.

    await step('A raiz é uma lista ordenada com um item por etapa', async () => {
      const list = canvas.getByRole('list', { name: FLOW_LABEL });
      // `role="list"` também vale para `<ul>` — a ordem das etapas é conteúdo,
      // e só `<ol>` a anuncia.
      await expect(list.tagName).toBe('OL');
      await expect(canvas.getAllByRole('listitem')).toHaveLength(TOTAL_STEPS);
    });

    await step('O valor atual resolve o estado de cada etapa', async () => {
      const items = canvas.getAllByRole('listitem');
      await expect(items[0].getAttribute('data-state')).toBe('completed');
      await expect(items[1].getAttribute('data-state')).toBe('active');
      await expect(items[2].getAttribute('data-state')).toBe('inactive');
      await expect(items[3].getAttribute('data-state')).toBe('inactive');
    });

    await step('Exatamente um controle se anuncia como etapa atual', async () => {
      const currentMarkers = canvasElement.querySelectorAll('[aria-current]');
      await expect(currentMarkers).toHaveLength(1);
      await expect(currentMarkers[0].getAttribute('aria-current')).toBe('step');
      // E é o da etapa que casa com o valor — dois "atual" na mesma lista é
      // pior do que nenhum.
      await expect(currentMarkers[0].closest('[data-slot="stepper-item"]')?.getAttribute('data-step')).toBe(
        '2',
      );
    });

    await step('Indicador e traço ficam fora da árvore de acessibilidade', async () => {
      const decorations = canvasElement.querySelectorAll(
        '[data-slot="stepper-indicator"], [data-slot="stepper-separator"]',
      );
      await expect(decorations.length).toBe(TOTAL_STEPS + (TOTAL_STEPS - 1));
      for (const node of decorations) {
        await expect(node.getAttribute('aria-hidden')).toBe('true');
      }
    });

    await step('Nada no indicador se reanuncia por conta própria', async () => {
      // Região viva aqui atropelaria a leitura do resto da tela a cada avanço.
      const liveNodes = canvasElement.querySelectorAll(
        '[aria-live], [role="status"], [role="alert"], [role="log"]',
      );
      await expect(liveNodes).toHaveLength(0);
    });
  },
};
