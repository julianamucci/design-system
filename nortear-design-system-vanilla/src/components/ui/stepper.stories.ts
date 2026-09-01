import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import type { StepperLabels } from './stepper';
import {
  buildStepper,
  FLOW_LABEL,
  SIGNUP_STEPS,
  STATE_LABELS,
  triggerOfStep,
} from './stepper.fixtures';
import { stepperSource } from './stepper.source';
import { createStepperDocs } from '@/components/docs/StepperDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

/**
 * O que a Playground controla, mais o que a aba API Reference documenta.
 *
 * `class`, `step`, `completed` e `disabled` entram sem control de propósito: a
 * aba sai SÓ do `argTypes` nesta stack — não há componente de framework para
 * introspectar —, então prop que não aparece aqui não aparece em lugar nenhum
 * da página de story. As três últimas são opções de `createStepperItem`, e a
 * descrição de cada uma diz isso.
 */
type StepperArgs = {
  'aria-label': string;
  value: number;
  labels: StepperLabels;
  onStepSelect: (step: number) => void;
  class?: string;
  step?: number;
  completed?: boolean;
  disabled?: boolean;
};

const meta: Meta<StepperArgs> = {
  title: 'Primitives/Navigation/Stepper',
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: {
      page: withAutoDocsTab(createStepperDocs),
      source: { transform: stepperSource },
    },
  },
  argTypes: {
    'aria-label': {
      control: 'text',
      description:
        'Nome acessível do fluxo, na raiz — OBRIGATÓRIO. Sem ele o leitor de tela anuncia uma lista sem dizer de que progresso se trata.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    value: {
      control: { type: 'number', min: 1, max: SIGNUP_STEPS.length, step: 1 },
      description:
        'Etapa atual, contando de 1. Nesta stack não é opção da raiz: é a segunda fase, aplicada por setStepperValue(root, value) depois que todas as etapas existem.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    labels: {
      control: 'object',
      description:
        'Palavras de estado do fluxo, na raiz. Ficam só para leitor de tela e são o que separa concluída de futura para quem não vê a marca de verificação.',
      table: {
        type: { summary: '{ completed?: string; current?: string }' },
        defaultValue: { summary: '—' },
      },
    },
    onStepSelect: {
      // O ouvinte é delegado na raiz e lê o número do `data-step` do item no
      // momento do clique — não há control que o substitua.
      control: false,
      description:
        'Chamado com o número da etapa quando um gatilho disponível é acionado. Sem ele os gatilhos continuam focáveis e sem efeito.',
      table: {
        type: { summary: '(step: number) => void' },
        defaultValue: { summary: '—' },
      },
    },
    class: {
      control: false,
      description: 'Classes .nds-* adicionais na raiz. `className` é aceito como apelido.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    step: {
      control: false,
      description: 'createStepperItem: número desta etapa, contando de 1. Comparado ao valor atual, é dele que sai o estado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    completed: {
      control: false,
      description: 'createStepperItem: conta como concluída mesmo estando depois da atual.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: false,
      description: 'createStepperItem: indisponível — o gatilho sai da ordem de tabulação.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    'aria-label': FLOW_LABEL,
    value: 2,
    labels: STATE_LABELS,
    onStepSelect: fn(),
  },
};

