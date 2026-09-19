import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, FOCUS_RULE_GUARDA, axeRules } from '@/lib/wait-for-portal';
import { waitForAncorado } from '@shared/testing/ancoragem';
import MenubarStory from './MenubarStory.svelte';
import {
  menubarSource,
  menubarWithShortcutsSource,
  menubarWithSubmenuSource,
  menubarWithCheckboxSource,
  menubarWithRadioSource,
} from './menubar.source';

// Listas primeiro: toda contagem do play sai daqui, nunca de um número escrito
// à mão que a próxima edição do markup deixa mentindo.
const SHORTCUTS = [
  { label: 'Desfazer', atalho: 'Ctrl+Z' },
  { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
  { label: 'Copiar', atalho: 'Ctrl+C' },
];

const EXPORTACOES = ['PDF', 'CSV', 'PNG'];

const EXIBICOES = ['Régua', 'Barra lateral', 'Grade'];

const THEMES = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Do sistema' },
];

const MENUS_EDITOR = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'];

const meta: Meta = {
  title: 'Components/Navigation/Menubar/Compositions',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: menubarSource },
      description: {
        component:
          'As composições canônicas de um menu da barra: atalhos visíveis, submenu, alternadores independentes, escolha única e a barra completa de um editor.',
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
  const triggerBox = subTrigger.getBoundingClientRect();
  const panelBox = submenu.getBoundingClientRect();
  return {
    deslocamentoDoItem: item.getBoundingClientRect().top - triggerBox.top,
    deslocamentoDaCaixa: panelBox.top - triggerBox.top,
    vaoLateral: panelBox.left - triggerBox.right,
  };
};

