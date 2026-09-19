import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';
import { embrulhar, waitForPanel, triggersOf } from './menubar.fixtures';
import { menubarSource, menubarSourceWith } from './menubar.source';
import { checkPanelFollowsTrigger } from './floating-follow-probe';
import { waitForAnimationsDone } from '@/lib/wait-for-portal';
import { waitForAncorado } from '@shared/testing/ancoragem';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const SHORTCUTS = [
  { label: 'Desfazer', shortcut: 'Ctrl+Z' },
  { label: 'Refazer', shortcut: 'Ctrl+Shift+Z' },
  { label: 'Copiar', shortcut: 'Ctrl+C' },
] as const;

const EXPORTACOES = ['PDF', 'CSV', 'PNG'] as const;

const EXIBICOES = [
  { label: 'Régua', checked: true },
  { label: 'Barra lateral', checked: false },
  { label: 'Grade', checked: false },
] as const;

const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Do sistema' },
] as const;

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Menubar/Compositions',
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: menubarSource },
      description: {
        component:
          'As composições canônicas de um menu da barra: atalhos visíveis, submenu, ' +
          'alternadores independentes, escolha única e a barra completa de um editor.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// A altura da moldura vai explícita em cada chamada de `embrulhar`: o padrão da
// fixture (260px) serve à barra comum, e cada composição aqui pede a sua.

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  parameters: {
    covers: ['functional.item16', 'visual.item2'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Editar',
              items: SHORTCUTS.map((a) => ({ label: a.label, shortcut: a.shortcut })),
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
        [{ label: 'Editar', items: SHORTCUTS.map((a) => ({ label: a.label, shortcut: a.shortcut })) }],
        { defaultOpen: 0 },
      ),
      '300px',
    ),
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPanel(canvasElement);
    const items = within(panel).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(items).toHaveLength(SHORTCUTS.length);
      const shortcuts = panel.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(shortcuts).toHaveLength(SHORTCUTS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, Ctrl+Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of items.entries()) {
        await expect(item).toHaveAccessibleName(`${SHORTCUTS[i].label} ${SHORTCUTS[i].shortcut}`);
      }
    });

    await step('O atalho é secundário — cor esmaecida à direita do rótulo', async () => {
      const atalho = panel.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      await expect(atalho.classList.contains('nds-dropdown-menu-shortcut')).toBe(true);
      await expect(getComputedStyle(atalho).color).not.toBe(getComputedStyle(items[0]).color);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // "À direita" era só o nome do passo acima, que media a COR. A posição se
      // afirma pela caixa: `margin-left: auto` já chega resolvido em pixels num
      // item flex, e o que dá para cobrar é o resultado — o vão entre o atalho e
      // a borda direita é menor que o vão entre ele e a borda esquerda.
      for (const item of items) {
        const atalho = item.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
        const itemBox = item.getBoundingClientRect();
        const shortcutBox = atalho.getBoundingClientRect();
        await expect(itemBox.right - shortcutBox.right).toBeLessThan(shortcutBox.left - itemBox.left);
      }
    });
  },
};

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  // O submenu é o assunto: o snippet do meta esconderia a sub-lista, que é a
  // única coisa que distingue esta composição de um menu comum.
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Arquivo',
              items: [
                { label: 'Novo' },
                {
                  type: 'submenu',
                  label: 'Exportar',
                  items: EXPORTACOES.map((e) => ({ label: e })),
                },
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
              { label: 'Novo' },
              {
                type: 'submenu',
                label: 'Exportar',
                items: EXPORTACOES.map((e) => ({ label: e })),
              },
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '340px',
    ),
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPanel(canvasElement);
    // O painel da barra nasce ABERTO (`defaultOpen: 0`) e ANIMA a entrada —
    // `translateY` e `scale(0.98)` (D5). O sub-gatilho mora dentro dele, então
    // enquanto a escada roda o item está até ~1px do lugar onde vai parar. Um
    // submenu aberto nesse intervalo é posicionado contra o item EM MOVIMENTO e
    // fica lá: `autoUpdateFloating` observa rolagem, redimensionamento e
    // mudança de TAMANHO, e `transform` não muda nenhum dos três. Medido em
    // 2026-09-19 ao escrever a asserção da D15: sem esta espera o primeiro item
    // do submenu nasce 1,13px acima do sub-gatilho, e a origem dessa diferença
    // não está no vão nenhum — está no quadro em que a medida foi tirada.
    await waitForAnimationsDone(panel);
    const subTrigger = within(panel).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-triggerBox anuncia que abre outro menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('data-slot')).toBe('menubar-sub-trigger');
    });

    const visibleMenus = () => within(document.body).queryAllByRole('menu');

    await step('Seta Baixo alcança o sub-triggerBox; Seta Direita abre o submenu e o foco ENTRA nele', async () => {
      // Precondição própria: o replay do painel Interactions reexecuta a play no
      // mesmo DOM, e a rodada anterior termina com o submenu aberto. O clique no
      // sub-gatilho aberto o fecha — e devolve o foco a ele.
      if (subTrigger.getAttribute('aria-expanded') === 'true') await userEvent.click(subTrigger);
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(1);
      });

      // O foco parte do primeiro item do menu PAI — é de lá que a seta sai.
      within(panel).getAllByRole('menuitem')[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(subTrigger);
      });
      await userEvent.keyboard('{ArrowRight}');

      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu. O escopo é o DOCUMENTO, e não o
        // canvas, porque o painel do submenu é anexado ao `body` — fora da
        // árvore do menu pai, que é o que o tira do alcance do `overflow` do pai
        // e permite posicioná-lo por medida.
        await expect(visibleMenus()).toHaveLength(2);
      });
      // Onde a SETA deixou o foco — nenhuma linha desta play o põe lá. Era aqui
      // que a play focava o item do submenu à mão antes de apertar a seta
      // esquerda, e o `functional.item5` ("foco no primeiro item do submenu")
      // passava sem que a abertura pelo teclado entrasse no painel.
      await expect(document.activeElement).toBe(within(visibleMenus()[1]).getAllByRole('menuitem')[0]);
    });

    await step('O submenu traz os próprios itens e abre AO LADO do pai', async () => {
      // O painel só existe enquanto está aberto — é construído a cada abertura e
      // removido ao fechar —, então encontrá-lo já é prova de estado; era o que
      // o `:not([hidden])` provava enquanto ele nascia junto do pai.
      const submenu = within(document.body).getAllByRole('menu')[1];
      await expect(submenu.dataset.slot).toBe('menubar-sub-content');
      // Fora da árvore do pai também para o teclado: se o painel fosse aninhado,
      // a seta do menu pai passaria a percorrer os itens do filho. E é
      // `aria-owns` que repõe a ligação perdida ao portar — sem ele o submenu é
      // um menu solto no `body` para quem lê a tela.
      await expect(panel.contains(submenu)).toBe(false);
      await expect(submenu.id).not.toBe('');
      await expect(subTrigger.getAttribute('aria-owns')).toBe(submenu.id);
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      // Um submenu que nascesse embaixo cobriria os irmãos do item que o abriu.
      await expect(submenu.getAttribute('data-side')).toBe('right');
      await expect(submenu.getBoundingClientRect().left).toBeGreaterThanOrEqual(
        panel.getBoundingClientRect().left,
      );
    });

    await step('O subpainel ENCOSTA no sub-triggerBox e alinha o primeiro item com ele', async () => {
      // D15, e ela fixa um RESULTADO, não um número: `sideOffset: 0` encosta o
      // subpainel no painel pai, e o TOPO DO PRIMEIRO ITEM alinha com o topo do
      // sub-gatilho que o abriu — não com a borda da caixa. Quem alinha é o
      // item, que é o que a pessoa vê; uma asserção sobre o topo do PAINEL
      // passaria com `alignOffset: 0`, que é o que a conta faria sozinha. E a
      // âncora é o SUB-GATILHO: ele fica recuado 5px da borda direita do painel
      // pai (`border: 1px` mais `padding: var(--spacing-1)`), então cobrar o
      // vão contra a borda do PAI aceitaria o número errado — é o que o passo
      // acima faz, e por isso ele não substitui este.
      //
      // Medido em 2026-09-19, igual nos três membros: `alignOffset` 0 põe o
      // item 5,00px ABAIXO do sub-gatilho, -4 o põe a 1,00 e **-5 a 0,00**.
      // `positionFloating` com `align: 'start'` ancora a BORDA da caixa no topo
      // do sub-gatilho, e do topo do painel ao primeiro item há os mesmos 5px
      // de borda + padding — o `-4` da primeira D15 esquecia a borda.
      //
      // Tolerância 0,75 e não 1: os dois candidatos ficam a exatamente 1px um
      // do outro, e com 1 a asserção não os separaria. A espera é o fim das
      // animações e leitura DIRETA, nunca um `waitFor` em volta da medida — a
      // entrada anima `translateY` e `scale(0.98)` (D5), e o `waitFor` fecharia
      // no primeiro quadro com o defeito de pé.
      const submenu = visibleMenus()[1];
      await waitForAncorado(submenu);
      await waitForAnimationsDone(submenu);
      const triggerBox = subTrigger.getBoundingClientRect();
      const caixa = submenu.getBoundingClientRect();
      const item = within(submenu).getAllByRole('menuitem')[0].getBoundingClientRect();
      const diagnostico =
        `vão lateral=${(caixa.left - triggerBox.right).toFixed(2)} · ` +
        `topo do painel=${(caixa.top - triggerBox.top).toFixed(2)} · ` +
        `topo do 1º item=${(item.top - triggerBox.top).toFixed(2)} (esperado 0)`;
      await expect(Math.abs(caixa.left - triggerBox.right), diagnostico).toBeLessThanOrEqual(0.75);
      await expect(Math.abs(item.top - triggerBox.top), diagnostico).toBeLessThanOrEqual(0.75);
    });

    // As duas saídas do submenu, que o `covers` de `functional.item5` prometia e
    // a play não apertava: ela só abria. Cada uma fecha UM nível — o submenu —,
    // devolve o foco ao item que o abriu, e o menu da barra segue aberto.

    await step('A seta para a esquerda fecha SÓ o submenu e devolve o foco', async () => {
      // O foco está dentro do submenu porque a seta direita o levou até lá, no
      // passo de abertura — e não por um `focus()` desta play.
      await expect(visibleMenus()[1].contains(document.activeElement)).toBe(true);
      await userEvent.keyboard('{ArrowLeft}');
      await expect(visibleMenus()).toHaveLength(1);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(subTrigger);
      // O menu da barra continua na tela: um nível por tecla.
      await expect(panel.hidden).toBe(false);
    });

    await step('Escape dentro do submenu fecha SÓ o submenu e devolve o foco', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(2);
      });
      await expect(visibleMenus()[1].contains(document.activeElement)).toBe(true);

      await userEvent.keyboard('{Escape}');
      await expect(visibleMenus()).toHaveLength(1);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(subTrigger);
      await expect(panel.hidden).toBe(false);
    });

    await step('Submenu aberto pelo PONTEIRO, foco no menu pai: Escape fecha só o submenu', async () => {
      // O caso que os dois passos acima não alcançam: o ponteiro abre o submenu
      // e o foco fica no painel pai. A tecla sobe do painel pai até a barra, e
      // a barra fechava TUDO — dois níveis com uma tecla, contra a WAI-ARIA APG.
      const [first] = within(panel).getAllByRole('menuitem');
      first.focus();
      // O ponteiro passa por um irmão ANTES: no replay ele já pode estar sobre o
      // sub-gatilho, e aí não haveria entrada nova para abrir o submenu.
      await userEvent.hover(first);
      await userEvent.hover(subTrigger);
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(2);
      });
      // Precondição medida: o foco NÃO entrou no submenu — o ponteiro não o leva.
      await expect(panel.contains(document.activeElement)).toBe(true);

      await userEvent.keyboard('{Escape}');
      await expect(visibleMenus()).toHaveLength(1);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
      // O menu da barra segue aberto, e o foco segue nele.
      await expect(panel.hidden).toBe(false);
      await expect(
        canvasElement.querySelector('[data-slot="menubar-trigger"]')?.getAttribute('aria-expanded'),
      ).toBe('true');
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // É o estado que `visual.item4` descreve e o Chromatic fotografa.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        await expect(visibleMenus()).toHaveLength(2);
      });
    });

    await step('Com o painel aberto, o triggerBox deslocado e a página rolada reposicionam o painel junto dele', async () => {
      // O painel do submenu mora no `body`; o sub-gatilho, no menu da barra, que
      // é ancorado por CSS dentro do canvas. Sem o acompanhamento de
      // `autoUpdateFloating` em `@/lib/submenu`, o submenu ficava onde abriu
      // enquanto o item que o abriu andava.
      const submenu = visibleMenus()[1];
      const focused = document.activeElement;
      await checkPanelFollowsTrigger(submenu, canvasElement);
      // Reposicionar não fecha nível nenhum e não mexe no foco.
      await expect(visibleMenus()).toHaveLength(2);
      await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
      await expect(document.activeElement).toBe(focused);
    });
  },
};

