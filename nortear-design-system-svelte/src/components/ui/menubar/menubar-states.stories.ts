import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { within, expect, fn, userEvent, waitFor } from 'storybook/test';
import { waitForPortal, FOCUS_RULE_GUARDA, axeRules } from '@/lib/wait-for-portal';
import MenubarStory from './MenubarStory.svelte';
import MenubarControlledStory from './MenubarControlledStory.svelte';
import {
  menubarSource,
  menubarControlledSource,
  menubarItemDisabledSource,
  menubarCheckboxCheckedSource,
  menubarCheckboxIndeterminateSource,
  menubarLongMenuSource,
} from './menubar.source';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

const MENUS_FECHADOS = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'];

const ITEMS_WITH_BLOCK = [
  { label: 'Novo', disabled: false },
  { label: 'Salvar', disabled: false },
  { label: 'Enviar para revisão', disabled: true },
];

// Espião de escopo de MÓDULO: criado dentro do `render` ele seria inalcançável
// pelo `play`, e a aba Actions abriria vazia.
const selectionSpy = fn();

const meta: Meta = {
  title: 'Components/Navigation/Menubar/States',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: menubarSource },
      description: {
        component:
          'Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, item bloqueado e item marcado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Closed ───────────────────────────────────────────────────────────────────
//
// A única story que termina sem nada portalizado — e por isso a única em que o
// axe roda com TODAS as regras. É aqui que "sem violações no estado padrão"
// vale de verdade.

export const Closed: Story = {
  args: { defaultValue: undefined, demonstration: 'default' },
  parameters: { covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'] },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');

    await step('A barra publica o papel e o marcador de composição', async () => {
      await expect(barra.getAttribute('data-slot')).toBe('menubar');
      await expect(triggers).toHaveLength(MENUS_FECHADOS.length);
    });

    await step('Fechado é ausência: nenhum painel existe no DOM', async () => {
      for (const trigger of triggers) {
        await expect(trigger.getAttribute('data-state')).toBe('closed');
        await expect(trigger.getAttribute('aria-expanded')).toBe('false');
      }
      // Portal desmontado, não escondido: um painel só oculto continuaria
      // sendo lido por leitor de tela e encontrável pela busca da página.
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
    });
  },
};

// ─── Open ─────────────────────────────────────────────────────────────────────

export const Open: Story = {
  args: { defaultValue: 'file', demonstration: 'default' },
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    covers: ['accessibility.item4'],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const [file, editar] = within(barra).getAllByRole('menuitem');
    const menu = await waitForPortal('menu');

    await step('O gatilho aberto se distingue dos vizinhos', async () => {
      await expect(file.getAttribute('data-state')).toBe('open');
      await expect(file.getAttribute('aria-expanded')).toBe('true');
      await expect(editar.getAttribute('data-state')).toBe('closed');
      // O realce do gatilho aberto é fundo, não só cor de texto: o CSS
      // compartilhado casa por `[data-state="open"]`.
      await expect(getComputedStyle(file).backgroundColor).not.toBe(
        getComputedStyle(editar).backgroundColor
      );
    });

    await step('O painel é um menu de verdade, ancorado abaixo do gatilho', async () => {
      await expect(menu.getAttribute('data-slot')).toBe('menubar-content');
      await waitFor(async () => {
        // O posicionador mede DEPOIS de o painel entrar no DOM: no primeiro
        // quadro o retângulo ainda é (0,0), e ler daí é corrida.
        const barRect = barra.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        await expect(menuRect.top).toBeGreaterThanOrEqual(barRect.bottom - 1);
      });
    });
  },
};

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  args: {
    defaultValue: 'file',
    demonstration: 'itemDisabled',
    onSelect: selectionSpy,
  },
  parameters: {
    covers: ['accessibility.item8'],
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: { source: { transform: menubarItemDisabledSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');
    const bloqueado = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled)];

    await step('O item bloqueado se anuncia como tal', async () => {
      await expect(items).toHaveLength(ITEMS_WITH_BLOCK.length);
      await expect(bloqueado.getAttribute('aria-disabled')).toBe('true');
      // `aria-disabled`, e não o atributo `disabled`: o item continua
      // alcançável pela seta, para ser ANUNCIADO como indisponível em vez de
      // sumir sem explicação de quem navega por teclado.
      await expect(bloqueado.hasAttribute('disabled')).toBe(false);
    });

    await step('O bloqueio é visível sem depender de cor', async () => {
      await expect(Number(getComputedStyle(bloqueado).opacity)).toBeLessThan(
        Number(getComputedStyle(items[0]).opacity)
      );
    });

    await step('A seta POUSA no item bloqueado', async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // O comentário do primeiro passo já dizia "continua alcançável pela seta",
      // e nada aqui apertava tecla nenhuma — `aria-disabled` sozinho não prova
      // percurso. Quem alinha esta stack é o patch de `patches/`: se ele parar
      // de aplicar, este passo é o primeiro a reprovar.
      const previous = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled) - 1];
      previous.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(bloqueado);
    });

    await step('Escolher o item bloqueado não executa nada', async () => {
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(selectionSpy).not.toHaveBeenCalledWith(bloqueado.textContent?.trim());
    });
  },
};

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  args: { defaultValue: 'view', demonstration: 'checkbox' },
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    covers: ['functional.item7'],
    docs: { source: { transform: menubarCheckboxCheckedSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const regua = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado inicial chega marcado ao markup', async () => {
      await expect(regua.getAttribute('aria-checked')).toBe('true');
      await expect(grid.getAttribute('aria-checked')).toBe('false');
    });

    await step('O marcado mostra o tique; o desmarcado, não', async () => {
      // O visual do estado não pode depender só de cor: o tique é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve.
      const tique = (item: HTMLElement) =>
        item.querySelector('.nds-dropdown-menu-item-indicator svg') !== null;
      await expect(tique(regua)).toBe(true);
      await expect(tique(grid)).toBe(false);
    });

    await step('Desmarcar o que estava marcado mantém o menu aberto', async () => {
      // Idempotente: o clique só acontece com a box ainda marcada.
      if (regua.getAttribute('aria-checked') !== 'false') await userEvent.click(regua);
      await waitFor(async () => {
        await expect(regua.getAttribute('aria-checked')).toBe('false');
      });
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(1);
    });
  },
};

