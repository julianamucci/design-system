import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_TOOLTIP } from './tooltip';
import { NdsButton } from './button';

// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora).
// A diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

const ICONE_SALVAR = `<svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="nds-icon nds-shrink-0"
        >
          <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
          <path d="M7 3v4a1 1 0 0 0 1 1h7" />
        </svg>`;

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const DELAY_LONGO = 600;

function balaoDe(gatilho: HTMLElement): HTMLElement | null {
  const id = gatilho.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function espera(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta: Meta = {
  title: 'UI/Tooltip/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_TOOLTIP, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
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
  render: () => ({
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${ICONE_SALVAR}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button');

    await step('O balão não está no DOM, nem no canvas nem no portal', async () => {
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
    });

    await step('Sem balão, não há describedby apontando para o vazio', async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(gatilho.getAttribute('aria-describedby')).toBeNull();
    });
  },
};

export const Open: Story = {
  render: () => ({
    props: { aberto: true },
    template: `
      <div ndsTooltipProvider [delay]="0" class="nds-p-8">
        <span ndsTooltip [open]="aberto" (openChange)="aberto = $event">
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${ICONE_SALVAR}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button');

    await step('O estado externo abre o balão sem interação nenhuma', async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveAttribute('role', 'tooltip');
      await expect(balao).toHaveAttribute('data-state', 'open');
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step('E o gatilho passa a apontar para ele', async () => {
      await expect(document.getElementById(gatilho.getAttribute('aria-describedby')!)).toBe(
        balaoDe(gatilho),
      );
    });
  },
};

export const Hover: Story = {
  parameters: { covers: ['functional.item1'] },
  render: () => ({
    props: { atraso: DELAY_LONGO },
    template: `
      <div ndsTooltipProvider [delay]="atraso" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${ICONE_SALVAR}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button');

    await step('O mouse passando não abre — o delay é o que separa passar de parar', async () => {
      await userEvent.hover(gatilho);
      await expect(balaoDe(gatilho)).toBeNull();
    });

    await step('Parado sobre o gatilho, o balão abre depois do delay do provider', async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(gatilho)).not.toBeNull();
        },
        { timeout: DELAY_LONGO * 5 },
      );
      await expect(balaoDe(gatilho)).toHaveAttribute('data-state', 'open');
    });
  },
};

export const Focus: Story = {
  parameters: { covers: ['functional.item2'] },
  render: () => ({
    props: { atraso: DELAY_LONGO },
    template: `
      <div ndsTooltipProvider [delay]="atraso" class="nds-p-8">
        <span ndsTooltip>
          <button ndsTooltipTrigger ndsButton variant="ghost" size="icon" aria-label="Salvar">
            ${ICONE_SALVAR}
          </button>
          <ng-template ndsTooltipContent>Salvar (Ctrl+S)</ng-template>
        </span>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const gatilho = within(canvasElement).getByRole('button');

    await step('O foco abre na hora, mesmo com o provider pedindo espera', async () => {
      // Quem chega por teclado não tem como "parar em cima": esperar o delay
      // aqui seria o mesmo que esconder a informação de quem não usa mouse.
      gatilho.focus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)).toHaveAttribute('data-state', 'open');
    });

    await step('Sair do gatilho fecha o balão', async () => {
      gatilho.blur();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
      });
    });
  },
};

export const PersistenceInBubble: Story = {
  parameters: { covers: ['functional.item4'] },
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
    const gatilho = within(canvasElement).getByRole('button');

    await step('O hover abre o balão', async () => {
      await userEvent.hover(gatilho);
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
    });

    await step('Levar o mouse até o balão não fecha nada', async () => {
      const balao = balaoDe(gatilho)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no
      // elemento.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await espera(200);
      await expect(balaoDe(gatilho)).not.toBeNull();
    });
  },
};
