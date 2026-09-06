import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import { balaoDe, SAVE_ICON } from './tooltip.fixtures';
import { NdsButton } from './button';
import {
  tooltipClosedSource,
  tooltipDelaySource,
  tooltipOpenSource,
  tooltipPersistenceSource,
} from './tooltip.source';

// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora).
// A diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const LONG_DELAY = 600;

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta: Meta = {
  title: 'Components/Overlay/Tooltip/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_TOOLTIP, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, ' +
          'do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o ' +
          'balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: { docs: { source: { transform: tooltipClosedSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(trigger.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: { docs: { source: { transform: tooltipOpenSource } } },
  render: () => ({
    props: { isOpen: true },
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [open]="isOpen" (openChange)="isOpen = $event">
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O estado externo abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      const balao = balaoDe(trigger)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      await expect(document.getElementById(trigger.getAttribute('aria-describedby')!)).toBe(
        balaoDe(trigger),
      );
    });
  },
};

export const Hover: Story = {
  parameters: { covers: ['functional.item1'], docs: { source: { transform: tooltipDelaySource } } },
  render: () => ({
    props: { delay: LONG_DELAY },
    template: `
      <div ndsTooltipProvider [delay]="delay" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O mouse passando não abre — o delay é o que separa passar de parar', async () => {
      await userEvent.hover(trigger);
      await expect(balaoDe(trigger)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois do delay do provider', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(trigger)).not.toBeNull();
        },
        { timeout: LONG_DELAY * 5 },
      );
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'open');
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['functional.item2'], docs: { source: { transform: tooltipDelaySource } } },
  render: () => ({
    props: { delay: LONG_DELAY },
    template: `
      <div ndsTooltipProvider [delay]="delay" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${SAVE_ICON}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar o delay
      // aqui seria o mesmo que esconder a informação de quem não usa mouse.
      trigger.focus();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)).toHaveAttribute('data-state', 'open');
    });

    await step('Sair do gatilho fecha o balão', async () => {
      trigger.blur();
      await waitFor(async () => {
        await expect(balaoDe(trigger)).toBeNull();
      });
    });
  },
};

export const PersistenceInBubble: Story = {
  parameters: { covers: ['functional.item4'], docs: { source: { transform: tooltipPersistenceSource } } },
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="outline">Compartilhar</button>
          <ng-template ndsTooltipContent side="bottom"
            >Cria um link público de leitura</ng-template
          >
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button');

    await step('O hover abre o balão', async () => {
      await userEvent.hover(trigger);
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('Levar o mouse até o balão não fecha nada', async () => {
      const balao = balaoDe(trigger)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no
      // elemento.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await wait(200);
      await expect(balaoDe(trigger)).not.toBeNull();
    });
  },
};
