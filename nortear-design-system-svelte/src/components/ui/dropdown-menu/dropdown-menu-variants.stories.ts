import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { itemContrast } from '@shared/testing/dropdown-menu-probe';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import {
  dropdownMenuDestructiveSource,
  dropdownMenuDefaultSource,
  dropdownMenuSource,
} from './dropdown-menu.source';

const meta: Meta = {
  title: 'UI/DropdownMenu/Variants',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'As duas ênfases de item. `default` é o item neutro; `destructive` marca a ação ' +
          'irreversível com a cor de perigo, e existe para que "Excluir conta" não pareça ' +
          '"Editar perfil". Renderizadas abertas para captura no Chromatic.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: { defaultOpen: true, variant: 'default', triggerLabel: 'Mais ações' },
  parameters: {
    covers: ['accessibility.item4', 'accessibility.item6'],
    docs: { source: { transform: dropdownMenuDefaultSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      await expect(items).toHaveLength(3);
      for (const item of items) {
        await expect(item).toHaveAttribute('data-variant', 'default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do popup, sem cor semântica', async () => {
      // O item destacado troca de cor de propósito — a comparação tem que ser
      // com um item em repouso, senão ela mede o realce e não a variante.
      const inRest = items.filter((i) => !i.hasAttribute('data-highlighted'));
      await expect(inRest.length).toBeGreaterThan(0);
      await expect(getComputedStyle(inRest[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step('O texto do item atinge 4.5:1 sobre o fundo do popup', async () => {
      // O item de contrato dizia "verificar por axe-core" — verificação que
      // ninguém rodava: o axe do test-runner mede o que está na tela, e comparar
      // nome de token não responde a pergunta. A razão é aritmética. 14px em
      // peso normal é texto normal pela WCAG: o limite é 4.5, não 3.
      const inRest = items.filter((i) => !i.hasAttribute('data-highlighted'));
      const measurement = itemContrast(inRest[0]);
      await expect(measurement).not.toBeNull();
      await expect(measurement!.ratio).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Destructive: Story = {
  args: { defaultOpen: true, variant: 'destructive', triggerLabel: 'Ações da conta' },
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: dropdownMenuDestructiveSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const neutro = canvas.getByRole('menuitem', { name: 'Editar' });
    const perigoso = canvas.getByRole('menuitem', { name: 'Excluir conta' });

    await step('A variante chega ao markup', async () => {
      await expect(perigoso).toHaveAttribute('data-variant', 'destructive');
    });

    await step('A cor do texto distingue a ação irreversível', async () => {
      // O seletor do CSS é `[data-variant="destructive"]`: se o atributo não
      // chegasse, esta asserção pegaria a mesma cor do item neutro.
      await expect(getComputedStyle(perigoso).color).not.toBe(getComputedStyle(neutro).color);
    });

    await step('O destaque não depende só da cor: o realce pinta o fundo', async () => {
      // Critério 1.4.1 na prática — quem não distingue matiz precisa do fundo.
      // O ponteiro é o que realça: o primitivo marca `data-highlighted`, e é
      // esse atributo (não `:hover`) que o CSS usa.
      const antes = getComputedStyle(perigoso).backgroundColor;
      await userEvent.hover(perigoso);
      await waitFor(async () => {
        await expect(perigoso.hasAttribute('data-highlighted')).toBe(true);
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });
  },
};
