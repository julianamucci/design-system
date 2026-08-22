import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';
import { embrulhar, waitForPanel } from './menubar.fixtures';
import { menubarSource, menubarSourceWith } from './menubar.source';

// Itens de cada ficha em lista: as asserções contam a partir daqui, nunca de um
// número escrito à mão no play.
const ITEMS_NEUTROS = ['Novo', 'Abrir', 'Salvar'] as const;
const ITEMS_WITH_PERIGO = ['Salvar', 'Descartar alterações'] as const;

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Menubar/Variants',
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: menubarSource },
      description: {
        component:
          'As duas ênfases de item dentro de um menu da barra. `default` é o item neutro; ' +
          '`destructive` marca a ação irreversível com a cor de perigo, e existe para que ' +
          '"Descartar alterações" não pareça "Salvar".',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// A altura da moldura vai explícita em cada chamada de `embrulhar`: aqui era um
// valor cravado no corpo da cópia local, e o padrão da fixture é outro.

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item7'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            { label: 'Arquivo', items: ITEMS_NEUTROS.map((i) => ({ label: i })) },
            { label: 'Editar', items: [{ label: 'Desfazer' }] },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar(
        [
          { label: 'Arquivo', items: ITEMS_NEUTROS.map((i) => ({ label: i })) },
          { label: 'Editar', items: [{ label: 'Desfazer' }] },
        ],
        { defaultOpen: 0 },
      ),
      '240px',
    ),
  play: async ({ canvasElement, step }) => {
    const painel = await waitForPanel(canvasElement);
    const itens = within(painel).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      await expect(itens).toHaveLength(ITEMS_NEUTROS.length);
      for (const item of itens) {
        await expect(item.getAttribute('data-variant')).toBe('default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do painel, sem cor semântica', async () => {
      await expect(getComputedStyle(itens[0]).color).toBe(getComputedStyle(painel).color);
    });

    await step('O painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do item e o fundo do
      // painel só significa alguma coisa se o fundo for opaco: sobre um painel
      // translúcido a razão medida é a do que estiver por baixo.
      const background = getComputedStyle(painel).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background.startsWith('rgba(')).toBe(false);
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  // A variante é o assunto: sem override o painel mostraria itens neutros
  // embaixo de um menu que pinta a ação irreversível.
  parameters: {
    covers: ['visual.item5'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Arquivo',
              items: [
                { label: ITEMS_WITH_PERIGO[0] },
                { type: 'separator' },
                { label: ITEMS_WITH_PERIGO[1], variant: 'destructive' },
              ],
            },
          ],
          defaultOpen: 0,
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar(
        [
          {
            label: 'Arquivo',
            items: [
              { label: ITEMS_WITH_PERIGO[0] },
              { type: 'separator' },
              { label: ITEMS_WITH_PERIGO[1], variant: 'destructive' },
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '240px',
    ),
  play: async ({ canvasElement, step }) => {
    const painel = await waitForPanel(canvasElement);
    const canvas = within(painel);
    const neutro = canvas.getByRole('menuitem', { name: ITEMS_WITH_PERIGO[0] });
    const perigoso = canvas.getByRole('menuitem', { name: ITEMS_WITH_PERIGO[1] });

    await step('A variante chega ao markup', async () => {
      await expect(perigoso.getAttribute('data-variant')).toBe('destructive');
      await expect(perigoso.getAttribute('data-slot')).toBe('menubar-item');
    });

    await step('A cor do texto distingue a ação irreversível', async () => {
      // O seletor do CSS é `[data-variant="destructive"]`: se o atributo não
      // chegasse, esta asserção pegaria a mesma cor do item neutro.
      await expect(getComputedStyle(perigoso).color).not.toBe(getComputedStyle(neutro).color);
    });

    await step('O destaque não depende só da cor: o realce pinta o fundo', async () => {
      // Critério 1.4.1 na prática — quem não distingue matiz precisa do fundo.
      // O realce vem pelo FOCO, e não pelo ponteiro: `:hover` depende da posição
      // real do mouse, que evento sintético não move — a asserção mediria sempre
      // o estado de repouso. O teclado é o caminho que o CSS desta stack desenha.
      const antes = getComputedStyle(perigoso).backgroundColor;
      perigoso.focus();
      await waitFor(async () => {
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });
  },
};
