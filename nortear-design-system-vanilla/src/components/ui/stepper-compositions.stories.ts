import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { createButton } from './button';
import { setStepperValue } from './stepper';
import {
  buildStepper,
  FLOW_LABEL,
  SIGNUP_STEPS,
  SIGNUP_STEPS_WITH_DESCRIPTIONS,
  STATE_LABELS,
  triggerOfStep,
} from './stepper.fixtures';
import { stepperSource, stepperSourceWith } from './stepper.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Primitives/Navigation/Stepper/Compositions',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'padded',
    docs: {
      source: { transform: stepperSource },
      description: {
        component:
          'Modos de uso do Stepper, com a fiação por fora: o fluxo completo, em que quem consome move o valor e troca o painel, e as etapas com texto de apoio sob o título.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onStepSelect = fn();

const BACK_LABEL = 'Voltar';
const NEXT_LABEL = 'Avançar';
const PANEL_TEST_ID = 'stepper-wizard-panel';

// ─── Wizard ───────────────────────────────────────────────────────────────────

export const Wizard: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      source: {
        transform: stepperSourceWith({
          value: 1,
          labels: STATE_LABELS,
          onStepSelect: 'irPara(step);',
        }),
      },
      description: {
        story:
          'O indicador acima do painel da etapa, com os controles de voltar e avançar embaixo. Quem move o fluxo é a aplicação: o componente informa a etapa escolhida e recebe de volta o novo valor.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'lg';

    let value = 1;

    const root = buildStepper({
      'aria-label': FLOW_LABEL,
      value,
      labels: STATE_LABELS,
      steps: SIGNUP_STEPS,
      onStepSelect: (step) => {
        onStepSelect(step);
        goTo(step);
      },
    });

    const panel = document.createElement('div');
    panel.dataset.testid = PANEL_TEST_ID;
    panel.className =
      'nds-text-body nds-text-muted-foreground nds-p-4 nds-rounded-md nds-border-default nds-bg-card';
    // Recebe foco por programa e só por programa: fora da ordem de tabulação,
    // mas com um alvo para onde o avanço possa mandar a leitura.
    panel.tabIndex = -1;

    const back = createButton({
      variant: 'outline',
      label: BACK_LABEL,
      onClick: () => goTo(value - 1),
    });
    const next = createButton({
      label: NEXT_LABEL,
      onClick: () => goTo(value + 1),
    });

    const actions = document.createElement('div');
    actions.className = 'nds-cluster';
    actions.dataset.spacing = 'md';
    actions.append(back, next);

    /**
     * A aplicação é dona do valor: o componente só informa qual etapa foi
     * escolhida. Quem anuncia o avanço é este painel, que trocou de conteúdo —
     * o indicador não é região viva de propósito.
     */
    function goTo(step: number): void {
      const target = Math.min(Math.max(step, 1), SIGNUP_STEPS.length);
      const moved = target !== value;
      value = target;
      setStepperValue(root, value);
      panel.textContent = SIGNUP_STEPS[value - 1].title;
      back.disabled = value === 1;
      next.disabled = value === SIGNUP_STEPS.length;
      // O foco vai para o PAINEL, e não para o indicador: quem anuncia o
      // avanço é o conteúdo que mudou, e é isso que dispensa a região viva.
      // Só na troca — na montagem não há avanço nenhum a anunciar.
      if (moved) panel.focus({ preventScroll: true });
    }

    goTo(value);
    wrapper.append(root, panel, actions);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;
    const panel = canvasElement.querySelector<HTMLElement>(`[data-testid="${PANEL_TEST_ID}"]`)!;
    const back = canvas.getByRole('button', { name: BACK_LABEL }) as HTMLButtonElement;
    const next = canvas.getByRole('button', { name: NEXT_LABEL }) as HTMLButtonElement;

    /** Leva o fluxo a uma etapa conhecida — a precondição de cada passo. */
    const select = async (target: number) => {
      await userEvent.click(triggerOfStep(root, target)!);
    };

    await step('Selecionar uma etapa informa o número daquela etapa', async () => {
      // functional.item2 — o número sai do `data-step` do item no momento do
      // clique, e não de uma captura feita na montagem: é o que mantém o
      // ouvinte correto depois de o fluxo andar.
      await select(1);
      onStepSelect.mockClear();
      await select(3);
      await expect(onStepSelect).toHaveBeenCalledTimes(1);
      await expect(onStepSelect).toHaveBeenCalledWith(3);
      await expect(root.dataset.value).toBe('3');
      await expect(panel).toHaveTextContent(SIGNUP_STEPS[2].title);
      // E o foco acompanha o conteúdo, em vez de ficar no gatilho apertado.
      await expect(panel).toHaveFocus();
    });

    await step('Avançar move o fluxo para a etapa seguinte', async () => {
      await select(1);
      await userEvent.click(next);
      await expect(root.dataset.value).toBe('2');
      await expect(panel).toHaveTextContent(SIGNUP_STEPS[1].title);
    });

    await step('Voltar desfaz o avanço', async () => {
      await select(3);
      await userEvent.click(back);
      await expect(root.dataset.value).toBe('2');
      await expect(panel).toHaveTextContent(SIGNUP_STEPS[1].title);
    });

    await step('Nos extremos, o controle que não leva a lugar nenhum fica indisponível', async () => {
      await select(1);
      await expect(back.disabled).toBe(true);
      await expect(next.disabled).toBe(false);

      await select(SIGNUP_STEPS.length);
      await expect(next.disabled).toBe(true);
      await expect(back.disabled).toBe(false);

      // Fecha o ciclo no estado de montagem, para a foto do Chromatic sair
      // igual em toda rodada.
      await select(1);
      panel.blur();
    });
  },
};

// ─── WithDescriptions ─────────────────────────────────────────────────────────

export const WithDescriptions: Story = {
  parameters: {
    docs: {
      source: {
        transform: stepperSourceWith({ value: 2, steps: SIGNUP_STEPS_WITH_DESCRIPTIONS }),
      },
      description: {
        story:
          'Etapas com texto de apoio sob o título, para quando o nome sozinho não basta. A descrição mora dentro do controle, então entra no que o leitor de tela anuncia junto com o título.',
      },
    },
  },
  render: () =>
    buildStepper({
      'aria-label': FLOW_LABEL,
      value: 2,
      labels: STATE_LABELS,
      steps: SIGNUP_STEPS_WITH_DESCRIPTIONS,
      onStepSelect,
    }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="stepper"]')!;

    await step('Cada etapa mostra o título e o texto de apoio, em peças separadas', async () => {
      for (const def of SIGNUP_STEPS_WITH_DESCRIPTIONS) {
        const trigger = triggerOfStep(root, def.step)!;
        const title = trigger.querySelector('[data-slot="stepper-title"]')!;
        const description = trigger.querySelector('[data-slot="stepper-description"]')!;
        await expect(title).toHaveTextContent(def.title);
        await expect(description).toHaveTextContent(def.description!);
        await expect(description).toHaveClass('nds-stepper-description');
      }
    });

    await step('O texto de apoio fica dentro do controle, e não solto no item', async () => {
      // É o que o faz entrar no nome acessível junto com o título. Solto no
      // item, ele seria lido depois do botão, desligado da etapa que descreve.
      const descriptions = root.querySelectorAll('[data-slot="stepper-description"]');
      await expect(descriptions).toHaveLength(SIGNUP_STEPS_WITH_DESCRIPTIONS.length);
      for (const description of descriptions) {
        await expect(description.closest('[data-slot="stepper-trigger"]')).not.toBeNull();
      }
    });
  },
};
