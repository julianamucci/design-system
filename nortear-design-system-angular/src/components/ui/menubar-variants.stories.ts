import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR } from './menubar';
import { menubarDefaultSource, menubarDestructiveSource } from './menubar.source';
import { waitForPortal, FOCUS_RULE_GUARDA, axeRules } from '@/lib/wait-for-portal';
import { backgroundEffective, byTheme, noTransicao, ratio } from '@shared/testing/cor';

// Itens de cada ficha em lista: as asserções contam a partir daqui, nunca de um
// número escrito à mão no play.
const ITEMS_NEUTROS = ['Novo', 'Abrir', 'Salvar'] as const;
const ITEMS_WITH_PERIGO = ['Salvar', 'Descartar alterações'] as const;

const meta: Meta = {
  title: 'Components/Navigation/Menubar/Variants',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    // Sem `args` próprios: sem isto a aba Actions lista espião que estas stories
    // não usam, do mesmo jeito que o Controls abriria vazio.
    actions: { disable: true },
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
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
  parameters: {
    covers: ['accessibility.item7'],
    // Sem transform o painel Code publicaria o `@for` sobre a lista da story,
    // o `[defaultOpen]="true"` e o `[modal]="false"` que só existem para o
    // painel caber no quadro.
    docs: { source: { transform: menubarDefaultSource } },
  },
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
      // Pré-condição da medida de baixo: sobre um painel translúcido a razão
      // medida seria a do que estiver por baixo dele.
      const background = getComputedStyle(menu).backgroundColor;
      await expect(background).not.toBe('rgba(0, 0, 0, 0)');
      await expect(background).not.toBe('transparent');
      await expect(background.startsWith('rgba(')).toBe(false);
    });

    await step('O texto do item em repouso passa de 4.5:1 sobre o painel, nos três temas e nos dois modos', async () => {
      // `accessibility.item7` é CONTRASTE, e até 2026-09-11 a story afirmava só
      // a opacidade do painel — que é pré-condição, não medida. Aqui a razão é
      // medida pelo colhedor de cor computada (`@shared/testing/cor`): o texto
      // do item contra o primeiro fundo opaco acima dele, com o tema e o modo
      // estampados no PAINEL — ele é portalado para o `<body>`, fora da raiz da
      // story, e é nele que os tokens precisam ser redeclarados. As transições
      // morrem antes, para não ler o primeiro quadro da troca de tema.
      const inRest = items.find((i) => !i.hasAttribute('data-highlighted'));
      await expect(inRest).toBeDefined();
      const item = inRest!;
      const measurements = noTransicao(menu, () =>
        noTransicao(item, () =>
          byTheme(menu, (theme, mode) => {
            const background = backgroundEffective(item);
            const contrast = background ? ratio(getComputedStyle(item).color, background) : null;
            return { theme, mode, contrast };
          }),
        ),
      );
      await expect(measurements).toHaveLength(6);
      const below = measurements
        .filter((m) => !m.contrast || m.contrast.ratio < 4.5)
        .map((m) =>
          m.contrast
            ? `${m.theme}/${m.mode}: ${m.contrast.frente} sobre ${m.contrast.background} = ${m.contrast.ratio}:1`
            : `${m.theme}/${m.mode}: sem fundo opaco para medir`,
        );
      await expect(below).toEqual([]);
    });
  },
};

// ─── Destructive ──────────────────────────────────────────────────────────────

export const Destructive: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: menubarDestructiveSource } },
  },
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

    await step('A divisória se anuncia como DIVISÓRIA, e não como grupo', async () => {
      // O papel do separador não é escrito pelo nosso markup: ele vem do
      // `RdxMenuSeparator`, que entra como `hostDirective` e crava `role`
      // estático mais `aria-orientation` ligado a `orientation()`. Atributo
      // estático no `<div>` da story perderia para esse host binding em
      // silêncio — então o que vale afirmar é o que CHEGA ao DOM.
      // Medido em navegador em 2026-09-18 nas cinco stacks: o separador do
      // Menubar do svelte era o ÚNICO dos quinze da família saindo como
      // `group`, porque lá o `MenuSeparatorState` do bits mescla o próprio
      // papel por último. Aqui sai `separator` — e sem asserção isso é
      // exatamente o que volta na próxima versão da lib.
      const separatorEl = menu.querySelector<HTMLElement>('[data-slot="menubar-separator"]');
      await expect(separatorEl).not.toBeNull();
      await expect(separatorEl!.getAttribute('role')).toBe('separator');
      await expect(separatorEl!.getAttribute('aria-orientation')).toBe('horizontal');
      await expect(separatorEl!.classList.contains('nds-dropdown-menu-separator')).toBe(true);
      // E o painel não ganha um grupo de brinde: com o papel errado, esta
      // contagem daria 1 em vez de 0 — é ela que pegou o defeito no svelte.
      await expect(canvas.queryAllByRole('group')).toHaveLength(0);
      await expect(canvas.getAllByRole('separator')).toHaveLength(1);
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
