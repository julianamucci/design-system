import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  buildStepper,
  FLOW_LABEL,
  itemOfStep,
  SIGNUP_STEPS,
  STATE_LABELS,
  triggerOfStep,
  type StepperStepDef,
} from './stepper.fixtures';
import { stepperSource, stepperSourceWith } from './stepper.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Stepper/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: stepperSource },
      description: {
        component:
          'As quatro situações em que uma etapa cai: ainda não alcançada, em curso, concluída e indisponível. As três primeiras são derivadas do valor atual do fluxo; a quarta é declarada no item.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onStepSelect = fn();

/** A etapa que cada story coloca sob exame. */
const INACTIVE_STEP = 3;
const ACTIVE_STEP = 2;
const OUT_OF_ORDER_STEP = 4;
const BLOCKED_STEP = 3;

/** As mesmas quatro etapas, com a última concluída fora de ordem. */
const STEPS_WITH_COMPLETED: StepperStepDef[] = SIGNUP_STEPS.map((s) =>
  s.step === OUT_OF_ORDER_STEP ? { ...s, completed: true } : s,
);

/** As mesmas quatro etapas, com a terceira ainda indisponível. */
const STEPS_WITH_BLOCKED: StepperStepDef[] = SIGNUP_STEPS.map((s) =>
  s.step === BLOCKED_STEP ? { ...s, disabled: true } : s,
);

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Inactive: Story = {
  parameters: {
    docs: {
      source: { transform: stepperSourceWith({ value: 1 }) },
      description: {
        story:
          'Etapa depois da atual: círculo neutro com o número, sem marca de estado e sem aria-current.',
      },
    },
  },
  render: () =>
    buildStepper({
      'aria-label': FLOW_LABEL,
      value: 1,
      labels: STATE_LABELS,
      steps: SIGNUP_STEPS,
      onStepSelect,
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;

    await step('A etapa ainda não alcançada mostra o número, e nada mais', async () => {
      const item = itemOfStep(root, INACTIVE_STEP)!;
      await expect(item.dataset.state).toBe('inactive');

      const indicator = item.querySelector<HTMLElement>('[data-slot="stepper-indicator"]')!;
      await expect(indicator.textContent).toBe(String(INACTIVE_STEP));
      await expect(indicator.querySelector('svg')).toBeNull();
    });

    await step('Ela não se anuncia como atual nem carrega palavra de estado', async () => {
      // A palavra fica vazia de propósito: "etapa futura" é ruído — o que a
      // pessoa precisa ouvir é onde ela está, não onde ainda não chegou.
      const trigger = triggerOfStep(root, INACTIVE_STEP)!;
      await expect(trigger.hasAttribute('aria-current')).toBe(false);
      await expect(
        trigger.querySelector('[data-slot="stepper-state-label"]')!.textContent,
      ).toBe('');
    });

    await step('E continua sendo um controle disponível', async () => {
      // Não alcançada não é indisponível: quem quiser adiantar uma etapa
      // consegue, e quem não puder declara `disabled` no item.
      const trigger = triggerOfStep(root, INACTIVE_STEP)!;
      await expect(trigger.disabled).toBe(false);
      await expect(trigger.type).toBe('button');
    });
  },
};

export const Active: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Etapa igual ao valor atual do fluxo: círculo no primário, aria-current="step" no controle e a palavra de estado para quem usa leitor de tela.',
      },
    },
  },
  render: () =>
    buildStepper({
      'aria-label': FLOW_LABEL,
      value: ACTIVE_STEP,
      labels: STATE_LABELS,
      steps: SIGNUP_STEPS,
      onStepSelect,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;

    await step('A etapa atual é a única marcada como atual', async () => {
      // `step` é o token que a WAI-ARIA define para posição num processo;
      // `true` diria "este é o atual" sem dizer atual do quê.
      const current = root.querySelectorAll('[aria-current]');
      await expect(current).toHaveLength(1);
      await expect(current[0]).toHaveAttribute('aria-current', 'step');
      await expect(current[0]).toBe(triggerOfStep(root, ACTIVE_STEP));
      await expect(itemOfStep(root, ACTIVE_STEP)!.dataset.state).toBe('active');
    });

    await step('A palavra de estado acompanha a cor do círculo', async () => {
      const trigger = triggerOfStep(root, ACTIVE_STEP)!;
      const stateLabel = trigger.querySelector('[data-slot="stepper-state-label"]')!;
      await expect(stateLabel).toHaveTextContent(STATE_LABELS.current!);
      await expect(stateLabel).toHaveClass('nds-sr-only');
      // O nome acessível do controle junta a palavra ao título e mais nada — o
      // número do indicador fica de fora porque é desenho, e a âncora nas duas
      // pontas é justamente o que pega o dia em que ele vazar para a leitura.
      // O `\s*` existe porque a junção de nós de texto varia entre navegadores;
      // o que não varia é o que entra e o que fica de fora.
      const title = SIGNUP_STEPS[ACTIVE_STEP - 1].title;
      const named = canvas.getByRole('button', {
        name: new RegExp(`^${STATE_LABELS.current}\\s*${title}$`),
      });
      await expect(named).toBe(trigger);
    });
  },
};

