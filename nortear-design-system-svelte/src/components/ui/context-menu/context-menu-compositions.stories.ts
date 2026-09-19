import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect, waitFor } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuCompositionStory from './ContextMenuCompositionStory.svelte';
import { FOCUS_RULE_GUARDA, axeRules, waitForPortal } from '@/lib/wait-for-portal';
import { gestoOpen } from '@shared/testing/context-menu-area';
import { waitForAncorado } from '@shared/testing/ancoragem';
import {
  contextMenuWithShortcutsSource,
  contextMenuWithRadioGroupSource,
  contextMenuWithCheckboxSource,
  contextMenuWithSubmenuSource,
  contextMenuCompleteSource,
  contextMenuSource,
} from './context-menu.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/ContextMenu/Compositions',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('dropdownMenu'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: contextMenuSource },
      description: {
        component:
          'Composições do Context Menu: atalhos, marcação, escolha única, submenu e o menu completo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Espera as animações de um painel ASSENTAREM. Espera PURA: só aguarda
 * `finished`, não lê nem escreve DOM, então não tem como provocar a própria
 * reagendagem.
 *
 * **Isto tem de rodar no painel PAI ANTES de o submenu abrir, e não só antes de
 * medir.** O painel entra por `nds-menu-in` (`nds/dropdown-menu.css`), que anima
 * `translateY` + `scale(0.98)`, e o SUB-GATILHO mora dentro dele. Abrir o
 * submenu nesse intervalo o ancora contra um gatilho EM MOVIMENTO — e ele fica
 * lá, porque o observador de reposicionamento da lib acompanha rolagem,
 * redimensionamento e mudança de TAMANHO, e `transform` não muda nenhum dos
 * três.
 *
 * Medido no vanilla em 2026-09-19, mesma folha e mesma animação: a deriva foi de
 * **1,13px**, a mesma ordem de grandeza do `-4`/`-5` que esta asserção precisa
 * separar. O dropdown sondado com o `-4` plantado devolveu −5,13 em vez de
 * −4,00, ou seja PASSOU numa rodada em que deveria reprovar. É intermitência
 * latente: no caso feliz a animação já acabou e ninguém vê.
 */
const assentarAnimacoes = async (el: HTMLElement) => {
  const nos = [el, el.parentElement].filter(Boolean) as HTMLElement[];
  await Promise.all(
    nos.flatMap((no) => no.getAnimations().map((a) => a.finished.catch(() => undefined))),
  );
};

/**
 * A medida da D15 — o submenu contra o SUB-GATILHO que o abriu.
 *
 * `deslocamentoDoItem` é o topo do PRIMEIRO ITEM do subpainel menos o topo do
 * sub-gatilho; a D15 pede zero. `deslocamentoDaCaixa` é o topo do PAINEL menos o
 * mesmo topo, e ele diz o que a lib ancora: medido em 2026-09-19, ele sai
 * EXATAMENTE igual ao `alignOffset` (0 → 0,00; −4 → −4,00; −5 → −5,00), o que
 * prova que o bits ancora a CAIXA DE BORDA do painel — como a base-ui e como o
 * `positionFloating` do vanilla, e ao contrário da reka, que desconta borda e
 * padding sozinha e por isso quer `0`. É daí que sai o número: `−(borda +
 * padding)`. `vaoLateral` é a borda esquerda do subpainel menos a borda direita
 * do sub-gatilho, que é o `sideOffset` de fato aplicado.
 *
 * **A espera é PURA, e a leitura é DIRETA.** `waitForAncorado` lê o `-200%` que
 * a lib deixa no invólucro enquanto mede, e as animações são esperadas por
 * `getAnimations().finished` — nenhum `waitFor` em volta da medida. Medido no
 * vue em 2026-09-18 e registrado na D15: envolver esta medida num `waitFor` faz
 * a asserção PASSAR COM O DEFEITO PLANTADO, porque no lugar de espera da lib a
 * diferença já cabe na tolerância e o `waitFor` fecha no primeiro quadro.
 */
const medirSubmenu = async (subTrigger: HTMLElement, submenu: HTMLElement) => {
  await waitForAncorado(submenu);
  await assentarAnimacoes(submenu);
  const item = submenu.querySelector<HTMLElement>(
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
  )!;
  const gatilho = subTrigger.getBoundingClientRect();
  const painel = submenu.getBoundingClientRect();
  return {
    deslocamentoDoItem: item.getBoundingClientRect().top - gatilho.top,
    deslocamentoDaCaixa: painel.top - gatilho.top,
    vaoLateral: painel.left - gatilho.right,
  };
};

const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

/**
 * O nome acessível do grupo, lido pelo `aria-labelledby` que o aponta.
 *
 * O grupo existe para ter nome: "Visualização, grupo" em vez de um bloco
 * anônimo. Ler o texto do elemento apontado — e não só a presença do atributo —
 * é o que reprova um `aria-labelledby` que aponta para um `id` que não existe.
 */
const groupName = (group: HTMLElement) => {
  const id = group.getAttribute('aria-labelledby');
  return id ? document.getElementById(id)?.textContent?.trim() : undefined;
};

// ── Com atalhos ───────────────────────────────────────────────────────────────

export const WithShortcut: Story = {
  parameters: {
    // F17: o atalho dentro do item, lido junto dele, e encostado à direita do
    // rótulo — os dois passos abaixo.
    covers: ['functional.item17'],
    docs: { source: { transform: contextMenuWithShortcutsSource } },
  },
  render: () => ({ Component: ContextMenuCompositionStory, props: { composition: 'shortcut' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O atalho vive dentro do item e é lido junto dele', async () => {
      const menu = await gestoOpen(area());
      const shortcuts = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-shortcut"]');
      await expect(shortcuts.length).toBe(3);
      for (const shortcut of shortcuts) {
        await expect(shortcut.hasAttribute('aria-hidden')).toBe(false);
        await expect(shortcut.closest('[data-slot="context-menu-item"]')).not.toBeNull();
      }
      // F17 promete o atalho NO NOME ACESSÍVEL, e é o nome que se confere: estar
      // dentro do item e sem `aria-hidden` é condição, não prova — um
      // `aria-label` no item, por exemplo, tiraria o atalho do nome sem mexer em
      // nenhuma das duas. "Editar Ctrl+E" é o que o leitor de tela anuncia.
      await expect(within(menu).getByRole('menuitem', { name: 'Editar Ctrl+E' })).toBe(
        target('edit'),
      );
    });

    await step('O atalho fica encostado à direita do rótulo', async () => {
      // É o alinhamento que faz a coluna de atalhos existir; sem ele o texto
      // sai colado no rótulo e a leitura visual se perde.
      const item = target('edit').getBoundingClientRect();
      const shortcut = target('edit')
        .querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!
        .getBoundingClientRect();
      await expect(item.right - shortcut.right).toBeLessThan(16);
    });
  },
};

// ── Com marcação ──────────────────────────────────────────────────────────────

export const WithCheckbox: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item4'],
    docs: { source: { transform: contextMenuWithCheckboxSource } },
  },
  render: () => ({ Component: ContextMenuCompositionStory, props: { composition: 'checkbox' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que tipo de escolha o item é', async () => {
      await gestoOpen(area());
      await expect(target('grid').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('rulers').getAttribute('aria-checked')).toBe('true');
    });

    await step('O rótulo nomeia o grupo, e não é um item escolhível', async () => {
      // Só dentro do grupo o rótulo vira nome de alguma coisa: o leitor de tela
      // anuncia "Visualização, grupo". O `data-slot` é o das outras stacks.
      const group = target('group');
      await expect(group.getAttribute('role')).toBe('group');
      await expect(groupName(group)).toBe('Visualização');
      const label = group.querySelector<HTMLElement>('[data-slot="context-menu-label"]')!;
      await expect(label.getAttribute('role')).toBeNull();
      await expect(group.getAttribute('aria-labelledby')).toBe(label.id);
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia.
      for (const id of ['grid', 'rulers']) {
        await expect(
          target(id).querySelector('[data-slot="context-menu-checkbox-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      await expect(
        target('rulers').querySelector(
          '[data-slot="context-menu-checkbox-item-indicator"] svg',
        ),
      ).not.toBeNull();
    });

    await step('Marcar alterna o estado anunciado e o indicador, e o menu segue aberto', async () => {
      // Lê o estado ANTES de clicar: no replay a story parte do que a rodada
      // anterior deixou, e um valor esperado fixo inverteria o resultado.
      const grid = target('grid');
      const before = grid.getAttribute('aria-checked');
      const expected = before === 'true' ? 'false' : 'true';
      await userEvent.click(grid);
      await waitFor(() => expect(grid.getAttribute('aria-checked')).toBe(expected));
      await expect(!!grid.querySelector('svg')).toBe(expected === 'true');
      // Sem janela de tempo: o estado da área e o `aria-checked` saem da MESMA
      // atualização do componente. Se alternar fechasse o menu, a área já
      // estaria `closed` no instante em que o item mostra o novo estado — e o
      // item continua sendo o mesmo nó, ligado ao documento.
      await expect(area().getAttribute('data-state')).toBe('open');
      await expect(grid.isConnected).toBe(true);
    });
  },
};

// ── Com escolha única ─────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item5'],
    docs: { source: { transform: contextMenuWithRadioGroupSource } },
  },
  render: () => ({ Component: ContextMenuCompositionStory, props: { composition: 'radio' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que a escolha é única', async () => {
      await gestoOpen(area());
      await expect(target('layout-grid').getAttribute('role')).toBe('menuitemradio');
      await expect(target('layout-list').getAttribute('role')).toBe('menuitemradio');
    });

    await step('O rótulo nomeia o grupo de rádio', async () => {
      // O grupo de rádio já é um grupo, então o rótulo mora dentro dele e o
      // nomeia direto — sem um segundo grupo anônimo em volta.
      const group = target('group');
      await expect(group.getAttribute('role')).toBe('group');
      await expect(groupName(group)).toBe('Layout');
      await expect(
        group.querySelector('[data-slot="context-menu-label"]')?.getAttribute('role'),
      ).toBeFalsy();
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      const options = ['layout-grid', 'layout-list', 'layout-columns'].map(target);
      for (const option of options) {
        await expect(
          option.querySelector('[data-slot="context-menu-radio-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro. Qual opção está marcada varia entre rodadas, então ela é
      // procurada, nunca fixada.
      const checked = options.find((o) => o.getAttribute('aria-checked') === 'true')!;
      await expect(
        checked.querySelector('[data-slot="context-menu-radio-item-indicator"] svg'),
      ).not.toBeNull();
    });

    await step('Escolher uma opção limpa a anterior, e o menu segue aberto', async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const startedOnGrid = target('layout-grid').getAttribute('aria-checked') === 'true';
      const click = target(startedOnGrid ? 'layout-columns' : 'layout-grid');
      const other = target(startedOnGrid ? 'layout-grid' : 'layout-columns');
      await userEvent.click(click);
      await waitFor(() => expect(click.getAttribute('aria-checked')).toBe('true'));
      await expect(other.getAttribute('aria-checked')).toBe('false');
      // Mesma prova da marcação: estado da área e `aria-checked` saem da mesma
      // atualização, então não há janela de tempo a esperar.
      await expect(area().getAttribute('data-state')).toBe('open');
      await expect(click.isConnected).toBe(true);
    });
  },
};

// ── Com submenu ───────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    // A10 é o primeiro passo: o sub-gatilho declara `aria-haspopup="menu"`, e o
    // `aria-expanded` acompanha o estado em cada passo seguinte.
    covers: ['functional.item5', 'functional.item6', 'accessibility.item10', 'visual.item3'],
    docs: { source: { transform: contextMenuWithSubmenuSource } },
  },
  render: () => ({ Component: ContextMenuCompositionStory, props: { composition: 'submenu' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');
    const rootPanel = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-content"]');

    await step('O sub-gatilho diz que abre um menu', async () => {
      await gestoOpen(area());
      // O painel PAI assenta ANTES de qualquer submenu abrir — ver
      // `assentarAnimacoes`. Aqui, e não junto da medida: o que estraga a medida
      // é o submenu ter sido ANCORADO contra um sub-gatilho em movimento, e
      // depois disso nenhuma espera desfaz.
      await assentarAnimacoes(rootPanel()!);
      await expect(target('sub').getAttribute('aria-haspopup')).toBe('menu');
      await expect(target('sub').getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta direita abre o submenu ao lado e leva o foco ao primeiro item dele', async () => {
      target('sub').focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(target('sub').getAttribute('aria-expanded')).toBe('true'));
      await expect(
        submenu()!.querySelectorAll('[data-slot="context-menu-item"]').length,
      ).toBe(2);

      // Abrir não basta: o foco tem de ENTRAR. Sem isso a seta seguinte
      // continuaria andando no menu de cima, e o submenu aberto seria
      // inalcançável pelo teclado (WCAG 2.1.1).
      await waitFor(() => expect(document.activeElement).toBe(target('share-email')));
    });

    await step('D15 · o submenu encosta no sub-gatilho e alinha o primeiro item com ele', async () => {
      const { deslocamentoDoItem, deslocamentoDaCaixa, vaoLateral } = await medirSubmenu(target('sub'), submenu()!);
      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // um `side` errado quebraria sem nenhum aviso. E a medida é DIRETA, depois
      // de `waitForAncorado` — a versão anterior deste passo envolvia a
      // comparação num `waitFor`, que é exatamente a armadilha que a D15
      // registra: no lugar de espera da lib a diferença já cabe na tolerância, o
      // `waitFor` fecha no primeiro quadro e a asserção passa ANTES de a lib
      // posicionar.
      //
      // D15 fixa o RESULTADO: o topo do PRIMEIRO ITEM alinha com o topo do
      // sub-gatilho. Medido em 2026-09-19 — `alignOffset: -5` sai 0,00; `-4` sai
      // +1,00; `0` sai +5,00; e sem `align="start"` sai −14,00, porque aí a lib
      // centra o painel no gatilho.
      //
      // **A tolerância é 0,75, e não 1**: os dois candidatos plausíveis (`-4` e
      // `-5`) ficam a exatamente 1px um do outro, e com tolerância de 1 a
      // asserção passaria com o `-4` plantado.
      await expect(Math.abs(deslocamentoDoItem)).toBeLessThanOrEqual(0.75);
      // `sideOffset: 0` encosta o subpainel no SUB-GATILHO. Tem dentes: o vão
      // acompanha o número (0 → 0,00; 8 → 8,00).
      await expect(Math.abs(vaoLateral)).toBeLessThanOrEqual(1);
      // E o que a lib ANCORA é a CAIXA DE BORDA do painel: o topo dele sai
      // exatamente no `alignOffset`. É a premissa de onde o -5 vem — ele é
      // `−(borda + padding)` porque a lib não desconta nenhum dos dois. Se o
      // bits passar a descontar sozinho, como a reka faz (e aí o número vira
      // 0), este passo reprova e manda remedir, em vez de o desenho quebrar em
      // silêncio.
      await expect(Math.abs(deslocamentoDaCaixa + 5)).toBeLessThanOrEqual(0.75);
    });

    await step('Seta esquerda fecha o submenu e devolve o foco ao sub-gatilho', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(target('sub').getAttribute('aria-expanded')).toBe('false'));
      await expect(document.activeElement).toBe(target('sub'));
    });

    await step('Escape no submenu fecha só o submenu e devolve o foco ao sub-gatilho', async () => {
      // WAI-ARIA APG: Escape fecha o menu em que o foco está, e o de fora segue
      // aberto. O bits fechava a árvore inteira — um nível de volta custava os
      // dois, e a pessoa recomeçava do clique direito (ver `context.ts`).
      const panel = rootPanel();
      target('sub').focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(target('share-email')));
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(submenu()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(target('sub')));
      await expect(target('sub').getAttribute('aria-expanded')).toBe('false');
      // O raiz é o MESMO nó, um quadro depois: a decisão de fechar já teria sido
      // tomada, e um painel fechado e reaberto no meio passaria por "aberto".
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(rootPanel()).toBe(panel);
      await expect(panel?.isConnected).toBe(true);
      await expect(area().getAttribute('data-state')).toBe('open');
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item3` descreve o submenu aberto — é o que o Chromatic precisa
      // fotografar.
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(submenu()).not.toBeNull());
    });
  },
};

// ── Composição completa ───────────────────────────────────────────────────────

export const CompleteComposition: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: contextMenuCompleteSource } },
  },
  render: () => ({ Component: ContextMenuCompositionStory, props: { composition: 'complete' } }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('Marcação e escolha única convivem no mesmo menu', async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await gestoOpen(area());
      await expect(target('grid').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('layout-grid').getAttribute('role')).toBe('menuitemradio');
      await expect(
        menu.querySelectorAll('[data-slot="context-menu-separator"]').length,
      ).toBe(3);
    });

    await step('Cada grupo tem nome, e o nome não é um item escolhível', async () => {
      // O rótulo vira o `aria-labelledby` do grupo: é o que faz o leitor de
      // tela anunciar "Ações, grupo" em vez de um bloco anônimo. O `data-slot`
      // do rótulo é `context-menu-label`, o mesmo das outras quatro stacks.
      const menu = await waitForPortal('menu');
      const groups = [...menu.querySelectorAll<HTMLElement>('[role="group"]')];
      await expect(groups.map(groupName)).toEqual(['Ações', 'Visualização', 'Layout']);
      const labels = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-label"]');
      await expect(labels.length).toBe(3);
      for (const label of labels) {
        await expect(label.getAttribute('role')).toBeNull();
      }
    });
  },
};
