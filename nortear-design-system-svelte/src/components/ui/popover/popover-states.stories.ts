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
          'Estados do Popover: fechado (painel fora do DOM), aberto e controlado por estado externo.',
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