// ─── NestedSubmenu ────────────────────────────────────────────────────────────
//
// Submenu DENTRO de submenu. O conteúdo compartilhado o mostra vivo no lado
// "evite" do Do & Don't — o assunto do par é justamente que ele confunde —, e a
// fábrica não o aninhava: o sub-gatilho do segundo nível, ao abrir, fechava o
// próprio painel que o continha. A pilha de níveis de `@/lib/submenu` é o que
// esta story prova, uma tecla por nível.

const FORMATOS = ['PDF', 'PNG'] as const;

const NESTED_MENUS = [
  {
    label: 'Arquivo',
    items: [
      { label: 'Novo' },
      {
        type: 'submenu' as const,
        label: 'Exportar',
        items: [{ type: 'submenu' as const, label: 'Formato', items: FORMATOS.map((f) => ({ label: f })) }],
      },
    ],
  },
];

export const NestedSubmenu: Story = {
  parameters: {
    docs: { source: { transform: menubarSourceWith({ menus: NESTED_MENUS, defaultOpen: 0 }) } },
  },
  render: () => embrulhar(createMenubar(NESTED_MENUS, { defaultOpen: 0 }), '340px'),
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPanel(canvasElement);
    const [fileTrigger] = triggersOf(canvasElement.querySelector<HTMLElement>('[data-slot="menubar"]')!);
    const exportTrigger = within(panel).getByRole('menuitem', { name: 'Exportar' });
    const visibleMenus = () => within(document.body).queryAllByRole('menu');
    const formatTrigger = () => within(document.body).getByRole('menuitem', { name: 'Formato' });

    /**
     * Precondição própria: só o menu da barra aberto, com o foco no sub-gatilho
     * do primeiro nível. O replay do painel Interactions reexecuta a play no
     * mesmo DOM, com a pilha no estado em que a rodada anterior a deixou — o
     * clique no gatilho aberto fecha tudo, e o seguinte reabre limpo.
     */
    const resetToFirstLevel = async () => {
      if (fileTrigger.getAttribute('aria-expanded') === 'true') await userEvent.click(fileTrigger);
      await userEvent.click(fileTrigger);
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(1);
      });
      exportTrigger.focus();
    };

    await step('Duas setas para a direita descem dois níveis, e o foco entra em cada um', async () => {
      await resetToFirstLevel();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(formatTrigger());
      });
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect((document.activeElement as HTMLElement).textContent).toBe(FORMATOS[0]);
      });
      // O menu da barra e os DOIS submenus ao mesmo tempo: abrir o segundo nível
      // não fecha o primeiro, que é o painel que o contém.
      await expect(visibleMenus()).toHaveLength(3);
      await expect(exportTrigger.getAttribute('aria-expanded')).toBe('true');
      await expect(formatTrigger().getAttribute('aria-expanded')).toBe('true');
    });

    await step('Cada nível vive fora da árvore do anterior, ligado pelo aria-owns', async () => {
      const [, middle, inner] = visibleMenus();
      await expect(middle.contains(inner)).toBe(false);
      await expect(exportTrigger.getAttribute('aria-owns')).toBe(middle.id);
      await expect(formatTrigger().getAttribute('aria-owns')).toBe(inner.id);
      await expect(middle.id).not.toBe(inner.id);
    });

    await step('Escape fecha SÓ o nível mais fundo e devolve o foco a quem o abriu', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(visibleMenus()).toHaveLength(2);
      await expect(document.activeElement).toBe(formatTrigger());
      await expect(formatTrigger().getAttribute('aria-expanded')).toBe('false');
      await expect(exportTrigger.getAttribute('aria-expanded')).toBe('true');
    });

    await step('A seta para a esquerda sobe um nível por vez', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(3);
      });
      await userEvent.keyboard('{ArrowLeft}');
      await expect(visibleMenus()).toHaveLength(2);
      await expect(document.activeElement).toBe(formatTrigger());

      await userEvent.keyboard('{ArrowLeft}');
      await expect(visibleMenus()).toHaveLength(1);
      await expect(document.activeElement).toBe(exportTrigger);
      await expect(exportTrigger.getAttribute('aria-owns')).toBe(null);
    });

    await step('Escolher no nível mais fundo fecha a barra INTEIRA e volta ao triggerBox', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(formatTrigger());
      });
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(3);
      });
      await userEvent.keyboard('{Enter}');
      // Nenhum painel sobra no `body`: um neto que sobrevivesse ao avô seria um
      // menu órfão na tela, sem ninguém com referência para removê-lo.
      await expect(visibleMenus()).toHaveLength(0);
      await expect(document.querySelectorAll('[data-slot="menubar-sub-content"]')).toHaveLength(0);
      await expect(fileTrigger.getAttribute('aria-expanded')).toBe('false');
      await expect(document.activeElement).toBe(fileTrigger);
    });

    await step('A story termina com os dois níveis ABERTOS', async () => {
      // É o estado que o Chromatic fotografa: a pilha inteira na tela.
      await resetToFirstLevel();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(formatTrigger());
      });
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(visibleMenus()).toHaveLength(3);
      });
    });
  },
};

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Exibir',
              items: [
                { type: 'label', label: 'Mostrar na tela' },
                ...EXIBICOES.map((e) => ({
                  type: 'checkbox' as const,
                  label: e.label,
                  checked: e.checked,
                  onCheckedChange: '(marcado) => alternar(marcado)',
                })),
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
            label: 'Exibir',
            items: [
              { type: 'label', label: 'Mostrar na tela' },
              ...EXIBICOES.map((e) => ({
                type: 'checkbox' as const,
                label: e.label,
                checked: e.checked,
              })),
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '300px',
    ),
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPanel(canvasElement);
    const boxes = within(panel).getAllByRole('menuitemcheckbox');

    await step('Cada linha é uma caixa de seleção independente', async () => {
      await expect(boxes).toHaveLength(EXIBICOES.length);
      for (const box of boxes) {
        await expect(box.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(box.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const target = boxes[EXIBICOES.findIndex((e) => e.label === 'Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (target.getAttribute('aria-checked') !== 'true') await userEvent.click(target);
      await waitFor(async () => {
        await expect(target.getAttribute('aria-checked')).toBe('true');
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê.
        await expect(target.querySelector('.nds-dropdown-menu-item-indicator svg')).not.toBeNull();
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(panel.hidden).toBe(false);
      const other = boxes[EXIBICOES.findIndex((e) => e.label === 'Grade')];
      await expect(other.getAttribute('aria-checked')).toBe('false');
    });

    await step('O rótulo dá nome ao grupo dos alternadores', async () => {
      // O rótulo era um `<div>` solto no painel: o texto não chegava a nome
      // acessível de coisa alguma. Agora ele nomeia o `role="group"` que
      // envolve os itens seguintes — e continua fora da roda do teclado.
      const group = within(panel).getByRole('group', { name: 'Mostrar na tela' });
      await expect(within(group).getAllByRole('menuitemcheckbox')).toHaveLength(EXIBICOES.length);
      await expect(group.getAttribute('tabindex')).toBeNull();
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

/**
 * Cada escolha de opção, na ordem — o `onClick` da opção, que sai a cada gesto
 * de escolher, e é de onde a docs page tira o `menubar_item_select`. Lista do
 * módulo porque a play precisa lê-la; as asserções medem o que ENTROU durante o
 * passo, então o replay do painel Interactions não as engana.
 */
const themeChoices: string[] = [];

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item15', 'accessibility.item5'],
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Aparência',
              items: [
                { type: 'label', label: 'Tema' },
                {
                  type: 'radio-group',
                  value: 'light',
                  options: THEMES.map((t) => ({ value: t.value, label: t.label })),
                  onValueChange: '(valor) => aplicarTema(valor)',
                },
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
            label: 'Aparência',
            items: [
              { type: 'label', label: 'Tema' },
              {
                type: 'radio-group',
                value: 'light',
                options: THEMES.map((t) => ({
                  value: t.value,
                  label: t.label,
                  onClick: () => themeChoices.push(t.value),
                })),
              },
            ],
          },
        ],
        { defaultOpen: 0 },
      ),
      '300px',
    ),
  play: async ({ canvasElement, step }) => {
    const panel = await waitForPanel(canvasElement);
    const options = within(panel).getAllByRole('menuitemradio');
    const optionOf = (value: string) => options[THEMES.findIndex((t) => t.value === value)];
    const checkedCount = () => options.filter((o) => o.getAttribute('aria-checked') === 'true').length;

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(options).toHaveLength(THEMES.length);
      await expect(checkedCount()).toBe(1);
    });

    await step('O rótulo dá nome ao grupo de escolha única — um grupo só', async () => {
      // O grupo de escolha única era um `role="group"` SEM nome, e o rótulo um
      // `<div>` solto ao lado dele: o leitor anunciava "grupo" sem dizer de quê.
      // O rótulo agora nomeia o próprio grupo das opções, sem um segundo grupo
      // aninhado — dois grupos para um bloco seriam anunciados duas vezes.
      const group = within(panel).getByRole('group', { name: 'Tema' });
      await expect(within(group).getAllByRole('menuitemradio')).toHaveLength(THEMES.length);
      await expect(within(panel).getAllByRole('group')).toHaveLength(1);
    });

    await step('Escolher outra opção transfere a marcação', async () => {
      const escuro = options[THEMES.findIndex((t) => t.value === 'dark')];
      // Idempotente: o clique só acontece com a opção desmarcada — e escolher a
      // MESMA opção duas vezes deixaria o mesmo estado de qualquer forma, que é
      // o que distingue escolha única de alternador.
      if (escuro.getAttribute('aria-checked') !== 'true') await userEvent.click(escuro);
      await waitFor(async () => {
        await expect(escuro.getAttribute('aria-checked')).toBe('true');
      });
      await expect(options.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('Enter e Espaço escolhem pelo teclado, e o menu segue aberto', async () => {
      // A opção só ouvia `click`: quem navega por teclado pousava nela e não
      // tinha como escolher (WCAG 2.1.1). A seta leva o foco — a play não o põe
      // em opção nenhuma além da de partida —, e a TECLA escolhe.
      optionOf('dark').focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(optionOf('system'));
      await userEvent.keyboard('{Enter}');
      await expect(optionOf('system')).toHaveAttribute('aria-checked', 'true');
      await expect(checkedCount()).toBe(1);

      await userEvent.keyboard('{ArrowUp}');
      await expect(document.activeElement).toBe(optionOf('dark'));
      await userEvent.keyboard(' ');
      await expect(optionOf('dark')).toHaveAttribute('aria-checked', 'true');
      await expect(checkedCount()).toBe(1);
      // Escolher pelo teclado também não fecha.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
    });

    await step('Escolher de novo a opção já escolhida ainda é uma escolha', async () => {
      // O ouvinte voltava ANTES de avisar qualquer coisa quando a opção já era
      // a escolhida, e o `menubar_item_select` sumia justo no gesto de
      // confirmar. O dropdown e o menu de contexto avisam a cada ativação.
      //
      // Precondição medida ANTES do clique — o passo do teclado deixou "Escuro"
      // escolhido, e é a opção já escolhida que este passo clica. Escolha única
      // não alterna: o clique repetido, no replay ou não, deixa o mesmo estado.
      const dark = optionOf('dark');
      await expect(dark.getAttribute('aria-checked')).toBe('true');
      const before = themeChoices.length;
      await userEvent.click(dark);
      await expect(themeChoices.slice(before)).toEqual(['dark']);
      // A marcação não mudou: continua uma, e na mesma opção.
      await expect(checkedCount()).toBe(1);
      await expect(options.find((o) => o.getAttribute('aria-checked') === 'true')).toBe(dark);
    });

    await step('Escolher não fecha o menu', async () => {
      // Consulta NOVA, e não as referências de antes do clique: um menu que
      // fechasse esconderia o painel, mas as opções guardadas continuariam
      // respondendo por atributo. Contar os menus VISÍVEIS do documento — o
      // painel fechado leva `hidden` e sai da contagem — é o que reprova esse
      // fechamento.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      await expect(
        within(document.body).getByRole('menuitemradio', { name: THEMES.find((t) => t.value === 'dark')!.label }),
      ).toHaveAttribute('aria-checked', 'true');
    });
  },
};

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  // A barra inteira é o assunto: as quatro categorias convivendo é o que o
  // snippet do meta, com dois menus, deixaria de fora.
  parameters: {
    docs: {
      source: {
        transform: menubarSourceWith({
          menus: [
            {
              label: 'Arquivo',
              items: [
                { type: 'label', label: 'Documento' },
                { label: 'Novo', shortcut: 'Ctrl+N' },
                { label: 'Abrir', shortcut: 'Ctrl+O' },
                { type: 'separator' },
                { label: 'Descartar alterações', variant: 'destructive' },
              ],
            },
            {
              label: 'Editar',
              items: [
                { label: 'Desfazer', shortcut: 'Ctrl+Z' },
                { label: 'Refazer', shortcut: 'Ctrl+Shift+Z' },
              ],
            },
            {
              label: 'Exibir',
              items: [
                { type: 'label', label: 'Mostrar na tela' },
                { type: 'checkbox', label: 'Régua', checked: true },
                { type: 'checkbox', label: 'Grade' },
              ],
            },
            {
              label: 'Ajuda',
              items: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
            },
          ],
        }),
      },
    },
  },
  render: () =>
    embrulhar(
      createMenubar([
        {
          label: 'Arquivo',
          items: [
            { type: 'label', label: 'Documento' },
            { label: 'Novo', shortcut: 'Ctrl+N' },
            { label: 'Abrir', shortcut: 'Ctrl+O' },
            { type: 'separator' },
            { label: 'Descartar alterações', variant: 'destructive' },
          ],
        },
        {
          label: 'Editar',
          items: [
            { label: 'Desfazer', shortcut: 'Ctrl+Z' },
            { label: 'Refazer', shortcut: 'Ctrl+Shift+Z' },
          ],
        },
        {
          label: 'Exibir',
          items: [
            { type: 'label', label: 'Mostrar na tela' },
            { type: 'checkbox', label: 'Régua', checked: true },
            { type: 'checkbox', label: 'Grade' },
          ],
        },
        {
          label: 'Ajuda',
          items: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
        },
      ]),
      '200px',
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = triggersOf(barra);

    await step('As quatro categorias clássicas convivem na mesma barra', async () => {
      await expect(triggers).toHaveLength(MENUS_EDITOR.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('A barra é uma só parada de tabulação, com todos os menus fechados', async () => {
      await expect(
        triggers.filter((g) => g.tabIndex === 0),
      ).toHaveLength(1);
      for (const trigger of triggers) {
        await expect(trigger.getAttribute('data-state')).toBe('closed');
      }
    });
  },
};
