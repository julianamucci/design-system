import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import { balaoDe } from './tooltip.fixtures';
import { tooltipSource } from './tooltip.source';

// As composições que o conteúdo compartilhado documenta, mais os quatro lados de
// posicionamento. Em todas, o Tooltip acrescenta contexto a um elemento que JÁ
// se explica sozinho — nunca é o único portador da informação.

/** De que lado o balão nasceu — o gancho `data-side` que o CSS lê. */
function sideOf(balao: HTMLElement | null): string | null {
  return balao?.closest('[data-side]')?.getAttribute('data-side') ?? null;
}

const meta: Meta = {
  title: 'UI/Tooltip/Compositions',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: o lado, a variante e o
      // texto do balão já vêm dos args de cada uma.
      source: { transform: tooltipSource },
      description: {
        component:
          'Atalho de teclado em botão icon-only, descrição curta de ação e os quatro lados de posicionamento (top/right/bottom/left), um por story para a regressão visual isolar cada um.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const baseArgs = {
  defaultOpen: true,
  delayDuration: 0,
  align: 'center' as const,
  sideOffset: 4,
};

/**
 * O item visual de posicionamento fala de três lados (bottom, left e right), e
 * aqui cada lado tem story própria — as três juntas é que o cobrem.
 */
const COBRE_LADOS = { covers: ['visual.item3'] };

export const KeyboardShortcut: Story = {
  name: 'Keyboard shortcut on icon button',
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'withShortcut',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar',
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O nome acessível é do botão; o atalho é o extra', async () => {
      await expect(trigger).toHaveAttribute('aria-label', 'Salvar');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
    });

    await step('O atalho vai em <kbd>, e a folha reconhece a tecla', async () => {
      const balao = balaoDe(trigger)!;
      const teclas = balao.querySelectorAll('kbd');
      await expect(teclas.length).toBe(2);
      await expect(teclas[0].textContent).toBe('Ctrl');
      await expect(balao.querySelector('[data-slot="kbd"]')).not.toBeNull();
    });
  },
};

export const SideTop: Story = {
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Tooltip no topo',
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O balão nasce acima do gatilho', async () => {
      await waitFor(async () => {
        await expect(sideOf(balaoDe(trigger))).toBeTruthy();
      });
      await expect(sideOf(balaoDe(trigger))).toBe('top');
      await expect(balaoDe(trigger)!.textContent).toContain('Tooltip no topo');
    });
  },
};

export const SideBottom: Story = {
  args: {
    ...baseArgs,
    side: 'bottom',
    variant: 'default',
    triggerLabel: 'Excluir',
    ariaLabel: 'Excluir item',
    contentText: 'Excluir item',
  },
  parameters: COBRE_LADOS,
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /excluir/i });

    await step('O balão nasce abaixo do gatilho', async () => {
      await waitFor(async () => {
        await expect(sideOf(balaoDe(trigger))).toBeTruthy();
      });
      await expect(sideOf(balaoDe(trigger))).toBe('bottom');
      await expect(balaoDe(trigger)!.textContent).toContain('Excluir item');
    });
  },
};

export const SideLeft: Story = {
  args: {
    ...baseArgs,
    side: 'left',
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'À esquerda',
  },
  parameters: COBRE_LADOS,
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O balão nasce à esquerda do gatilho', async () => {
      await waitFor(async () => {
        await expect(sideOf(balaoDe(trigger))).toBeTruthy();
      });
      await expect(sideOf(balaoDe(trigger))).toBe('left');
      await expect(balaoDe(trigger)!.textContent).toContain('À esquerda');
    });
  },
};

export const SideRight: Story = {
  args: {
    ...baseArgs,
    side: 'right',
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'À direita',
  },
  parameters: COBRE_LADOS,
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /salvar/i });

    await step('O balão nasce à direita do gatilho', async () => {
      await waitFor(async () => {
        await expect(sideOf(balaoDe(trigger))).toBeTruthy();
      });
      await expect(sideOf(balaoDe(trigger))).toBe('right');
      await expect(balaoDe(trigger)!.textContent).toContain('À direita');
    });
  },
};

export const ActionDescription: Story = {
  name: 'Short action description',
  args: {
    ...baseArgs,
    side: 'top',
    variant: 'default',
    triggerLabel: 'Compartilhar',
    ariaLabel: 'Compartilhar link',
    contentText: 'Compartilhar link',
  },
  play: async ({ canvasElement, step }) => {
    const trigger = within(canvasElement).getByRole('button', { name: /compartilhar/i });

    await step('O botão já tem nome; o balão só descreve a ação', async () => {
      await expect(trigger).toHaveAttribute('aria-label', 'Compartilhar link');
      await waitFor(async () => {
        await expect(balaoDe(trigger)).not.toBeNull();
      });
      await expect(balaoDe(trigger)!.textContent).toContain('Compartilhar link');
    });
  },
};
