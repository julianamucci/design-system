import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import {
  createMenubar,
  type MenubarAlign,
  type MenubarCloseReason,
  type MenubarSide,
} from './menubar';
import { embrulhar, triggersOf, panelOpen, waitForPanel } from './menubar.fixtures';
import { menubarSource } from './menubar.source';
import { createMenubarDocs } from '@/components/docs/MenubarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { pressTab } from '@/lib/press-tab';
import { waitForAnimationsDone } from '@/lib/wait-for-portal';
import { createButton } from './button';
import { expectOndeDiz, waitForAncorado } from '@shared/testing/ancoragem';

// ─── Dados da barra ───────────────────────────────────────────────────────────
//
// A barra nasce de uma lista, e não de markup repetido quatro vezes: as
// asserções contam a partir DELA, então acrescentar um menu não deixa um número
// cravado para trás no teste.

const MENUS = [
  {
    label: 'Arquivo',
    items: [
      { label: 'Novo', shortcut: 'Ctrl+N' },
      { label: 'Abrir', shortcut: 'Ctrl+O' },
      { label: 'Salvar', shortcut: 'Ctrl+S' },
    ],
  },
  {
    label: 'Editar',
    items: [
      { label: 'Desfazer', shortcut: 'Ctrl+Z' },
      { label: 'Refazer', shortcut: 'Ctrl+Shift+Z' },
      { label: 'Copiar', shortcut: 'Ctrl+C' },
    ],
  },
  {
    label: 'Exibir',
    items: [{ label: 'Aproximar' }, { label: 'Afastar' }, { label: 'Tela cheia' }],
  },
  {
    label: 'Ajuda',
    items: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
  },
] as const;

/**
 * Borda ESQUERDA da caixa de TEXTO do elemento, em coordenada de viewport.
 *
 * `getBoundingClientRect()` do elemento devolveria a caixa com o `padding`
 * dentro, e o contrato de alinhamento do painel da barra é sobre o texto: o
 * gatilho tem `padding-inline: var(--spacing-3)` e o item do painel tem
 * `var(--spacing-2)` mais a borda e o `padding` do próprio painel. Medir caixa
 * contra caixa aceitaria qualquer recuo.
 *
 * Um `Range` sobre o conteúdo resolve os dois formatos de uma vez — o rótulo do
 * item é um `<span>`, o do gatilho é nó de texto solto no `<button>` — e é
 * leitura PURA: não escreve no DOM, então pode entrar numa espera sem o risco
 * do `waitFor` que se reagenda sozinho.
 */