// ─── CheckboxIndeterminate ────────────────────────────────────────────────────
//
// Story SEM interação, de propósito. O que ela declara vale na montagem, e o
// primeiro clique num item misto o resolve para marcado — uma play que clicasse
// aqui mediria outro estado no REPLAY do painel Interactions, que reexecuta no
// mesmo DOM. Sem clique, cada rodada mede exatamente o mesmo.

export const CheckboxIndeterminate: Story = {
  args: { defaultValue: 'view', demonstration: 'indeterminate' },
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    covers: ['functional.item9'],
    docs: { source: { transform: menubarCheckboxIndeterminateSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria o misto como verdadeiro; o que a pessoa ouve
      // tem que separar os três estados.
      await expect(misto.getAttribute('aria-checked')).toBe('mixed');
      await expect(checked.getAttribute('aria-checked')).toBe('true');
      await expect(desmarcado.getAttribute('aria-checked')).toBe('false');
    });

    await step('O misto desenha traço; o marcado, tique', async () => {
      // A medida é a GEOMETRIA do glifo, não o nome da classe nem o do ícone:
      // traço é largo e sem altura, tique tem a diagonal. Com o mesmo símbolo
      // nos dois estados — o defeito — esta asserção fica vermelha.
      const formaMista = formaDoIndicador(misto);
      const formaMarcada = formaDoIndicador(checked);
      await expect(ehTraco(formaMista)).toBe(true);
      await expect(ehTique(formaMista)).toBe(false);
      await expect(ehTique(formaMarcada)).toBe(true);
    });

    await step('O desmarcado continua sem glifo nenhum', async () => {
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};

// ─── ControlledOpen ───────────────────────────────────────────────────────────
//
// A barra CONTROLADA: quem consome guarda a abertura, e a barra obedece.
//
// Nesta lib o estado é da RAIZ, não de cada menu: `bind:value` guarda o `value`
// do menu aberto, e string vazia é a barra inteira fechada. Controlar um menu
// só, deixando os vizinhos de fora, não existe aqui — a divergência é de API de
// framework, e fica registrada em vez de "alinhada". É a forma que
// `props.extensibilityCode` ensina, e até aqui nenhuma story a exercitava.
//
// A story prova os DOIS sentidos, e o segundo é o que importa. Barra controlada
// sem o caminho de volta abre e nunca mais fecha, porque a lib PEDE o fechamento
// e não há quem atenda — armadilha de teclado, WCAG 2.1.2. Por isso o último
// passo aperta Escape e cobra que o painel suma E que o estado externo tenha
// acompanhado.

const CONTROLLED_ITEMS = ['Novo', 'Abrir'];

// O tipo sai do padrão do arquivo de propósito: o componente desta story não
// recebe props, e o `Args` genérico do `Story` não é atribuível a
// `Record<string, never>`. Mesma saída já adotada no accordion desta stack.
export const ControlledOpen: StoryObj<Record<string, never>> = {
  parameters: {
    // Sem `args` próprios: sem isto o painel Controls abre vazio e a aba
    // Actions lista espião que esta story não usa.
    controls: { disable: true },
    actions: { disable: true },
    // A barra do meta sai dos `args`, que esta story não tem; o `bind:value` é
    // justamente o que ela ensina.
    docs: { source: { transform: menubarControlledSource } },
  },
  render: () => ({ Component: MenubarControlledStory }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const externalControl = canvas.getByTestId('external-open');
    const readout = canvas.getByTestId('external-state');
    const barra = canvas.getByRole('menubar');
    const [file] = within(barra).getAllByRole('menuitem');

    // O painel Interactions reexecuta a `play` no MESMO DOM, sem remontar: este
    // passo não SUPÕE o estado inicial, ele o estabelece.
    await step('Precondição: o estado externo começa fechado', async () => {
      if (readout.textContent?.trim() !== 'fechado') {
        await userEvent.keyboard('{Escape}');
      }
      await waitFor(async () => {
        await expect(readout.textContent?.trim()).toBe('fechado');
      });
      await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
    });

    await step('Quem abre o menu é o estado externo, não o gatilho', async () => {
      await userEvent.click(externalControl);
      const menu = await waitForPortal('menu');
      await expect(readout.textContent?.trim()).toBe('aberto');
      await expect(file.getAttribute('aria-expanded')).toBe('true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(CONTROLLED_ITEMS.length);
    });

    await step('Fechar pelo teclado devolve a mudança ao estado externo', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        // Leitura PURA dentro do `waitFor`: sonda que mexe no DOM reagenda a si
        // mesma pelo observador de mutação e pendura a aba sem reprovar.
        await expect(within(document.body).queryAllByRole('menu')).toHaveLength(0);
      });
      // O caminho de volta é o que separa "controlado" de armadilha de teclado:
      // sem ele o estado externo continuaria dizendo "aberto" — e o painel nem
      // teria saído do DOM.
      await expect(readout.textContent?.trim()).toBe('fechado');
      await expect(file.getAttribute('aria-expanded')).toBe('false');
    });
  },
};

