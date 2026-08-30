import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR } from './menubar';
import { waitForPortal, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// Itens de cada ficha em lista: as asserções contam a partir daqui, nunca de um
// número escrito à mão no play.
const ITEMS_NEUTROS = ['Novo', 'Abrir', 'Salvar'] as const;
const ITEMS_WITH_PERIGO = ['Salvar', 'Descartar alterações'] as const;

const meta: Meta = {
  title: 'Primitives/Navigation/Menubar/Variants',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
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

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: { covers: ['accessibility.item7'] },
  render: () => ({
    props: { items: ITEMS_NEUTROS },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>

          <ng-template ndsMenubarContent>
            @for (i of items; track i) {
              <div ndsMenubarItem>{{ i }}</div>
            }
          </ng-template>
        </nds-menubar-menu>

        <nds-menubar-menu>
          <button ndsMenubarTrigger>Editar</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Desfazer</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('A variante default é escrita no markup', async () => {
      // Afirmar o atributo resultante é o que impede o defeito silencioso do
      // fallback JIT: sob JIT os `input()` não são vistos e o componente
      // renderiza com os valores padrão, sem erro nenhum na tela.
      await expect(items).toHaveLength(ITEMS_NEUTROS.length);
      for (const item of items) {
        await expect(item.getAttribute('data-variant')).toBe('default');
        await expect(item.classList.contains('nds-dropdown-menu-item')).toBe(true);
      }
    });

    await step('O item neutro herda a cor do popup, sem cor semântica', async () => {
      // O item destacado (o primeiro, que recebe o foco ao abrir) troca de cor
      // de propósito — a comparação tem que ser com um item em repouso, senão
      // ela mede o realce e não a variante.
      const inRest = items.filter((i) => !i.hasAttribute('data-highlighted'));
      await expect(inRest.length).toBeGreaterThan(0);
      await expect(getComputedStyle(inRest[0]).color).toBe(getComputedStyle(menu).color);
    });

    await step('O popup é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do item e o fundo do
      // popup só significa alguma coisa se o fundo for opaco: sobre um painel
      // translúcido a razão medida é a do que estiver por baixo.
      const background = getComputedStyle(menu).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background).not.toBe('transparent');
      await expect(background.startsWith('rgba(')).toBe(false);
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>

          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>${ITEMS_WITH_PERIGO[0]}</div>
            <div ndsMenubarSeparator></div>
            <div ndsMenubarItem variant="destructive">${ITEMS_WITH_PERIGO[1]}</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
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
      // O ponteiro é o que realça: o primitivo marca `data-highlighted` no
      // `pointermove`, e é esse atributo (não `:hover`) que o CSS usa.
      const antes = getComputedStyle(perigoso).backgroundColor;
      await userEvent.hover(perigoso);
      await waitFor(async () => {
        await expect(perigoso.hasAttribute('data-highlighted')).toBe(true);
        await expect(getComputedStyle(perigoso).backgroundColor).not.toBe(antes);
      });
    });
  },
};