export const Completed: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    docs: {
      source: { transform: stepperSourceWith({ value: ACTIVE_STEP, steps: STEPS_WITH_COMPLETED }) },
      description: {
        story:
          'Etapa concluída pelos dois caminhos: a anterior à atual, que a derivação resolve, e a última, marcada como concluída mesmo estando depois — que é o fluxo que aceita ordem fora do comum.',
      },
    },
  },
  render: () =>
    buildStepper({
      'aria-label': FLOW_LABEL,
      value: ACTIVE_STEP,
      labels: STATE_LABELS,
      steps: STEPS_WITH_COMPLETED,
      onStepSelect,
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;

    await step('A etapa marcada fora de ordem conta como concluída', async () => {
      // functional.item4 — a última vem DEPOIS da atual e mesmo assim está
      // concluída, porque o item declarou. É a única forma de estado que a
      // derivação não produz sozinha.
      const item = itemOfStep(root, OUT_OF_ORDER_STEP)!;
      await expect(item.dataset.step).toBe(String(OUT_OF_ORDER_STEP));
      await expect(Number(item.dataset.step)).toBeGreaterThan(Number(root.dataset.value));
      await expect(item.dataset.state).toBe('completed');
      await expect(item.hasAttribute('data-completed')).toBe(true);
    });

    await step('A marca de verificação toma o lugar do número', async () => {
      // Forma, não matiz: sobrevive a daltonismo e a tela monocromática.
      for (const completedStep of [ACTIVE_STEP - 1, OUT_OF_ORDER_STEP]) {
        const indicator = itemOfStep(root, completedStep)!.querySelector<HTMLElement>(
          '[data-slot="stepper-indicator"]',
        )!;
        const mark = indicator.querySelector('svg');
        await expect(mark).not.toBeNull();
        await expect(indicator.textContent).toBe('');
        await expect(indicator).toHaveAttribute('aria-hidden', 'true');
        // A marca tem dimensão própria. Sem ela o SVG estica para o círculo
        // inteiro de `--spacing-8` e vira uma mancha do tamanho do indicador —
        // defeito real, corrigido no primitivo; esta linha é a guarda.
        await expect(mark).toHaveClass('nds-icon');
      }
    });

    await step('E a palavra chega a quem não vê a marca', async () => {
      const stateLabel = triggerOfStep(root, OUT_OF_ORDER_STEP)!.querySelector(
        '[data-slot="stepper-state-label"]',
      )!;
      await expect(stateLabel).toHaveTextContent(STATE_LABELS.completed!);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item3'],
    docs: {
      source: { transform: stepperSourceWith({ value: ACTIVE_STEP, steps: STEPS_WITH_BLOCKED }) },
      description: {
        story:
          'Etapa que ainda não pode ser aberta: o controle sai da ordem de tabulação e a seleção não dispara. Um botão focável que não leva a lugar nenhum é uma parada de foco que não entrega nada.',
      },
    },
  },
  render: () =>
    buildStepper({
      'aria-label': FLOW_LABEL,
      value: ACTIVE_STEP,
      labels: STATE_LABELS,
      steps: STEPS_WITH_BLOCKED,
      onStepSelect,
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;

    await step('A indisponibilidade é declarada no item e aplicada no controle', async () => {
      const item = itemOfStep(root, BLOCKED_STEP)!;
      await expect(item.hasAttribute('data-disabled')).toBe(true);
      await expect(triggerOfStep(root, BLOCKED_STEP)!.disabled).toBe(true);
    });

    await step('O foco pula a etapa indisponível', async () => {
      // accessibility.item5 — a precondição é deste passo: o foco começa no
      // gatilho anterior ao bloqueado, e não onde a rodada passada o deixou.
      const before = triggerOfStep(root, BLOCKED_STEP - 1)!;
      const after = triggerOfStep(root, BLOCKED_STEP + 1)!;
      before.focus();
      await expect(before).toHaveFocus();

      await userEvent.tab();
      await expect(triggerOfStep(root, BLOCKED_STEP)).not.toHaveFocus();
      await expect(after).toHaveFocus();
      after.blur();
    });

    await step('Acionar a etapa indisponível não seleciona nada', async () => {
      // functional.item3 — `pointerEventsCheck: 0` porque a folha desliga o
      // ponteiro no item; sem ele o driver reprovaria antes de tentar, e o que
      // se quer provar é que o clique NÃO produz seleção.
      onStepSelect.mockClear();
      await userEvent.click(triggerOfStep(root, BLOCKED_STEP)!, { pointerEventsCheck: 0 });
      await expect(onStepSelect).not.toHaveBeenCalled();

      // E a etapa disponível ao lado continua selecionando — sem isto, o passo
      // acima passaria também num Stepper sem ouvinte nenhum.
      await userEvent.click(triggerOfStep(root, BLOCKED_STEP + 1)!);
      await expect(onStepSelect).toHaveBeenCalledTimes(1);
      await expect(onStepSelect).toHaveBeenCalledWith(BLOCKED_STEP + 1);
      triggerOfStep(root, BLOCKED_STEP + 1)!.blur();
    });
  },
};
