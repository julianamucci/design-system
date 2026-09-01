import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import { NDS_STEPPER, type StepperLabels } from './stepper';

// ─── Fixture ──────────────────────────────────────────────────────────────────
//
// Nomes em constante porque as plays procuram por eles. Literal repetido à mão
// é o que faz uma story LANÇAR em vez de reprovar.

const FLOW_LABEL = 'Progresso do cadastro';

const STEP_TITLES = {
  account: 'Conta',
  address: 'Endereço',
  payment: 'Pagamento',
  review: 'Revisão',
} as const;

const STATE_LABELS: StepperLabels = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

/** Valor do fluxo em todas as fixtures deste arquivo. */
const CURRENT_STEP = 2;

const STATE_LABEL_SLOT = '[data-slot="stepper-state-label"]';
const INDICATOR_SLOT = '[data-slot="stepper-indicator"]';

/**
 * Espião da saída da raiz.
 *
 * Mora no módulo porque a play precisa lê-lo de fora do template. Nas asserções
 * o que se cobra é a AUSÊNCIA de chamada, que sobrevive ao replay do painel
 * Interactions: a etapa indisponível nunca chama, quantas vezes a play rode.
 */
const selectSpy = fn();

const meta: Meta = {
  title: 'Primitives/Navigation/Stepper/States',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_STEPPER] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As quatro situações em que uma etapa cai. Três delas são DERIVADAS do valor atual ' +
          'do fluxo — nenhuma se escreve à mão —, e a quarta é a etapa que a aplicação marca ' +
          'como indisponível.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Fluxo de três etapas com o valor na segunda; `extra` entra na terceira. */
function threeSteps(extraNaTerceira = ''): string {
  return `
    <ol
      ndsStepper
      [value]="${CURRENT_STEP}"
      aria-label="${FLOW_LABEL}"
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
      <li ndsStepperItem [step]="3" ${extraNaTerceira}>
        <button ndsStepperTrigger>
          <span ndsStepperIndicator></span>
          <span ndsStepperTitle>${STEP_TITLES.payment}</span>
        </button>
      </li>
    </ol>
  `;
}

const props = { labels: STATE_LABELS, onStepSelect: selectSpy };

/**
 * Etapa ainda não alcançada.
 *
 * Sem `covers`: o contrato de teste não tem item para o estado neutro — ele é o
 * fundo contra o qual os outros três se leem. A prova continua valendo.
 */
export const Inactive: Story = {
  render: () => ({ props, template: threeSteps() }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A etapa depois da atual fica neutra', async () => {
      const item = canvas.getAllByRole('listitem')[2];
      await expect(item.getAttribute('data-state')).toBe('inactive');
    });

    await step('O indicador mostra o número, e não a marca de verificação', async () => {
      const item = canvas.getAllByRole('listitem')[2];
      const indicator = item.querySelector(INDICATOR_SLOT)!;
      await expect(indicator.textContent?.trim()).toBe('3');
      await expect(indicator.querySelector('svg')).toBeNull();
    });

    await step('Não se anuncia como atual nem carrega palavra de estado', async () => {
      const item = canvas.getAllByRole('listitem')[2];
      const trigger = item.querySelector('[data-slot="stepper-trigger"]')!;
      await expect(trigger.getAttribute('aria-current')).toBeNull();
      // A palavra do leitor de tela é a diferença entre concluída e futura:
      // aqui ela tem de estar VAZIA, não sobrando da etapa anterior.
      await expect(trigger.querySelector(STATE_LABEL_SLOT)?.textContent?.trim()).toBe('');
    });
  },
};

/**
 * Etapa atual.
 *
 * Sem `covers`: `functional.item1` cobre a resolução dos três estados de uma vez
 * e vive na Playground. Aqui a prova é só do controle atual.
 */
export const Active: Story = {
  render: () => ({ props, template: threeSteps() }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A etapa igual ao valor do fluxo fica ativa', async () => {
      const item = canvas.getAllByRole('listitem')[1];
      await expect(item.getAttribute('data-state')).toBe('active');
      await expect(item.querySelector(INDICATOR_SLOT)?.textContent?.trim()).toBe('2');
    });

    await step('O controle carrega aria-current="step", e não "true"', async () => {
      const trigger = canvas
        .getAllByRole('listitem')[1]
        .querySelector('[data-slot="stepper-trigger"]')!;
      // `step` é o token que a WAI-ARIA define para posição num processo;
      // `true` diria "este é o atual" sem dizer atual do quê.
      await expect(trigger.getAttribute('aria-current')).toBe('step');
    });

    await step('E leva a palavra de estado ao leitor de tela', async () => {
      const trigger = canvas
        .getAllByRole('listitem')[1]
        .querySelector('[data-slot="stepper-trigger"]')!;
      await expect(trigger.querySelector(STATE_LABEL_SLOT)?.textContent?.trim()).toBe(
        STATE_LABELS.current,
      );
    });
  },
};