export default meta;
type Story = StoryObj<StepperArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
  render: (args) =>
    buildStepper({
      'aria-label': args['aria-label'],
      value: args.value,
      labels: args.labels,
      steps: SIGNUP_STEPS,
      onStepSelect: args.onStepSelect,
    }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;

    await step('A raiz é uma lista ordenada nomeada, com um item por etapa', async () => {
      // accessibility.item2 — a ordem e a contagem das etapas são o conteúdo:
      // a `<ol>` as anuncia sozinha ("lista, 4 itens, item 2") e poupa texto
      // inventado. Um `<div role="group">` diria menos.
      const list = canvas.getByRole('list', { name: args['aria-label'] });
      await expect(list).toBe(root);
      await expect(root.tagName).toBe('OL');

      const items = canvas.getAllByRole('listitem');
      await expect(items).toHaveLength(SIGNUP_STEPS.length);
      await expect(items.map((li) => li.dataset.step)).toEqual(
        SIGNUP_STEPS.map((s) => String(s.step)),
      );
    });

    await step('O estado de cada etapa sai do valor atual do fluxo', async () => {
      // functional.item1 — a derivação é o componente inteiro: nada aqui é
      // escrito à mão no item. Deriva do arg para que trocar o control no
      // painel continue medindo a regra, e não um valor congelado.
      await expect(root.dataset.value).toBe(String(args.value));

      const states = SIGNUP_STEPS.map((s) =>
        s.step < args.value ? 'completed' : s.step === args.value ? 'active' : 'inactive',
      );
      const items = canvas.getAllByRole('listitem');
      await expect(items.map((li) => li.dataset.state)).toEqual(states);
    });

    await step('Exatamente um gatilho carrega aria-current="step"', async () => {
      // accessibility.item3 — `step` é o token que a WAI-ARIA define para
      // posição num processo; `true` diria "este é o atual" sem dizer atual do
      // quê. E deixar o atributo para trás ao avançar daria DOIS "atual" na
      // mesma lista, que é pior do que nenhum.
      const current = root.querySelectorAll('[aria-current]');
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveAttribute('aria-current', 'step');
      await expect(current[0]).toBe(triggerOfStep(root, args.value));
    });

    await step('A etapa concluída troca o número por uma marca, e por uma palavra', async () => {
      // Os dois caminhos da decisão 3 do primitivo: forma (sobrevive a
      // daltonismo e a tela monocromática) e palavra (chega a quem não vê a
      // marca). Só roda quando há etapa antes da atual.
      const completedStep = args.value - 1;
      if (completedStep < 1) return;

      const trigger = triggerOfStep(root, completedStep)!;
      const indicator = trigger.querySelector<HTMLElement>('[data-slot="stepper-indicator"]')!;
      await expect(indicator.querySelector('svg')).not.toBeNull();
      await expect(indicator.textContent).toBe('');

      const stateLabel = trigger.querySelector('[data-slot="stepper-state-label"]');
      await expect(stateLabel).toHaveTextContent(args.labels.completed!);
      await expect(stateLabel).toHaveClass('nds-sr-only');
    });

    await step('Indicador e traço ficam fora da árvore de acessibilidade', async () => {
      // accessibility.item4 — o número do indicador repete a posição que a
      // lista já anuncia, e ler os dois faz o leitor de tela dizer a mesma
      // coisa duas vezes.
      const decorative = root.querySelectorAll(
        '[data-slot="stepper-indicator"], [data-slot="stepper-separator"]',
      );
      await expect(decorative.length).toBe(SIGNUP_STEPS.length * 2 - 1);
      for (const el of decorative) {
        await expect(el).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Nada no fluxo é região viva', async () => {
      // accessibility.item6 — um indicador que se reanuncia a cada avanço
      // atropela a leitura do resto da tela. Quem anuncia o avanço é o painel
      // que trocou de conteúdo.
      await expect(root.querySelectorAll('[aria-live]')).toHaveLength(0);
      await expect(root.querySelectorAll('[role="status"], [role="alert"], [role="log"]'))
        .toHaveLength(0);
      await expect(root.hasAttribute('aria-live')).toBe(false);
    });

    await step('Acionar um gatilho disponível avisa quem consome, com o número da etapa', async () => {
      // O ouvinte é delegado na raiz e lê o `data-step` no momento do clique:
      // é o que o mantém correto depois de `setStepperValue` e depois de o
      // consumidor acrescentar etapas. Zerar o espião aqui é o que faz a
      // contagem valer no replay do painel, que roda no mesmo DOM.
      const spy = args.onStepSelect as unknown as ReturnType<typeof fn>;
      spy.mockClear();
      const last = SIGNUP_STEPS[SIGNUP_STEPS.length - 1];
      await userEvent.click(triggerOfStep(root, last.step)!);
      await expect(spy).toHaveBeenCalledTimes(1);
      await expect(spy).toHaveBeenCalledWith(last.step);

      // A foto do Chromatic é tirada depois da play: sair do gatilho deixa o
      // fluxo no estado de montagem, e não num anel de foco que só existe
      // porque houve um clique de teste.
      triggerOfStep(root, last.step)!.blur();
    });
  },
};