function textLeft(el: HTMLElement): number {
  const range = el.ownerDocument.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().left;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

type MenubarArgs = {
  loop: boolean;
  defaultOpen: boolean;
  side: MenubarSide;
  align: MenubarAlign;
  onSelect: (label: string) => void;
  onOpenChange: (open: boolean) => void;
  onClose: (reason: MenubarCloseReason) => void;
};

const meta: Meta<MenubarArgs> = {
  title: 'Components/Navigation/Menubar',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createMenubarDocs), source: { transform: menubarSource } },
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
    // Por menu na fábrica (`MenubarMenu.onOpenChange`/`onClose`); aqui o mesmo
    // espião vai nos quatro menus, porque o que a play mede é o MOTIVO, e ele
    // é o mesmo vocabulário em qualquer menu da barra.
    onOpenChange: {
      control: false,
      description: 'Callback de cada menu ao abrir e ao fechar.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
    onClose: {
      control: false,
      description:
        'Callback do fechamento de cada menu, com o motivo: escape, overlay (clique fora, Tab, gatilho aberto ou menu vizinho) ou api (item escolhido).',
      table: { type: { summary: "(reason: 'escape' | 'overlay' | 'api') => void" } },
    },
  },
  args: {
    loop: true,
    defaultOpen: false,
    side: 'bottom',
    align: 'start',
    onSelect: fn(),
    onOpenChange: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<MenubarArgs>;

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
      'functional.item10',
      'functional.item11',
      'functional.item12',
      'functional.item14',
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
        items: m.items.map((i) => ({
          label: i.label,
          shortcut: 'shortcut' in i ? i.shortcut : undefined,
          onClick: () => args.onSelect(i.label),
        })),
        onOpenChange: args.onOpenChange,
        onClose: args.onClose,
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = triggersOf(barra);
    const [file, editar] = triggers;

    await step('A barra é um menubar, e cada gatilho anuncia o menu que abre', async () => {
      await expect(triggers).toHaveLength(MENUS.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS[i].label);
        await expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      }
    });

    await step('A barra inteira é UMA parada de tabulação', async () => {
      // Zera o foco para o Tab partir sempre do mesmo ponto: o replay do painel
      // Interactions roda a play de novo, com o foco onde a rodada anterior o
      // deixou, e sem isto a asserção mediria a segunda volta.
      (document.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();

      await expect(document.activeElement).toBe(file);
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
    });

    await step('Enter no gatilho abre o menu com foco no primeiro item', async () => {
      // Idempotente: só digita com o menu fechado, então o replay parte do
      // mesmo estado da primeira rodada.
      if (file.getAttribute('aria-expanded') !== 'true') {
        file.focus();
        await userEvent.keyboard('{Enter}');
      }
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
      });

      const panel = panelOpen(canvasElement)!;
      await expect(panel.getAttribute('role')).toBe('menu');
      const items = within(panel).getAllByRole('menuitem');
      await expect(items).toHaveLength(MENUS[0].items.length);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
      // O menu avisa que abriu — é o que alimenta o `menubar_open`.
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    });

    await step('E o painel ENTRA animado, como nas outras quatro stacks', async () => {
      // A folha compartilhada anima a entrada sob `[data-open]` /
      // `[data-state="open"]` (D5), e esta fábrica não escrevia nenhum dos
      // dois no PAINEL — só no gatilho. O painel de topo daqui é o caso
      // especial da família: ele não é remontado a cada abertura, vive
      // escondido entre uma e outra, então o valor TROCA (`closed` → `open`) e
      // é a troca que reinicia o keyframe.
      const panel = panelOpen(canvasElement)!;
      await expect(panel.dataset.state).toBe('open');
      // Sob movimento reduzido a camada de token zera a escada inteira e a
      // guarda da folha desliga esta animação — ali o esperado é `none`.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      await expect(getComputedStyle(panel).animationName).toBe(
        reduced ? 'none' : 'nds-menu-in',
      );
    });

    await step('E o painel está ANCORADO no lado que publicou', async () => {
      // O painel de TOPO desta stack é o caso especial da família: ele não vai a
      // portal, fica aninhado no wrapper do gatilho e a posição sai da folha —
      // `.nds-menubar-panel[data-side="bottom"]` com `top: 100%` mais
      // `margin-top: var(--spacing-2)`, ou seja os mesmos 8px que as outras quatro
      // declaram em `sideOffset`. Era 4 aqui e 8 nas quatro, e o vão é valor de
      // design system, não API de framework. Por ser
      // aninhado, é também o único dos três aqui em que a checagem de caixa do
      // invólucro tem o que medir.
      const panel = panelOpen(canvasElement)!;
      await waitForAncorado(panel);
      // A entrada anima `translateY`, e ele entra no `getBoundingClientRect`:
      // sem esperar o fim, a folga medida foi 4,9 contra os 8 que a folha
      // declara — o quadro do meio da animação, não a posição de repouso.
      await waitForAnimationsDone(panel);
      expectOndeDiz(file, panel, 8);
    });

    await step('Dentro do menu, a seta vertical anda entre os itens', async () => {
      const panel = panelOpen(canvasElement)!;
      const items = within(panel).getAllByRole('menuitem');

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
      const panel = panelOpen(canvasElement)!;
      const items = within(panel).getAllByRole('menuitem');
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
        await expect(file.getAttribute('aria-expanded')).toBe('false');
      });

      file.focus();
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
      });
    });

    await step('Home e End saltam para as pontas da lista', async () => {
      const panel = panelOpen(canvasElement)!;
      const items = within(panel).getAllByRole('menuitem');

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
        await expect(editar.getAttribute('aria-expanded')).toBe('true');
        await expect(document.activeElement).toBe(editar);
      });
      await expect(file.getAttribute('aria-expanded')).toBe('false');
      // Passar ao vizinho é sair do menu anterior sem decidir.
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');

      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
        await expect(document.activeElement).toBe(file);
      });
      await expect(editar.getAttribute('aria-expanded')).toBe('false');
    });

    await step('Escape fecha o menu e devolve o foco ao gatilho', async () => {
      // Precondição própria: reabre pelo gatilho de Arquivo em vez de herdar
      // o que o passo das setas deixou. Qual gatilho fica com o realce depois
      // de uma troca de menu é decisão de cada lib — herdar isso faria este
      // passo medir a lib, e não a devolução do foco que o contrato promete.
      if (file.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(file);
      }
      file.focus();
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('false');
      });
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await expect(document.activeElement).toBe(file);
      await expect(args.onClose).toHaveBeenLastCalledWith('escape');
    });

    await step('Clicar no gatilho de um menu aberto fecha o menu', async () => {
      if (file.getAttribute('aria-expanded') !== 'true') await userEvent.click(file);
      await waitFor(async () => {
        await expect(panelOpen(canvasElement)).not.toBeNull();
      });

      await userEvent.click(file);
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('false');
        await expect(panelOpen(canvasElement)).toBeNull();
      });
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    await step('Enter e Espaço no gatilho de um menu JÁ ABERTO fecham, com overlay', async () => {
      // D18, decisão da dona sobre medição: o gesto é o mesmo que fecha um menu
      // aberto em qualquer sistema operacional, e react, vue e angular já o
      // cumpriam. Aqui a tecla chamava `openMenu`, que sai cedo com o menu já
      // aberto — o menu não fechava e ninguém era avisado.
      //
      // A precondição é CONFERIDA antes da tecla, e não suposta: sem o foco no
      // gatilho a tecla nem chega a ele, e a asserção mediria outro caminho.
      if (file.getAttribute('aria-expanded') !== 'true') await userEvent.click(file);
      file.focus();
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
        await expect(document.activeElement).toBe(file);
      });

      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('false');
        await expect(panelOpen(canvasElement)).toBeNull();
      });
      // Sair sem decidir — o mesmo motivo do clique no gatilho aberto.
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');

      // E o Espaço faz o mesmo. O contrato diz "Enter/Espaço", e afirmar só um
      // conta meia verdade como verdade inteira. O primeiro Espaço reabre — o
      // foco continua no gatilho —, e o segundo fecha.
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('true');
      });
      file.focus();
      await userEvent.keyboard(' ');
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('false');
        await expect(panelOpen(canvasElement)).toBeNull();
      });
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    await step('Clicar fora da barra fecha o menu sem executar item nenhum', async () => {
      if (file.getAttribute('aria-expanded') !== 'true') await userEvent.click(file);
      await waitFor(async () => {
        await expect(panelOpen(canvasElement)).not.toBeNull();
      });
      const selectsBefore = (args.onSelect as unknown as ReturnType<typeof fn>).mock.calls.length;

      // Despacho direto no `<body>`, fora da barra: é o ouvinte de clique fora
      // do documento que fecha, e ele não depende de onde o ponteiro está.
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
      await waitFor(async () => {
        await expect(file.getAttribute('aria-expanded')).toBe('false');
        await expect(panelOpen(canvasElement)).toBeNull();
      });
      // Nenhum item rodou: o clique fora é sair sem decidir.
      await expect(args.onSelect).toHaveBeenCalledTimes(selectsBefore);
      await expect(args.onClose).toHaveBeenLastCalledWith('overlay');
    });

    await step('E o TEXTO do primeiro item alinha com o TEXTO do gatilho da barra', async () => {
      // O par da asserção de ancoragem lá em cima. Aquela cobra o eixo do LADO
      // (o vão de 8px, `expectOndeDiz`); esta cobra o eixo CRUZADO — o que as
      // outras quatro stacks chamam de `alignOffset` e esta resolve por folha
      // (`.nds-menubar-panel[data-side="bottom"][data-align="start"]`, em
      // `menubar.css`). As duas moram na Playground, uma ao lado da outra no
      // assunto ainda que não na linha: é aqui que a barra tem quatro menus.
      //
      // O SEGUNDO menu, e não o primeiro. Nas stacks que posicionam por medida
      // o painel do PRIMEIRO gatilho nasce encostado na borda esquerda da
      // janela e a conta TRAVA em `left: 5px` — ali `0`, `-4`, `-5` e até `-40`
      // leem idêntico, e foi por isso que o erro sobreviveu: nenhuma story
      // recuava a barra. Mudar o exemplo criaria divergência de exemplo entre
      // as cinco; abrir um gatilho que já nasce longe da borda, não.
      //
      // TEXTO contra TEXTO, e não caixa contra caixa: o contrato é sobre o que
      // a pessoa vê alinhado. A caixa do painel encosta na caixa do gatilho e
      // passaria com qualquer recuo — quem paga a diferença é a soma
      // borda(1) + padding do painel(4) + padding do item(8) contra o
      // padding do gatilho(12).
      //
      // Tolerância 0,75 e não 1: os dois candidatos do eixo ficam a exatamente
      // 1px um do outro, e com 1 a asserção não os separaria — mesma razão da
      // D15 no submenu. A espera é o fim das animações e leitura DIRETA, nunca
      // um `waitFor` em volta da medida: a entrada anima `translateY` e
      // `scale(0.98)` (D5), e medir no quadro zero já produziu 1,13px de deriva
      // nesta stack.
      const segundo = triggers[1];
      await expect(segundo).toHaveAccessibleName(MENUS[1].label);
      if (segundo.getAttribute('aria-expanded') !== 'true') await userEvent.click(segundo);
      const panel = await waitForPanel(canvasElement);
      await waitForAncorado(panel);
      await waitForAnimationsDone(panel);

      const primeiro = within(panel).getAllByRole('menuitem')[0];
      // O rótulo do item mora num `<span>` próprio; o do gatilho é nó de texto
      // solto no `<button>`. Um `Range` sobre o conteúdo mede a CAIXA DO TEXTO
      // nos dois casos, que é o que a caixa do elemento não dá no gatilho — ele
      // tem `padding-inline`, ela não começa onde a letra começa.
      const rotulo = primeiro.querySelector('span');
      await expect(rotulo, 'o item perdeu o span de rótulo').not.toBeNull();
      const delta = textLeft(rotulo!) - textLeft(segundo);
      await expect(
        Math.abs(delta),
        `texto do 1º item − texto do gatilho = ${delta.toFixed(2)} (esperado 0) · ` +
          'o recuo do painel é `left` em ' +
          'docs/shared/styles/nds/menubar.css, na regra [data-align="start"]: ' +
          '0 mede +1,00 · -1px mede 0,00 · -4px mede -3,00 (medido em 2026-09-19)',
      ).toBeLessThanOrEqual(0.75);

      // Fecha: a play termina com a barra em repouso, como terminava antes.
      await userEvent.click(segundo);
      await waitFor(async () => {
        await expect(panelOpen(canvasElement)).toBeNull();
      });
    });
  },
};

