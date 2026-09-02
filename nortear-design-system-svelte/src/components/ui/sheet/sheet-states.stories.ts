import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import { sheetSource, sheetTermosWithScrollSource } from './sheet.source';

// Fechado e aberto são os dois extremos do ciclo. Fechado o painel nem existe
// no DOM; aberto, o foco entra e fica preso até o fechamento.

const meta: Meta = {
  title: 'Primitives/Overlay/Sheet/States',
  component: SheetStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para os quatro estados: cada story declara os próprios args, e
      // é deles que sai o snippet — inclusive o `open` que a torna controlada.
      source: { transform: sheetSource },
      description: {
        component:
          'Estados canônicos do Sheet: Closed (inicial), Open, LongScrollBody (corpo mais ' +
          'alto que o painel), WithCloseButtonHidden (sem o botão do canto) e Controlled ' +
          '(estado externo).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: {
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado inicial. O painel não está no DOM, e o gatilho anuncia que existe um ' +
          'diálogo por trás dele sem prometer que já está aberto.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
      await expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    });

    await step('O gatilho anuncia o diálogo sem afirmar que está aberto', async () => {
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('data-slot', 'sheet-trigger');
    });
  },
};

export const Open: Story = {
  args: {
    open: true,
    side: 'right',
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Aberto por estado inicial, sem interação nenhuma. O foco entra no painel e o ' +
          'restante da página fica inerte enquanto ele durar.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('Monta já aberto, com o contrato de markup completo', async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAccessibleName();
      await expect(panel).toHaveAccessibleDescription();
      await expect(document.querySelector('[data-slot="sheet-overlay"]')).not.toBeNull();
    });

    await step('O foco está dentro do painel', async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });
  },
};

export const LongScrollBody: Story = {
  args: {
    open: true,
    side: 'right',
    variant: 'withScrollContent',
    triggerLabel: 'Ver termos',
    title: 'Termos e condições',
    description: 'Leia atentamente antes de aceitar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    covers: ['visual.item4'],
    docs: {
      source: { transform: sheetTermosWithScrollSource },
      description: {
        story:
          'Corpo mais alto que o painel. O corpo rola sozinho e o rodapé continua visível — ' +
          "é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');
    const body = panel.querySelector<HTMLElement>('[data-slot="sheet-body"]')!;
    const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]')!;

    await step('O corpo é quem rola, não o painel', async () => {
      await expect(body).not.toBeNull();
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o `flex: 1 1 auto` do corpo é o que segura o rodapé.
      await expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight + 1);
    });

    await step('A região rolável é alcançável por teclado', async () => {
      // WCAG 2.1.1 — sem o tabindex quem navega por teclado não consegue rolar
      // o corpo (é a regra scrollable-region-focusable do axe).
      await expect(body).toHaveAttribute('tabindex', '0');
    });

    await step('O rodapé continua visível com o corpo cheio', async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};

export const WithCloseButtonHidden: Story = {
  args: {
    open: true,
    side: 'right',
    showCloseButton: false,
    triggerLabel: 'Convidar',
    title: 'Convidar para o time',
    description: 'Envie um convite por e-mail.',
    actionLabel: 'Enviar convite',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Sem o botão do canto. Só faz sentido quando o rodapé já oferece uma saída ' +
          'explícita — Escape continua fechando de qualquer forma.',
      },
    },
  },
  play: async ({ step }) => {
    const panel = await waitForPortal('dialog');

    await step('O botão do canto não é renderizado', async () => {
      await expect(panel).toBeVisible();
      await expect(
        within(panel).queryByRole('button', { name: /^Fechar$/i }),
      ).not.toBeInTheDocument();
    });

    await step('E ainda assim existe uma saída — o rodapé', async () => {
      const footer = panel.querySelector<HTMLElement>('[data-slot="sheet-footer"]');
      await expect(footer).not.toBeNull();
      await expect(within(footer!).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};

export const Controlled: Story = {
  args: {
    open: false,
    triggerLabel: 'Abrir pelo estado externo',
    title: 'Controlado pelo pai',
    description: 'Este painel é comandado por estado externo e devolve cada mudança a quem é dono dele.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Estado do lado de fora. O valor ligado manda no painel, e o painel devolve cada ' +
          'mudança — Escape fecha mesmo assim.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir pelo estado externo/i });

    await step('O estado externo abre o painel', async () => {
      if (within(document.body).queryAllByRole('dialog').length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal('dialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
    });

    await step('Escape fecha o painel controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('dialog');
      // Se o valor ligado não tivesse voltado a false, o painel reabriria no
      // próximo ciclo de render.
      await expect(within(document.body).queryAllByRole('dialog')).toHaveLength(0);
    });
  },
};