// ─── LongMenu ─────────────────────────────────────────────────────────────────
//
// D17 · O painel de menu ROLA, e a exceção do axe é DECLARADA.
//
// Decisão da dona em 2026-09-18, sobre medição: um menu mais alto que a janela
// recorta na viewport e rola. A saída oposta — `overflow: visible` nas cinco —
// foi recusada com o motivo: trocaria um achado de ferramenta por um defeito
// real, um menu longo transbordando a viewport com parte dele inalcançável por
// qualquer meio.
//
// O QUE MUDOU NESTA STACK, e é por isso que a story nasce aqui: até 2026-09-18
// a cadeia de `max-height` de `.nds-dropdown-menu-content` não tinha degrau
// `--bits-*` nem literal no fim — ela era INVÁLIDA no svelte, `max-height`
// computava `none`, e os painéis dos TRÊS membros nunca recortavam (medido:
// 1748px de painel numa janela de 900). Com a cadeia consertada, o painel
// recorta em `24rem` e rola. Esta story é a asserção que cobre isso.

/**
 * A regra do axe que o painel rolável dispara, DESLIGADA COM MOTIVO, com a
 * premissa virando asserção e com a INÉRCIA medida — nunca `a11y.test: 'todo'`.
 *
 * `scrollable-region-focusable` cobra que uma região com rolagem seja
 * alcançável por teclado, e mede isso procurando conteúdo TABULÁVEL dentro do
 * container. Um menu WAI-ARIA não tem: quem anda é o foco ITINERANTE, conduzido
 * pelas setas. A ferramenta não enxerga foco itinerante — o painel É operável
 * por teclado, e é justamente por ser operável assim que ela o acusa.
 *
 * **E aqui ela acusa de verdade, o que NÃO é igual em todas as stacks.** Medido
 * em 2026-09-18, plantando e restaurando na mesma chamada: com esta linha
 * retirada a story reprova com
 * `Scrollable region must have keyboard access (scrollable-region-focusable)`
 * no `#nds-menubar-content-*`. Sem exceção NENHUMA ligada, essa é a única
 * violação que sai — então a exceção desliga exatamente uma coisa, e é esta.
 *
 * O mecanismo é da lib, e é o que separa esta stack da do React: o
 * `MenuItemSharedState` do bits crava `tabindex: -1` nas `props` do item, FIXO,
 * sem depender de destaque (`bits-ui/dist/bits/menu/menu.svelte.js`). Todos os
 * sessenta itens ficam em `-1` o tempo todo, o painel também, e o container não
 * tem um único tabulável dentro. A base-ui do React faz o contrário — dá `0` ao
 * item destacado —, e lá a mesma exceção seria INERTE. Sonda desta story, com o
 * painel aberto: `tabindex=["-1"] destacados=0 painel="-1" focaveis=0`.
 *
 * O que substitui a regra desligada é a PREMISSA dela, afirmada no play abaixo:
 * navegar por seta num menu longo traz o item focado para dentro da caixa
 * visível. Se a rolagem deixar de acompanhar o foco, o passo reprova — que é a
 * coisa que `scrollable-region-focusable` protegeria aqui.
 */