// ─── WithShortcuts ────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  args: { defaultValue: 'edit', demonstration: 'shortcuts' },
  // F16: o atalho dentro do nome acessível e à direita do rótulo — os passos
  // abaixo medem as duas metades.
  parameters: {
    covers: ['functional.item16', 'visual.item2'],
    docs: { source: { transform: menubarWithShortcutsSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('Cada item leva o próprio atalho', async () => {
      await expect(items).toHaveLength(SHORTCUTS.length);
      const shortcuts = menu.querySelectorAll('[data-slot="menubar-shortcut"]');
      await expect(shortcuts).toHaveLength(SHORTCUTS.length);
    });

    await step('O atalho entra no nome do item, e não fica escondido do leitor', async () => {
      // Sem `aria-hidden`: "Desfazer, Ctrl+Z" é o que dá serventia ao atalho para
      // quem não enxerga a tela. Escondê-lo devolveria só "Desfazer".
      for (const [i, item] of items.entries()) {
        await expect(item).toHaveAccessibleName(`${SHORTCUTS[i].label} ${SHORTCUTS[i].atalho}`);
      }
    });

    await step('O atalho é secundário — cor esmaecida à direita do rótulo', async () => {
      const atalho = menu.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
      await expect(atalho.classList.contains('nds-dropdown-menu-shortcut')).toBe(true);
      await expect(getComputedStyle(atalho).color).not.toBe(getComputedStyle(items[0]).color);
    });

    await step('O atalho fica encostado na borda direita do item', async () => {
      // A folga à direita do atalho é menor que a distância dele até a borda
      // esquerda: é o alinhamento que faz a coluna de atalhos existir. Colado no
      // rótulo, o atalho ficaria perto da esquerda e a comparação inverteria.
      for (const item of items) {
        const atalho = item.querySelector<HTMLElement>('[data-slot="menubar-shortcut"]')!;
        const itemBox = item.getBoundingClientRect();
        const shortcutBox = atalho.getBoundingClientRect();
        await expect(itemBox.right - shortcutBox.right).toBeLessThan(
          shortcutBox.left - itemBox.left,
        );
      }
    });
  },
};

// ─── WithSubmenu ──────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  args: { defaultValue: 'file', demonstration: 'submenu' },
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    docs: { source: { transform: menubarWithSubmenuSource } },
  },
  play: async ({ step }) => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    // O painel PAI assenta ANTES de qualquer submenu abrir — ver
    // `assentarAnimacoes`. Aqui, e não junto da medida: o que estraga a medida é
    // o submenu ter sido ANCORADO contra um sub-gatilho em movimento, e depois
    // disso nenhuma espera desfaz.
    await assentarAnimacoes(menu);
    const subTrigger = within(menu).getByRole('menuitem', { name: 'Exportar' });

    await step('O sub-triggerBox anuncia que abre outro menu', async () => {
      await expect(subTrigger.getAttribute('aria-haspopup')).toBe('menu');
      await expect(subTrigger.getAttribute('data-slot')).toBe('menubar-sub-trigger');
    });

    // O primeiro item do painel filho, lido de novo a cada chamada: o painel é
    // outro nó a cada abertura.
    const firstSubItem = () =>
      within(body.getAllByRole('menu').find((m) => m !== menu)!).getAllByRole('menuitem')[0];

    // Abre pela seta e confere ONDE o foco caiu — nenhum passo foca item do
    // submenu à mão. Focar à mão fazia a play medir o próprio `focus()`, e o F5
    // promete que a SETA leva o foco ao primeiro item.
    const openByArrow = async () => {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('true');
        // Dois painéis abertos ao mesmo tempo: o pai continua no lugar, é o que
        // distingue submenu de troca de menu.
        await expect(body.getAllByRole('menu')).toHaveLength(2);
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(firstSubItem());
      });
    };

    await step('Seta Baixo alcança o sub-triggerBox; Seta Direita abre o submenu e leva o foco ao primeiro item', async () => {
      // Idempotente: só navega e abre quando ainda está fechado. No replay ele
      // já está aberto pela seta do último passo, com o foco onde ela o deixou.
      if (subTrigger.getAttribute('aria-expanded') !== 'true') {
        // Quantas setas até o sub-gatilho depende de onde a lib deixou o realce
        // ao abrir — cravar o número é o que quebra quando um item muda de
        // lugar. Anda até chegar, e falha se não chegar.
        const items = menu.querySelectorAll('[role="menuitem"]');
        for (let i = 0; i < items.length + 1; i++) {
          if (document.activeElement === subTrigger) break;
          await userEvent.keyboard('{ArrowDown}');
        }
        await waitFor(async () => {
          await expect(document.activeElement).toBe(subTrigger);
        });
        await openByArrow();
      }
      await waitFor(async () => {
        await expect(document.activeElement).toBe(firstSubItem());
      });
    });

    await step('O submenu traz os próprios itens, com o panelBox desenhado', async () => {
      const submenu = body.getAllByRole('menu').find((m) => m !== menu)!;
      await expect(within(submenu).getAllByRole('menuitem')).toHaveLength(EXPORTACOES.length);
      await expect(submenu.getAttribute('data-slot')).toBe('menubar-sub-content');
      // O painel do submenu tem que ser um painel: sem a classe compartilhada
      // ele saía transparente, flutuando sobre a página como texto solto — e
      // sem portal nascia DENTRO do painel do menu raiz, que rola.
      await expect(submenu.classList.contains('nds-dropdown-menu-content')).toBe(true);
      await expect(getComputedStyle(submenu).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      await expect(menu.contains(submenu)).toBe(false);
    });

    await step('D15 · o submenu encosta no sub-triggerBox e alinha o primeiro item com ele', async () => {
      const submenu = body.getAllByRole('menu').find((m) => m !== menu)!;
      const { deslocamentoDoItem, deslocamentoDaCaixa, vaoLateral } = await medirSubmenu(subTrigger, submenu);
      // D15 fixa o RESULTADO, não o número: o topo do PRIMEIRO ITEM do submenu
      // alinha com o topo do sub-gatilho que o abriu. Medir o ITEM, e não a
      // caixa, é o que dá dentes — uma asserção sobre o topo do painel passaria
      // com `alignOffset: 0`, que é o que a lib faria sozinha.
      //
      // Este é o painel em que o defeito de antes aparecia maior, e é o motivo
      // de a asserção ser de RESULTADO: sem `align="start"` a lib centra o
      // subpainel no gatilho, então o desvio depende da ALTURA do painel —
      // medido em 2026-09-19, −29,00 aqui (cinco formatos) contra −14,00 nos
      // painéis de dois itens do DropdownMenu e do ContextMenu. Com
      // `align="start"`: `alignOffset: -5` sai 0,00 e `-4` sai +1,00.
      //
      // **A tolerância é 0,75, e não 1**: os dois candidatos plausíveis (`-4` e
      // `-5`) ficam a exatamente 1px um do outro, e com tolerância de 1 a
      // asserção passaria com o `-4` plantado.
      await expect(Math.abs(deslocamentoDoItem)).toBeLessThanOrEqual(0.75);
      // `sideOffset: 0` encosta o subpainel no SUB-GATILHO — que é a âncora, e
      // não a borda do painel pai. Tem dentes: o vão acompanha o número
      // (0 → 0,00; 8 → 8,00).
      await expect(Math.abs(vaoLateral)).toBeLessThanOrEqual(1);
      // E o que a lib ANCORA é a CAIXA DE BORDA do painel: o topo dele sai
      // exatamente no `alignOffset`. É a premissa de onde o -5 vem — ele é
      // `−(borda + padding)` porque a lib não desconta nenhum dos dois. Se o
      // bits passar a descontar sozinho, como a reka faz (e aí o número vira
      // 0), este passo reprova e manda remedir, em vez de o desenho quebrar em
      // silêncio.
      await expect(Math.abs(deslocamentoDaCaixa + 5)).toBeLessThanOrEqual(0.75);
    });

    // Fecha só o submenu, e o menu da barra segue aberto: a prova é o painel
    // de cima ser o MESMO nó de antes, um quadro depois. Um painel fechado e
    // reaberto no meio passaria por "aberto" numa contagem.
    const onlyBarMenuStaysOpen = async () => {
      await waitFor(async () => {
        await expect(subTrigger.getAttribute('aria-expanded')).toBe('false');
        await expect(body.getAllByRole('menu')).toHaveLength(1);
      });
      await waitFor(async () => {
        await expect(document.activeElement).toBe(subTrigger);
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(body.getAllByRole('menu')).toHaveLength(1);
      await expect(body.getAllByRole('menu')[0]).toBe(menu);
      await expect(menu.isConnected).toBe(true);
    };

    await step('A seta para a esquerda fecha só o submenu e devolve o foco ao sub-triggerBox', async () => {
      // O foco está no submenu porque a SETA o levou até lá, no primeiro passo.
      await expect(document.activeElement).toBe(firstSubItem());
      await userEvent.keyboard('{ArrowLeft}');
      await onlyBarMenuStaysOpen();
    });

    await step('Escape no submenu fecha só o submenu e devolve o foco ao sub-triggerBox', async () => {
      // WAI-ARIA APG: Escape fecha o menu em que o foco está, e o de fora segue
      // aberto. O bits fechava o menu da barra junto — um nível de volta custava
      // os dois (ver `dropdown-menu/sub-escape.ts`). O foco volta ao submenu
      // pelo teclado: a seta parte do sub-gatilho, onde o passo anterior o deixou.
      await openByArrow();
      await userEvent.keyboard('{Escape}');
      await onlyBarMenuStaysOpen();
    });

    await step('A story termina com o submenu ABERTO', async () => {
      // `visual.item4` descreve o submenu aberto — é o que o Chromatic precisa
      // fotografar.
      await openByArrow();
    });
  },
};

// ─── WithCheckboxItems ────────────────────────────────────────────────────────

export const WithCheckboxItems: Story = {
  args: { defaultValue: 'view', demonstration: 'checkbox' },
  parameters: {
    covers: ['functional.item7', 'visual.item3'],
    docs: { source: { transform: menubarWithCheckboxSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const boxes = within(menu).getAllByRole('menuitemcheckbox');

    await step('Cada linha é uma caixa de seleção independente', async () => {
      await expect(boxes).toHaveLength(EXIBICOES.length);
      for (const box of boxes) {
        await expect(box.getAttribute('data-slot')).toBe('menubar-checkbox-item');
        await expect(box.getAttribute('aria-checked')).toBeTruthy();
      }
    });

    await step('O grupo tem nome, dado pelo próprio cabeçalho', async () => {
      // Nesta lib o cabeçalho vira o `aria-labelledby` do grupo — é o que faz o
      // leitor de tela anunciar "Mostrar na tela" antes das três caixas.
      const group = menu.querySelector<HTMLElement>('[data-slot="menubar-group"]')!;
      const labelledBy = group.getAttribute('aria-labelledby');
      await expect(labelledBy).toBeTruthy();
      await expect(document.getElementById(labelledBy!)?.textContent).toContain(
        'Mostrar na tela'
      );
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia: o menubar era,
      // com o context-menu, o único indicador do sistema sem endereço próprio.
      for (const box of boxes) {
        await expect(
          box.querySelector('[data-slot="menubar-checkbox-item-indicator"]')
        ).not.toBeNull();
      }
    });

    await step('Alternar reflete no estado anunciado e no marcador visual', async () => {
      const target = boxes[EXIBICOES.indexOf('Barra lateral')];
      // Idempotente: o clique só acontece com a caixa desmarcada, então o
      // replay do painel Interactions parte do mesmo estado da primeira rodada.
      if (target.getAttribute('aria-checked') !== 'true') await userEvent.click(target);
      await waitFor(async () => {
        await expect(target.getAttribute('aria-checked')).toBe('true');
        // `aria-checked` é o que a pessoa ouve; o tique é o que ela vê. Buscar
        // pelo `data-slot` prova de quebra que o atributo ficou no INVÓLUCRO do
        // marcador — se caísse no item ou no nó interno da lib, o tique não
        // estaria dentro dele.
        await expect(
          target.querySelector('[data-slot="menubar-checkbox-item-indicator"] svg')
        ).not.toBeNull();
      });
    });

    await step('Marcar não fecha o menu — quem marca uma quer marcar a próxima', async () => {
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
      const other = boxes[EXIBICOES.indexOf('Grade')];
      await expect(other.getAttribute('aria-checked')).toBe('false');
    });
  },
};

// ─── WithRadioGroup ───────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  args: { defaultValue: 'theme', demonstration: 'radio' },
  // F15: a escolha transfere a marcação e o menu segue aberto — o último passo
  // conta os menus DEPOIS do clique, em vez de ler uma referência antiga.
  parameters: {
    covers: ['functional.item15', 'accessibility.item5'],
    docs: { source: { transform: menubarWithRadioSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const options = within(menu).getAllByRole('menuitemradio');

    await step('O grupo publica escolha única, e só uma opção está marcada', async () => {
      await expect(options).toHaveLength(THEMES.length);
      await expect(options.filter((o) => o.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    });

    await step('O grupo de rádio tem NOME, dado pelo próprio rótulo', async () => {
      // Nesta lib o rótulo dentro do grupo vira o cabeçalho, e a lib escreve o
      // `id` dele no `aria-labelledby` — é o que faz o leitor de tela anunciar
      // "Tema" antes das três opções. Até 2026-09-18 quem nomeava era outra
      // peça, com outro `data-slot` (`menubar-group-heading`), e o `MenubarLabel`
      // era um `<div>` solto que não amarrava nada.
      //
      // O rótulo desta prévia é escrito com `GroupHeading`, o nome da lib que
      // esta stack também publica: ele DELEGA ao `Label`, e é por isso que o
      // endereço de markup conferido aqui é `menubar-label`.
      const radioGroup = menu.querySelector<HTMLElement>('[data-slot="menubar-radio-group"]')!;
      const labelledBy = radioGroup.getAttribute('aria-labelledby');
      await expect(labelledBy).toBeTruthy();
      const groupLabel = document.getElementById(labelledBy!)!;
      await expect(groupLabel.textContent).toContain('Tema');
      await expect(groupLabel.getAttribute('data-slot')).toBe('menubar-label');
      // Sem `role="group"` no rótulo: seria um bloco vazio dentro do bloco que
      // ele nomeia, e o leitor de tela anunciaria um grupo a mais.
      await expect(groupLabel.hasAttribute('role')).toBe(false);
      await expect(menu.querySelectorAll('[data-slot="menubar-group-heading"]')).toHaveLength(0);
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      for (const option of options) {
        await expect(
          option.querySelector('[data-slot="menubar-radio-item-indicator"]')
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      const marcada = options.find((o) => o.getAttribute('aria-checked') === 'true')!;
      await expect(
        marcada.querySelector('[data-slot="menubar-radio-item-indicator"] svg')
      ).not.toBeNull();
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
      // Escolher não fecha, como no vanilla e no react. A lib fecha por padrão, e
      // sem esta linha a story passava com o menu já fechado: a opção guarda o
      // último `aria-checked` mesmo fora do documento.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
    });
  },
};

// ─── EditorCompleto ───────────────────────────────────────────────────────────

export const EditorCompleto: Story = {
  args: { defaultValue: undefined, demonstration: 'editor' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');

    await step('As quatro categorias clássicas convivem na mesma barra', async () => {
      await expect(triggers).toHaveLength(MENUS_EDITOR.length);
      for (const [i, trigger] of triggers.entries()) {
        await expect(trigger).toHaveAccessibleName(MENUS_EDITOR[i]);
      }
    });

    await step('A barra é uma só parada de tabulação, com todos os menus fechados', async () => {
      await expect(triggers.filter((g) => g.tabIndex === 0)).toHaveLength(1);
      for (const trigger of triggers) {
        await expect(trigger.getAttribute('data-state')).toBe('closed');
      }
    });
  },
};
