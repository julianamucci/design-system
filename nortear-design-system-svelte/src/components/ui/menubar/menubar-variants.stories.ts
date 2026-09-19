import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import MenubarStory from './MenubarStory.svelte';
import {
  menubarSource,
  menubarDefaultSource,
  menubarDestructiveSource,
} from './menubar.source';

// Itens de cada ficha em lista: as asserções contam a partir daqui, nunca de um
// número escrito à mão no play.
const ITEMS_NEUTROS = ['Novo', 'Abrir', 'Salvar'];
const ITEMS_WITH_PERIGO = ['Salvar', 'Descartar alterações'];

const meta: Meta = {
  title: 'Components/Navigation/Menubar/Variants',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: menubarSource },
      description: {
        component:
          'As duas ênfases de item dentro de um menu da barra. `default` é o item neutro; `destructive` marca a ação irreversível com a cor de perigo, e existe para que "Descartar alterações" não pareça "Salvar".',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { defaultValue: 'file', variant: 'default', demonstration: 'default' },
  parameters: {
    covers: ['accessibility.item7'],
    docs: { source: { transform: menubarDefaultSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      await expect(items).toHaveLength(ITEMS_NEUTROS.length);
      for (const item of items) {
        await expect(item.getAttribute('data-variant')).toBe('default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do painel, sem cor semântica', async () => {
      // O item destacado troca de cor de propósito — a comparação tem que ser
      // com um item em repouso, senão ela mede o realce e não a variante.
      const inRest = items.filter((i) => !i.hasAttribute('data-highlighted'));
      await expect(inRest.length).toBeGreaterThan(0);
      await expect(getComputedStyle(inRest[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step('O painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do item e o fundo do
      // painel só significa alguma coisa se o fundo for opaco: sobre um painel
      // translúcido a razão medida é a do que estiver por baixo.
      const background = getComputedStyle(menu).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background.startsWith('rgba(')).toBe(false);
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  args: { defaultValue: 'file', demonstration: 'destructive' },
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: menubarDestructiveSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const neutro = canvas.getByRole('menuitem', { name: ITEMS_WITH_PERIGO[0] });
    const perigoso = canvas.getByRole('menuitem', { name: ITEMS_WITH_PERIGO[1] });

    await step('A variante chega ao markup', async () => {
      await expect(perigoso.getAttribute('data-variant')).toBe('destructive');
      await expect(perigoso.getAttribute('data-slot')).toBe('menubar-item');
    });

    await step('A divisória se anuncia como DIVISÓRIA, e não como grupo', async () => {
      // O `MenuSeparatorState` do bits crava `role="group"` no separador e
      // mescla os próprios atributos por último, então passar `role` por fora é
      // ignorado em silêncio — um `role="group"` vazio dentro de `role="menu"` é
      // anunciado como um grupo sem nada dentro, e a divisória perde a semântica.
      // Medido em navegador em 2026-09-18: este era o ÚNICO dos quinze
      // separadores da família saindo como `group`, e sem `aria-orientation`.
      // O wrapper passou a renderizar pelo snippet `child`, que devolve a última
      // palavra ao nosso markup — como o Vanilla, que é a referência, e como os
      // outros dois membros desta stack já faziam.
      const separatorEl = menu.querySelector<HTMLElement>('[data-slot="menubar-separator"]')!;
      await expect(separatorEl).not.toBeNull();
      await expect(separatorEl.getAttribute('role')).toBe('separator');
      await expect(separatorEl.getAttribute('aria-orientation')).toBe('horizontal');
      await expect(separatorEl.classList.contains('nds-dropdown-menu-separator')).toBe(true);
      // E o painel não ganha um grupo de brinde: com o papel errado, esta
      // contagem dava 1 em vez de 0.
      await expect(within(menu).queryAllByRole('group')).toHaveLength(0);
      await expect(within(menu).getAllByRole('separator')).toHaveLength(1);
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