// ─── Tab sai da barra ─────────────────────────────────────────────────────────

/**
 * Cena do Tab: um botão antes e, opcionalmente, um depois da BARRA. O menu
 * Arquivo traz um submenu, porque o Tab dentro do painel filho — que vive em
 * portal no `body` — é um dos casos do contrato.
 */
function buildTabScene(withAfter: boolean): HTMLElement {
  const bar = createMenubar([
    {
      label: 'Arquivo',
      items: [
        { label: 'Novo' },
        { label: 'Abrir' },
        { type: 'submenu', label: 'Exportar', items: [{ label: 'PDF' }, { label: 'Imagem' }] },
      ],
    },
    { label: 'Editar', items: [{ label: 'Desfazer' }, { label: 'Refazer' }] },
  ]);

  const row = document.createElement('div');
  row.className = 'nds-cluster';
  row.dataset.spacing = 'md';
  row.append(createButton({ variant: 'ghost', label: 'Antes' }), bar);
  if (withAfter) row.append(createButton({ variant: 'ghost', label: 'Depois' }));
  return embrulhar(row, '260px');
}

/**
 * Menu não prende o foco (C2 do PRD do DropdownMenu, e o menubar da WAI-ARIA
 * APG): com um menu aberto, Tab fecha a barra e o foco sai dela. A barra é UMA
 * parada, então o destino é contado a partir dela, e não do gatilho.
 *
 * O Tab é despachado à mão (`@/lib/press-tab`): evento sintético não tem ação
 * padrão, então o foco só chega ao vizinho se a BARRA o levar. Antes da
 * correção nada escutava o Tab aqui: o menu ficava aberto com o foco fora dele.
 */