/**
 * Etapa concluída — a anterior à atual, e uma marcada fora de ordem.
 *
 * A terceira etapa vem com `completed`, mesmo estando DEPOIS da atual: é o caso
 * do fluxo que aceita ordem fora do comum, e o que separa o estado derivado do
 * estado declarado.
 */
export const Completed: Story = {
  parameters: { covers: ['functional.item4', 'visual.item2'] },
  render: () => ({ props, template: threeSteps('[completed]="true"') }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A etapa anterior à atual conclui sozinha', async () => {
      const item = canvas.getAllByRole('listitem')[0];
      await expect(item.getAttribute('data-state')).toBe('completed');
      await expect(item.getAttribute('data-completed')).toBeNull();
    });

    await step('A etapa marcada conclui mesmo estando depois da atual', async () => {
      const item = canvas.getAllByRole('listitem')[2];
      await expect(item.getAttribute('data-state')).toBe('completed');
      // `data-completed` reflete a marcação de quem compõe, não o estado
      // resolvido: é isso que distingue os dois caminhos.
      await expect(item.getAttribute('data-completed')).toBe('');
    });

    await step('O número dá lugar a uma marca de verificação', async () => {
      // Forma, não matiz: sobrevive a daltonismo e a tela monocromática.
      for (const index of [0, 2]) {
        const indicator = canvas.getAllByRole('listitem')[index].querySelector(INDICATOR_SLOT)!;
        const checkMark = indicator.querySelector('svg');
        await expect(checkMark).not.toBeNull();
        // O ícone é montado por createElementNS — svg vazio seria uma marca que
        // não desenhou nada, e ninguém veria falhar.
        await expect(checkMark!.childElementCount).toBeGreaterThan(0);
        await expect(indicator.textContent?.trim()).toBe('');
      }
    });

    await step('E a palavra de estado acompanha', async () => {
      const trigger = canvas
        .getAllByRole('listitem')[0]
        .querySelector('[data-slot="stepper-trigger"]')!;
      await expect(trigger.querySelector(STATE_LABEL_SLOT)?.textContent?.trim()).toBe(
        STATE_LABELS.completed,
      );
    });
  },
};

/**
 * Etapa indisponível.
 *
 * `disabled` de verdade no botão, e não `aria-disabled`: aqui não há navegação
 * por setas em que a etapa precise ser alcançada para ser anunciada. Um controle
 * focável que não leva a lugar nenhum é uma parada de foco que gasta o tempo de
 * quem navega por teclado sem entregar nada.
 */
export const Disabled: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item5', 'visual.item3'] },
  render: () => ({ props, template: threeSteps('[disabled]="true"') }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const unavailableItem = () => canvas.getAllByRole('listitem')[2];
    const unavailableTrigger = () =>
      unavailableItem().querySelector<HTMLButtonElement>('[data-slot="stepper-trigger"]')!;

    await step('O item se marca indisponível', async () => {
      await expect(unavailableItem().getAttribute('data-disabled')).toBe('');
    });

    await step('O controle está desabilitado de verdade', async () => {
      await expect(unavailableTrigger()).toBeDisabled();
    });

    await step('E por isso sai da ordem de tabulação', async () => {
      const trigger = unavailableTrigger();
      const focusBefore = canvasElement.ownerDocument.activeElement;
      trigger.focus();
      // Botão nativamente desabilitado não recebe foco: o foco fica onde estava.
      await expect(canvasElement.ownerDocument.activeElement).not.toBe(trigger);
      await expect(canvasElement.ownerDocument.activeElement).toBe(focusBefore);
    });

    await step('O ponteiro também não o alcança', async () => {
      await expect(getComputedStyle(unavailableItem()).pointerEvents).toBe('none');
    });

    await step('E a seleção não dispara', async () => {
      // `pointerEventsCheck: 0` porque o item tem `pointer-events: none`: sem
      // isso o userEvent recusa o clique e o passo não exercitaria nada.
      await userEvent.click(unavailableTrigger(), { pointerEventsCheck: 0 });
      await expect(selectSpy).toHaveBeenCalledTimes(0);
    });
  },
};
