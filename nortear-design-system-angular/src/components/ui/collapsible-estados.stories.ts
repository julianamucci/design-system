import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { NDS_COLLAPSIBLE } from './collapsible';
import { NdsButton } from './button';

// Os quatro estados que o conteúdo compartilhado descreve: fechado, aberto,
// aberto por padrão e desabilitado. Cada um é uma story própria porque é assim
// que a regressão visual captura os dois extremos da animação de altura.

const CHEVRON = `<svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>`;

const PAINEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';

const meta: Meta = {
  title: 'UI/Collapsible/States',
  decorators: [moduleMetadata({ imports: [...NDS_COLLAPSIBLE, NdsButton] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Fechado é o padrão. Aberto pode vir do estado externo ou de defaultOpen — a ' +
          'diferença está em quem é dono do valor, não no que aparece na tela. Desabilitado ' +
          'mora no botão, que é quem tem o atributo nativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-full nds-max-w-sm">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Exibir filtros avançados</span>
          ${CHEVRON}
        </button>

        <div ndsCollapsiblePanel class="${PAINEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Fechado, o painel não está no DOM', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
      await expect(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      ).toBeNull();
    });

    await step('Sem painel, não há aria-controls apontando para o vazio', async () => {
      // Um `aria-controls` para um id ausente é violação de
      // aria-valid-attr-value — o mesmo axe que roda no addon-a11y desta story.
      await expect(trigger.getAttribute('aria-controls')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: { covers: ['accessibility.item5'] },
  render: () => ({
    props: { aberto: true },
    template: `
      <div ndsCollapsible class="nds-w-full nds-max-w-sm" [open]="aberto" (openChange)="aberto = $event">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Ocultar filtros avançados</span>
          ${CHEVRON}
        </button>

        <div ndsCollapsiblePanel class="${PAINEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const painel = canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]')!;

    await step('Aberto, o painel está no DOM e visível', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute('data-state', 'open');
      // Espera a transição de entrada assentar: `data-starting-style` é o que
      // segura a altura em zero no primeiro quadro, e medir o painel antes
      // disso mediria a animação, não o estado.
      await waitFor(async () => {
        await expect(painel).not.toHaveAttribute('data-starting-style');
      });
    });

    await step('A altura do painel vem da medição do primitivo', async () => {
      // O CSS compartilhado anima `height` lendo `--collapsible-panel-height`.
      // Sem a variável, a folha cairia no fallback `auto` e o fechamento não
      // teria de onde animar — o painel sumiria de uma vez.
      await expect(painel.style.getPropertyValue('--collapsible-panel-height')).not.toBe('');
    });
  },
};

export const OpenByDefault: Story = {
  parameters: { covers: ['functional.item3'] },
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-full nds-max-w-sm" [defaultOpen]="true">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Ocultar filtros avançados</span>
          ${CHEVRON}
        </button>

        <div ndsCollapsiblePanel class="${PAINEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('Monta já expandido, sem estado externo nenhum', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      ).toBeInTheDocument();
    });

    await step('E continua alternável — defaultOpen é ponto de partida, não trava', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'false') await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Disabled: Story = {
  parameters: { covers: ['functional.item6', 'visual.item5'] },
  render: () => ({
    template: `
      <div ndsCollapsible class="nds-w-full nds-max-w-sm">
        <button
          ndsCollapsibleTrigger
          ndsButton
          variant="ghost"
          class="nds-cluster nds-w-full nds-px-4"
          data-justify="between"
          [disabled]="true"
        >
          <span>Exibir filtros avançados</span>
          ${CHEVRON}
        </button>

        <div ndsCollapsiblePanel class="${PAINEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('O botão é desabilitado de verdade, não só na aparência', async () => {
      // `disabled` mora no botão porque é ele quem tem o atributo nativo: sem
      // clique, sem foco por Tab e sem ativação por teclado, tudo pelo
      // navegador. A raiz do Collapsible não disputa esse atributo.
      await expect(trigger).toBeDisabled();
    });

    await step('Clique não altera o estado do painel', async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      ).toBeNull();
    });

    await step('Teclado também não', async () => {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
