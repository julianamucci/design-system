import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createMenubar, type MenubarAlign, type MenubarSide } from './menubar';
import { createMenubarDocs } from '@/components/docs/MenubarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Dados da barra ───────────────────────────────────────────────────────────
//
// A barra nasce de uma lista, e não de markup repetido quatro vezes: as
// asserções contam a partir DELA, então acrescentar um menu não deixa um número
// cravado para trás no teste.

const MENUS = [
  {
    label: 'Arquivo',
    itens: [
      { label: 'Novo', shortcut: '⌘N' },
      { label: 'Abrir', shortcut: '⌘O' },
      { label: 'Salvar', shortcut: '⌘S' },
    ],
  },
  {
    label: 'Editar',
    itens: [
      { label: 'Desfazer', shortcut: '⌘Z' },
      { label: 'Refazer', shortcut: '⇧⌘Z' },
      { label: 'Copiar', shortcut: '⌘C' },
    ],
  },
  {
    label: 'Exibir',
    itens: [{ label: 'Aproximar' }, { label: 'Afastar' }, { label: 'Tela cheia' }],
  },
  {
    label: 'Ajuda',
    itens: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
  },
] as const;

// ─── Meta ─────────────────────────────────────────────────────────────────────

type MenubarArgs = {
  loop: boolean;
  defaultOpen: boolean;
  side: MenubarSide;
  align: MenubarAlign;
  onSelect: (label: string) => void;
};

const meta: Meta<MenubarArgs> = {
  title: 'UI/Menubar',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createMenubarDocs) },
  },
  argTypes: {
    loop: {
      control: 'boolean',
      description: 'A seta dá a volta do último gatilho para o primeiro, e vice-versa.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o primeiro menu ao montar, sem roubar o foco da página.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do painel em relação ao gatilho.',
      table: {
        type: { summary: "'top' | 'bottom' | 'left' | 'right'" },
        defaultValue: { summary: "'bottom'" },
      },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do painel no eixo perpendicular ao lado.',
      table: {
        type: { summary: "'start' | 'center' | 'end'" },
        defaultValue: { summary: "'start'" },
      },
    },
    onSelect: { control: false, table: { disable: true } },
  },
  args: {
    loop: true,
    defaultOpen: false,
    side: 'bottom',
    align: 'start',
    onSelect: fn(),
  },
};

/** Só os gatilhos da barra: nesta stack o painel mora DENTRO da raiz, então
 *  procurar por papel na barra devolveria também os itens do menu aberto. */
function gatilhosDe(barra: HTMLElement): HTMLElement[] {
  return Array.from(barra.querySelectorAll<HTMLElement>('[data-slot="menubar-trigger"]'));
}

export default meta;
type Story = StoryObj<MenubarArgs>;

function embrulhar(filho: HTMLElement, alturaMinima = '280px'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = alturaMinima;
  wrapper.appendChild(filho);
  return wrapper;
}

/** O painel é ancorado por CSS, não portalizado: mora dentro do canvas. */
function painelAberto(canvasElement: HTMLElement): HTMLElement | null {
  return canvasElement.querySelector<HTMLElement>(
    '[data-slot="menubar-content"]:not([hidden])',
  );
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item6',
      'functional.item8',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
    ],
  },
  render: (args) => {
    const barra = createMenubar(
      MENUS.map((m) => ({
        label: m.label,
        items: m.itens.map((i) => ({
          label: i.label,
          shortcut: 'shortcut' in i ? i.shortcut : undefined,
          onClick: () => args.onSelect(i.label),
        })),
      })),
      {
        loop: args.loop,
        side: args.side,
        align: args.align,
        defaultOpen: args.defaultOpen ? 0 : undefined,
      },
    );
    return embrulhar(barra, '320px');
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const gatilhos = gatilhosDe(barra);
    const [arquivo, editar] = gatilhos;

    await step('A barra é um menubar, e cada gatilho anuncia o menu que abre', async () => {
      await expect(gatilhos).toHaveLength(MENUS.length);
      for (const [i, gatilho] of gatilhos.entries()) {
        await expect(gatilho).toHaveAccessibleName(MENUS[i].label);
        await expect(gatilho.getAttribute('aria-haspopup')).toBe('menu');
      }
    });

    await step('A barra inteira é UMA parada de tabulação', async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      await expect(document.activeElement).toBe(arquivo);
      await expect(gatilhos.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        arquivo.focus();
        await userEvent.keyboard('{Enter}');
      }
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
      });

      const painel = painelAberto(canvasElement)!;
      await expect(painel.getAttribute('role')).toBe('menu');
      const itens = within(painel).getAllByRole('menuitem');
      await expect(itens).toHaveLength(MENUS[0].itens.length);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[0]);
      });
    });

    await step('Dentro do menu, a seta vertical anda entre os itens', async () => {
      const painel = painelAberto(canvasElement)!;
      const itens = within(painel).getAllByRole('menuitem');

      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[1]);
      });

      await userEvent.keyboard('{ArrowUp}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(itens[0]);
      });
    });

    await step('Com um menu aberto, a seta horizontal já abre o vizinho', async () => {
      // É o que separa um menubar de quatro botões vizinhos: a seta não só move
      // o foco, ela troca o menu aberto — o gesto de aplicação desktop.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(editar.getAttribute('aria-expanded')).toBe('true');
        await expect(document.activeElement).toBe(editar);
      });
      await expect(arquivo.getAttribute('aria-expanded')).toBe('false');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('true');
        await expect(document.activeElement).toBe(arquivo);
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (arquivo.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(arquivo);
      }
      arquivo.focus();
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
      });
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await expect(document.activeElement).toBe(arquivo);
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (arquivo.getAttribute('aria-expanded') !== 'true') await userEvent.click(arquivo);
      await waitFor(async () => {
        await expect(painelAberto(canvasElement)).not.toBeNull();
      });

      await userEvent.click(arquivo);
      await waitFor(async () => {
        await expect(arquivo.getAttribute('aria-expanded')).toBe('false');
        await expect(painelAberto(canvasElement)).toBeNull();
      });
    });
  },
};
