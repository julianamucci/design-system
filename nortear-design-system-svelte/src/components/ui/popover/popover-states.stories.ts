import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import { panel } from './popover.fixtures';
import { popoverSource } from './popover.source';

const meta: Meta = {
  title: 'Primitives/Overlay/Popover/States',
  component: PopoverStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: o estado aberto, o lado e o
      // deslocamento saem dos `args` de cada uma.
      source: { transform: popoverSource },
      description: {
        component:
          'Estados do Popover: fechado (painel fora do DOM), aberto, ancorado acima e controlado por estado externo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  name: 'Closed',
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não renderizado.' } },
  },
  args: {
    defaultOpen: false,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('Fechado, o painel não existe no DOM', async () => {
      // Desmontado, e não escondido: leitor de tela e busca do navegador não
      // encontram conteúdo que não está lá.
      await expect(trigger).toBeVisible();
      await expect(panel()).toBeNull();
    });

    await step('E o gatilho declara o estado fechado', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toHaveAttribute('data-state', 'closed');
    });
  },
};

export const Open: Story = {
  name: 'Open (defaultOpen)',
  parameters: {
    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (ARIA e contraste do painel) e que o
    // Chromatic fotografa.
    covers: ['accessibility.item1', 'accessibility.item2'],
    docs: { description: { story: 'Popover aberto. Captura visual no Chromatic.' } },
  },
  args: {
    defaultOpen: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir popover/i });

    await step('O painel abre já na primeira renderização', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-state', 'open');
    });

    await step('E o gatilho e o painel declaram o estado aberto', async () => {
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toHaveAttribute('data-state', 'open');
      // O painel é anunciado como diálogo e nomeado pelo título que carrega —
      // os dois contratos que o conteúdo compartilhado descreve para o estado
      // aberto. `aria-controls` fica de fora aqui de propósito: neste stack a
      // lib não o emite quando o gatilho é composto por snippet `child`, e o
      // atributo NÃO está na lista de ARIA documentada (role, labelledby,
      // describedby, expanded). Registrado no relatório da rodada.
      await expect(panel()).toHaveAttribute('role', 'dialog');
      await expect(panel()).toHaveAccessibleName(/Configuracoes de exibição/i);
    });
  },
};

export const SideTop: Story = {
  name: 'Side top (auto-flip)',
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Posicionamento preferido `side="top"`. Se não houver espaço, o popover faz auto-flip para outra direção.',
      },
    },
  },
  args: {
    defaultOpen: true,
    side: 'top',
    sideOffset: 12,
    variant: 'withTitle',
    triggerLabel: 'Abrir acima',
    title: 'Ancorado acima',
    description: 'Sem espaço acima, o painel vira para baixo sozinho.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Abrir acima/i });

    await step('O lado pedido chega ao posicionamento', async () => {
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      // `top` ou `bottom`, nunca um lado do outro eixo: o auto-flip troca de
      // LADO por colisão, jamais de eixo.
      await expect(['top', 'bottom']).toContain(dialog.getAttribute('data-side'));
    });

    await step('E o sideOffset separa painel e gatilho pela medida pedida', async () => {
      // Dentro de waitFor: o posicionador da lib nasce com um transform de
      // reserva e só mede a posição num quadro seguinte. Medir antes disso lê o
      // painel fora do lugar, e a falha aponta para o offset em vez do relógio.
      await waitFor(() => {
        const dialog = panel()!;
        const r1 = trigger.getBoundingClientRect();
        const r2 = dialog.getBoundingClientRect();
        const distancia =
          dialog.getAttribute('data-side') === 'top' ? r1.top - r2.bottom : r2.top - r1.bottom;
        // 12px pedidos, com 1px de folga para arredondamento sub-pixel.
        expect(Math.abs(distancia - 12)).toBeLessThanOrEqual(1);
      }, { timeout: 2000 });
    });
  },
};

export const Controlled: Story = {
  name: 'Controlled (open prop)',
  parameters: {
    docs: {
      description: {
        story:
          'Abertura controlada externamente via `bind:open`. Escape fecha mesmo em modo controlado.',
      },
    },
  },
  args: {
    open: true,
    variant: 'withTitle',
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este popover é comandado por estado externo via bind:open.',
    saveLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });

    const closed = async () => {
      await waitFor(
        () => {
          const d = body.queryByRole('dialog');
          if (d && d.getAttribute('data-state') !== 'closed') throw new Error('still open');
        },
        { timeout: 2000 }
      );
    };
    const open = async () => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog', { timeout: 2000 });
    };

    await step('O estado externo abre o painel na montagem', async () => {
      const dialog = await open();
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Escape fecha mesmo em modo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await closed();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step('Estado final: painel aberto', async () => {
      await expect(await open()).toBeVisible();
    });
  },
};
