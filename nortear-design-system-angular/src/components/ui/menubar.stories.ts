import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR, type MenubarItemVariant } from './menubar';
import { menubarPlaygroundSource, type MenubarArgs } from './menubar.source';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { NdsMenubarDocs } from '@/components/docs/MenubarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados da barra ───────────────────────────────────────────────────────────
//
// A barra do Playground nasce de uma lista, e não de markup repetido quatro
// vezes: as asserções contam a partir DELA (`MENUS.length`), então acrescentar
// um menu não deixa um número cravado para trás no teste.

type ItemDemo = { label: string; atalho?: string; variant?: MenubarItemVariant };
type MenuDemo = { label: string; items: ItemDemo[] };

const MENUS: MenuDemo[] = [
  {
    label: 'Arquivo',
    items: [
      { label: 'Novo', atalho: 'Ctrl+N' },
      { label: 'Abrir', atalho: 'Ctrl+O' },
      { label: 'Salvar', atalho: 'Ctrl+S' },
    ],
  },
  {
    label: 'Editar',
    items: [
      { label: 'Desfazer', atalho: 'Ctrl+Z' },
      { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
      { label: 'Copiar', atalho: 'Ctrl+C' },
    ],
  },
  {
    label: 'Exibir',
    items: [
      { label: 'Aproximar' },
      { label: 'Afastar' },
      { label: 'Tela cheia' },
    ],
  },
  {
    label: 'Ajuda',
    items: [
      { label: 'Documentação' },
      { label: 'Atalhos de teclado' },
    ],
  },
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<MenubarArgs> = {
  title: 'Components/Navigation/Menubar',
  tags: ['autodocs', 'navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: { page: withAutoDocsTab(NdsMenubarDocs) },
  },
  argTypes: {
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido de abertura do popup em relação ao gatilho.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do popup no eixo perpendicular ao lado.',
    },
    modal: {
      control: 'boolean',
      description: 'Bloqueia a interação com o resto da página enquanto um menu está aberto.',
    },
    loopFocus: {
      control: 'boolean',
      description: 'A seta dá a volta do último menu para o primeiro, e vice-versa.',
    },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(openChange)` ficaria ligado a nada, sem erro nenhum.
    onOpenChange: { control: false, table: { disable: true } },
  },
  args: {
    side: 'bottom',
    align: 'start',
    modal: true,
    loopFocus: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<MenubarArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: menubarPlaygroundSource } },
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item6',
      'functional.item8',
      'functional.item10',
      'functional.item11',
      'functional.item12',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => ({
    props: { ...args, menus: MENUS },
    template: `
      <nds-menubar [modal]="modal" [loopFocus]="loopFocus">
        @for (m of menus; track m.label) {
          <nds-menubar-menu (openChange)="onOpenChange($event)">
            <button ndsMenubarTrigger>{{ m.label }}</button>

            <ng-template ndsMenubarContent [side]="side" [align]="align">
              @for (i of m.items; track i.label) {
                <div ndsMenubarItem [variant]="i.variant ?? 'default'">
                  {{ i.label }}
                  @if (i.atalho) {
                    <span ndsMenubarShortcut>{{ i.atalho }}</span>
                  }
                </div>
              }
            </ng-template>
          </nds-menubar-menu>
        }
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');
    const [arquivo, editar] = triggers;

    await step('A barra é um menubar, e cada gatilho anuncia o menu que abre', async () => {
      await expect(triggers).toHaveLength(MENUS.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS[i].label);
        await expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
        await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      }
    });

    await step('A barra inteira é UMA parada de tabulação', async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      // Roving tabindex: um só gatilho é alcançável pelo Tab, e é o primeiro.
      // Sem isto, atravessar uma barra de seis menus custaria seis Tabs.
      await expect(document.activeElement).toBe(arquivo);
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Teclado, e não clique: o item do contrato fala de Enter/Space/Seta-baixo,
      // e um passo que clicava deixava a declaração sem verificação nenhuma.
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        arquivo.focus();
        await userEvent.keyboard('{Enter}');
      }

      const menu = await waitForPortal('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);

      const items = within(menu).getAllByRole('menuitem');
      await expect(items).toHaveLength(MENUS[0].items.length);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Dentro do menu, a seta vertical anda entre os itens', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[1]);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Digitar uma letra leva ao item que começa por ela', async () => {
      // `s` é inequívoco nesta lista (Novo, Abrir, Salvar) — busca por letra com
      // dois candidatos mediria a política de desempate, que é outro assunto.
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');
      const saveItem = items.find((i) => (i.textContent ?? '').trim().startsWith('Salvar'))!;
      await expect(saveItem).toBeDefined();

      await userEvent.keyboard('s');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(saveItem);
      });
    });

    await step('Space também abre o gatilho, e não só Enter', async () => {
      // O item do contrato diz "Enter/Space", e só o Enter era verificado —
      // meia verdade que o auditor de cobertura contava como verdade inteira.
      // Fecha ANTES de digitar: o passo estabelece a própria precondição, senão
      // o replay do painel Interactions parte do menu já aberto e o Space o
      // fecharia.
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      });

      arquivo.focus();
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });

      // O passo seguinte digita DENTRO do menu, então a precondição não é o
      // painel existir — é o foco já ter entrado nele. Sem esta espera, End era
      // digitado com o foco ainda no gatilho.
      const openedBySpace = await waitForPortal('menu');
      await waitFor(async () => {
        await expect(openedBySpace.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Home e End saltam para as pontas da lista', async () => {
      const menu = await waitForPortal('menu');
      const items = within(menu).getAllByRole('menuitem');

      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[items.length - 1]);
      });

      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
    });

    await step('Com um menu aberto, a seta horizontal já abre o vizinho', async () => {
      // É o que separa um menubar de quatro botões vizinhos: a seta não só move
      // o foco, ela troca o menu aberto — o gesto de aplicação desktop.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(editar);
        await expect(editar.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(arquivo);
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(arquivo);
      });
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (arquivo.getAttribute('aria-expanded') !== 'true') await userEvent.click(arquivo);
      await waitForPortal('menu');

      await userEvent.click(arquivo);
      await waitForPortalVanish('menu');
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
    });
  },
};