const MENU_ROLAVEL_GUARDA = { id: 'scrollable-region-focusable', enabled: false } as const;

export const LongMenu: Story = {
  args: { defaultValue: 'file', demonstration: 'long' },
  parameters: {
    // SEM `FOCUS_RULE_GUARDA`, e a ausência é medida: as outras stories deste
    // arquivo o declaram, mas em 2026-09-18 ele foi medido INERTE nas cinco —
    // tirando-o dos dez pontos do Menubar e dos seis do ContextMenu, as suítes
    // dos três membros fecham iguais (menubar 17/17, context 12/12; o
    // DropdownMenu nem o usa). Exceção que não desliga nada é portão sem dentes
    // com cara de cobertura, então esta story não a herda. A dívida das outras
    // quatro stories fica RELATADA, não varrida por conta própria.
    a11y: { config: { rules: axeRules(MENU_ROLAVEL_GUARDA) } },
    docs: { source: { transform: menubarLongMenuSource } },
  },
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const items = within(menu).getAllByRole('menuitem');

    await step('O painel RECORTA na janela em vez de crescer sem fim', async () => {
      // As duas metades, e a segunda é a que tinha o defeito: a folha declara
      // `overflow-y: auto`, mas com `max-height: none` não havia o que recortar
      // — o painel media a lista inteira e saía por baixo da janela. Comparar
      // a altura do painel com a da lista é o que separa "rola" de "cabe".
      await expect(items.length).toBeGreaterThan(10);
      await expect(getComputedStyle(menu).overflowY).toBe('auto');
      // A PREMISSA da exceção do axe, afirmada: não há UM tabulável dentro do
      // painel. O bits crava `tabindex: -1` no item, fixo, sem depender de
      // destaque — se um bump passar a dar `0` ao item destacado (que é o que a
      // base-ui do React faz), a regra do axe passa sozinha, a exceção lá em
      // cima vira inerte, e é esta linha que avisa em vez de a cobertura sumir
      // em silêncio.
      await expect([...new Set(items.map((i) => i.getAttribute('tabindex')))]).toEqual(['-1']);
      await expect(menu.querySelectorAll('[tabindex="0"]')).toHaveLength(0);
      await expect(menu.scrollHeight).toBeGreaterThan(menu.clientHeight);
      await expect(menu.getBoundingClientRect().height).toBeLessThanOrEqual(
        window.innerHeight,
      );
    });

    await step('A seta traz o item focado para DENTRO da caixa visível', async () => {
      // É a premissa da exceção do axe, e é ela que vira asserção: o painel é
      // operável por teclado porque a rolagem ACOMPANHA o foco itinerante. Sem
      // isso o item focado ficaria fora da caixa e ninguém veria onde está.
      //
      // Parte do primeiro item e anda até o último com a seta — nenhum
      // `focus()` à mão, que mediria o `scrollIntoView` do navegador em vez do
      // percurso do teclado.
      items[0].focus();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });

      await userEvent.keyboard('{End}');
      const lastItem = items[items.length - 1];
      await waitFor(async () => {
        await expect(document.activeElement).toBe(lastItem);
      });

      // Leitura PURA dentro do `waitFor`: as caixas são lidas, nada é escrito
      // no DOM — sonda que mexe no DOM reagenda a si mesma pelo observador de
      // mutação e pendura a aba sem reprovar.
      await waitFor(async () => {
        const box = menu.getBoundingClientRect();
        const target = lastItem.getBoundingClientRect();
        await expect(target.top).toBeGreaterThanOrEqual(box.top - 1);
        await expect(target.bottom).toBeLessThanOrEqual(box.bottom + 1);
      });

      // E a volta: Home traz o primeiro de novo, com a rolagem no topo. Só o
      // End provaria metade — um painel que rolasse e nunca voltasse passaria.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(items[0]);
      });
      await waitFor(async () => {
        const box = menu.getBoundingClientRect();
        const target = items[0].getBoundingClientRect();
        await expect(target.top).toBeGreaterThanOrEqual(box.top - 1);
        await expect(target.bottom).toBeLessThanOrEqual(box.bottom + 1);
      });
    });
  },
};