export const TabLeavesMenubar: Story = {
  parameters: { covers: ['functional.item13'], controls: { disable: true } },
  render: () => buildTabScene(true),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('menubar');
    const [fileTrigger, editTrigger] = triggersOf(bar);
    const before = canvas.getByRole('button', { name: 'Antes' });
    const after = canvas.getByRole('button', { name: 'Depois' });
    const openMenus = () => document.querySelectorAll('[role="menu"]:not([hidden])');

    const openWithItemFocused = async () => {
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
      const panel = await waitForPanel(canvasElement);
      within(panel).getAllByRole('menuitem')[0].focus();
      await expect(panel.contains(document.activeElement)).toBe(true);
      return panel;
    };

    await step('Tab fecha o menu e o foco vai ao ponto DEPOIS da barra', async () => {
      await openWithItemFocused();
      pressTab();
      // Síncrono de propósito: fechar e mover o foco são o mesmo gesto.
      await expect(openMenus()).toHaveLength(0);
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(after);
      // A barra continua sendo uma parada só, e é o gatilho do menu que estava
      // aberto que a representa — é por ele que o Shift+Tab volta.
      await expect(triggersOf(bar).filter((g) => g.tabIndex === 0)).toHaveLength(1);
      await expect(fileTrigger.tabIndex).toBe(0);
    });

    await step('Shift+Tab fecha o menu e o foco vai ao ponto ANTES da barra', async () => {
      await openWithItemFocused();
      pressTab(true);
      await expect(openMenus()).toHaveLength(0);
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      // Não o gatilho da própria barra, que é onde o Tab do navegador parava.
      await expect(document.activeElement).toBe(before);
    });

    await step('Com o foco no gatilho e o menu aberto, Tab também sai da barra', async () => {
      // A seta horizontal troca o menu aberto e deixa o foco no GATILHO vizinho,
      // com o painel dele aberto. O Tab dali também fecha — sem isto o foco saía
      // e o menu ficava na tela.
      await openWithItemFocused();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(editTrigger));
      await expect(editTrigger.getAttribute('aria-expanded')).toBe('true');

      pressTab();
      await expect(openMenus()).toHaveLength(0);
      await expect(editTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(after);
    });

    /** Abre o menu, entra no submenu e devolve o painel filho já com o foco. */
    const openSubmenuWithItemFocused = async (): Promise<HTMLElement> => {
      const panel = await openWithItemFocused();
      within(panel).getByRole('menuitem', { name: 'Exportar' }).focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(openMenus()).toHaveLength(2));
      const sub = document.querySelector<HTMLElement>('[data-slot="menubar-sub-content"]')!;
      await waitFor(() => expect(sub.contains(document.activeElement)).toBe(true));
      return sub;
    };

    await step('Tab dentro do submenu fecha a barra INTEIRA e sai dela', async () => {
      const sub = await openSubmenuWithItemFocused();

      pressTab();
      // O painel filho vive no `body`, e o Tab dele nunca subia até a barra: os
      // dois painéis ficavam abertos e o foco saía pelo fim do documento.
      await expect(openMenus()).toHaveLength(0);
      await expect(sub.isConnected).toBe(false);
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(after);
    });

    await step('Shift+Tab dentro do submenu também fecha tudo, e volta ao vizinho ANTERIOR', async () => {
      // O C2 promete as DUAS direções "também de dentro do submenu", e só a ida
      // era afirmada aqui. A volta tem um modo de falhar próprio: o painel
      // filho vive em portal no fim do `<body>`, então um Shift+Tab devolvido
      // ao navegador cairia no último focável da PÁGINA — e a barra é UMA
      // parada, de onde a conta do destino sai.
      const sub = await openSubmenuWithItemFocused();

      pressTab(true);
      await expect(openMenus()).toHaveLength(0);
      await expect(sub.isConnected).toBe(false);
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(before);
    });
  },
};

/**
 * A barra como ÚLTIMA parada da página: não há vizinho depois dela. O Tab fecha
 * do mesmo jeito — preso, ele seria a armadilha que C2 proíbe —, e o foco volta
 * ao gatilho do menu que estava aberto, em vez de sair do documento.
 */
export const TabAtPageEnd: Story = {
  parameters: { covers: ['functional.item13'], controls: { disable: true } },
  render: () => buildTabScene(false),
  play: async ({ canvasElement, step }) => {
    const bar = within(canvasElement).getByRole('menubar');
    const [fileTrigger] = triggersOf(bar);

    await step('Sem próxima parada, Tab ainda fecha o menu e o foco volta ao gatilho', async () => {
      if (fileTrigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(fileTrigger);
      const panel = await waitForPanel(canvasElement);
      within(panel).getAllByRole('menuitem')[0].focus();

      pressTab();
      await expect(panelOpen(canvasElement)).toBeNull();
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(fileTrigger);
    });
  },
};
