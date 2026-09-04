import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { computed, signal } from '@angular/core';
import { within, expect, fn, userEvent } from 'storybook/test';
import { NDS_STEPPER, type StepperLabels } from './stepper';
import { NdsButton } from './button';

// ─── Fixture ──────────────────────────────────────────────────────────────────

const FLOW_LABEL = 'Progresso do cadastro';

const STEPS = [
  { step: 1, title: 'Conta', description: 'Seus dados' },
  { step: 2, title: 'Endereço', description: 'Onde entregar' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar' },
  { step: 4, title: 'Revisão', description: 'Confira e envie' },
] as const;

const STATE_LABELS: StepperLabels = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

const BACK_LABEL = 'Voltar';
const NEXT_LABEL = 'Avançar';

/** Etapa que a play seleciona para provar a saída da raiz. */
const SELECTED_STEP = 3;

const meta: Meta = {
  title: 'Components/Navigation/Stepper/Compositions',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_STEPPER, NdsButton] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Modos de uso com a fiação por fora. O componente nunca decide para onde o fluxo vai: ' +
          'ele avisa qual etapa foi acionada e desenha o valor que a aplicação lhe devolve.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Uma etapa da fixture, com a descrição opcional. */
function stepMarkup(
  { step, title, description }: (typeof STEPS)[number],
  { withDescription, last }: { withDescription: boolean; last: boolean },
): string {
  return `
    <li ndsStepperItem [step]="${step}">
      <button ndsStepperTrigger>
        <span ndsStepperIndicator></span>
        <span ndsStepperTitle>${title}</span>
        ${withDescription ? `<span ndsStepperDescription>${description}</span>` : ''}
      </button>
      ${last ? '' : '<div ndsStepperSeparator></div>'}
    </li>
  `;
}

function listMarkup(withDescription: boolean): string {
  return STEPS.map((step, i) =>
    stepMarkup(step, { withDescription, last: i === STEPS.length - 1 }),
  ).join('');
}

// ─── Wizard ───────────────────────────────────────────────────────────────────
//
// O estado do fluxo vive FORA do componente, e é SINAL: esta stack roda sem
// zone, então é a escrita no sinal que agenda o redesenho. Um campo comum
// mudaria o valor e deixaria a tela como estava — e a play mediria a própria
// escrita, não o efeito dela.
//
// Mora no módulo porque a play precisa de um ponto de partida conhecido a cada
// passo: o painel Interactions reexecuta no mesmo DOM, sem remontar.

const wizardValue = signal(1);
const wizardSelect = fn();

const wizardPanel = computed(
  () => STEPS.find((e) => e.step === wizardValue())?.description ?? '',
);

/**
 * Fluxo completo — o indicador acima do painel da etapa, com os controles de
 * voltar e avançar embaixo.
 */
export const Wizard: Story = {
  parameters: { covers: ['functional.item2', 'visual.item4'] },
  render: () => ({
    props: {
      labels: STATE_LABELS,
      value: wizardValue,
      panel: wizardPanel,
      total: STEPS.length,
      onStepSelect: (step: number) => {
        wizardSelect(step);
        wizardValue.set(step);
      },
      back: () => wizardValue.update((v) => Math.max(1, v - 1)),
      next: () => wizardValue.update((v) => Math.min(STEPS.length, v + 1)),
    },
    template: `
      <div class="nds-stack" data-spacing="lg">
        <ol
          ndsStepper
          [value]="value()"
          aria-label="${FLOW_LABEL}"
          [labels]="labels"
          (stepSelect)="onStepSelect($event)"
        >
          ${listMarkup(false)}
        </ol>

        <p class="nds-text-body" data-testid="wizard-panel">{{ panel() }}</p>

        <div class="nds-cluster" data-spacing="md">
          <button ndsButton type="button" variant="outline" [disabled]="value() === 1" (click)="back()">
            ${BACK_LABEL}
          </button>
          <button ndsButton type="button" [disabled]="value() === total" (click)="next()">
            ${NEXT_LABEL}
          </button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const items = () => canvas.getAllByRole('listitem');
    const trigger = (index: number) =>
      items()[index].querySelector<HTMLButtonElement>('[data-slot="stepper-trigger"]')!;

    // Precondição de CADA passo, e não herança do anterior.
    const resetToFirst = async () => {
      if (items()[0].getAttribute('data-state') !== 'active') {
        await userEvent.click(trigger(0));
      }
    };

    await step('O fluxo começa na primeira etapa', async () => {
      await resetToFirst();
      await expect(items()[0].getAttribute('data-state')).toBe('active');
      await expect(canvas.getByRole('button', { name: BACK_LABEL })).toBeDisabled();
    });

    await step('Selecionar um controle disponível avisa o número da etapa', async () => {
      await resetToFirst();
      await userEvent.click(trigger(SELECTED_STEP - 1));
      await expect(wizardSelect).toHaveBeenLastCalledWith(SELECTED_STEP);
      // E o valor devolvido pela aplicação redesenha o indicador.
      await expect(items()[SELECTED_STEP - 1].getAttribute('data-state')).toBe('active');
      await expect(items()[0].getAttribute('data-state')).toBe('completed');
    });

    await step('Avançar e voltar movem o fluxo pelo mesmo valor', async () => {
      await userEvent.click(canvas.getByRole('button', { name: NEXT_LABEL }));
      await expect(items()[STEPS.length - 1].getAttribute('data-state')).toBe('active');
      await expect(canvas.getByRole('button', { name: NEXT_LABEL })).toBeDisabled();

      await userEvent.click(canvas.getByRole('button', { name: BACK_LABEL }));
      await expect(items()[SELECTED_STEP - 1].getAttribute('data-state')).toBe('active');
      // O painel é quem troca de conteúdo — e é ele que a aplicação anuncia,
      // não o indicador.
      await expect(canvas.getByTestId('wizard-panel').textContent?.trim()).toBe(
        STEPS[SELECTED_STEP - 1].description,
      );
    });
  },
};

// ─── Com descrições ───────────────────────────────────────────────────────────

const descriptionsValue = signal(2);

/**
 * Etapas com texto de apoio sob o título, para quando o nome sozinho não basta.
 *
 * Sem `covers`: o contrato de teste não tem item para a descrição — ela é
 * conteúdo, e o que ela precisa provar é que entra no nome acessível do
 * controle em vez de virar um segundo alvo.
 */
export const WithDescriptions: Story = {
  render: () => ({
    props: {
      labels: STATE_LABELS,
      value: descriptionsValue,
    },
    template: `
      <ol
        ndsStepper
        [value]="value()"
        aria-label="${FLOW_LABEL}"
        [labels]="labels"
      >
        ${listMarkup(true)}
      </ol>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada etapa mostra título e texto de apoio', async () => {
      const titles = canvasElement.querySelectorAll('[data-slot="stepper-title"]');
      const descriptions = canvasElement.querySelectorAll('[data-slot="stepper-description"]');
      await expect(titles).toHaveLength(STEPS.length);
      await expect(descriptions).toHaveLength(STEPS.length);
      await expect(descriptions[0].textContent?.trim()).toBe(STEPS[0].description);
    });

    await step('A descrição entra no nome do controle, sem virar outro alvo', async () => {
      // O texto de apoio é parte do que a etapa significa, então ele é LIDO
      // junto. O que não pode é receber foco por conta própria.
      const first = STEPS[0];
      const trigger = canvas.getByRole('button', {
        name: new RegExp(`${first.title}\\s+${first.description}`),
      });
      const description = trigger.querySelector('[data-slot="stepper-description"]')!;
      await expect(description.getAttribute('tabindex')).toBeNull();
      await expect(description.getAttribute('role')).toBeNull();
      await expect(canvas.getAllByRole('button')).toHaveLength(STEPS.length);
    });

    await step('E o traço entre etapas continua fora da leitura', async () => {
      const separators = canvasElement.querySelectorAll('[data-slot="stepper-separator"]');
      await expect(separators).toHaveLength(STEPS.length - 1);
      for (const separator of separators) {
        await expect(separator.getAttribute('aria-hidden')).toBe('true');
      }
    });
  },
};
