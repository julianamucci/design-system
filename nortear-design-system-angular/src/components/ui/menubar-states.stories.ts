import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import { NDS_MENUBAR } from './menubar';
import {
  menubarCheckboxCheckedSource,
  menubarCheckboxIndeterminateSource,
  menubarClosedSource,
  menubarControlledSource,
  menubarItemDisabledSource,
  menubarLongMenuSource,
  menubarOpenSource,
  LONG_MENU_ITEMS,
  LONG_MENU_LABELS,
} from './menubar.source';
import { waitForPortal, FOCUS_RULE_GUARDA, axeRules } from '@/lib/wait-for-portal';
import { formaDoIndicador, ehTraco, ehTique } from '@shared/testing/menu-checkbox-indicator';

const MENUS_FECHADOS = ['Arquivo', 'Editar', 'Exibir', 'Ajuda'] as const;

const ITEMS_WITH_BLOCK = [
  { label: 'Novo', disabled: false },
  { label: 'Salvar', disabled: false },
  { label: 'Enviar para revisão', disabled: true },
] as const;

const meta: Meta = {
  title: 'Components/Navigation/Menubar/States',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_MENUBAR] })],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Os quatro estados que o conteúdo compartilhado descreve: barra fechada, menu aberto, ' +
          'item bloqueado e item marcado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Closed ───────────────────────────────────────────────────────────────────
//
// A única story que termina sem nada portalizado — e por isso a única em que o
// axe roda com TODAS as regras, inclusive a das âncoras de foco que o resto da
// família precisa desligar. É aqui que "sem violações no estado padrão" vale.

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item2', 'visual.item1'],
    docs: { source: { transform: menubarClosedSource } },
  },
  render: () => ({
    props: { menus: MENUS_FECHADOS },
    template: `
      <nds-menubar>
        @for (m of menus; track m) {
          <nds-menubar-menu>
            <button ndsMenubarTrigger>{{ m }}</button>
            <ng-template ndsMenubarContent>
              <div ndsMenubarItem>{{ m }} — primeira ação</div>
              <div ndsMenubarItem>{{ m }} — segunda ação</div>
            </ng-template>
          </nds-menubar-menu>
        }
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('menubar');
    const triggers = within(barra).getAllByRole('menuitem');

    await step('A barra publica o papel e a orientação', async () => {
      await expect(barra.getAttribute('data-slot')).toBe('menubar');
      await expect(barra.getAttribute('aria-orientation')).toBe('horizontal');
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
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    // Sem `functional.item3` aqui: este item do contrato fala de ABRIR por
    // teclado, e esta story nasce aberta por `defaultOpen`, sem interação
    // nenhuma. A declaração era honesta na intenção e vazia no efeito.
    covers: ['accessibility.item4'],
    docs: { source: { transform: menubarOpenSource } },
  },
  render: () => ({
    props: { menus: MENUS_FECHADOS },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarItem>Novo</div>
            <div ndsMenubarItem>Abrir</div>
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
      await expect(getComputedStyle(file).backgroundColor)
        .not.toBe(getComputedStyle(editar).backgroundColor);
    });

    await step('O painel é um menu de verdade, ancorado abaixo do gatilho', async () => {
      await expect(menu.getAttribute('data-slot')).toBe('menubar-content');
      await waitFor(async () => {
        // O positioner mede DEPOIS de o painel entrar no DOM: no primeiro
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
  parameters: {
    covers: ['accessibility.item8'],
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    docs: { source: { transform: menubarItemDisabledSource } },
  },
  argTypes: {
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(onSelect)` ficaria ligado a nada, sem erro nenhum.
    onSelect: { control: false, table: { disable: true } },
  },
  args: { onSelect: fn() },
  render: (args) => ({
    props: { ...args, items: ITEMS_WITH_BLOCK },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Arquivo</button>
          <ng-template ndsMenubarContent>
            @for (i of items; track i.label) {
              <div ndsMenubarItem [disabled]="i.disabled" (onSelect)="onSelect(i.label)">
                {{ i.label }}
              </div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step, args }) => {
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
      const livre = items[0];
      await expect(Number(getComputedStyle(bloqueado).opacity))
        .toBeLessThan(Number(getComputedStyle(livre).opacity));
    });

    await step('A seta POUSA no item bloqueado', async () => {
      // Decisão de 2026-09-02, nas cinco stacks: o item desabilitado continua no
      // percurso das setas para ser ANUNCIADO como indisponível. Some-lo da roda
      // esconderia de quem navega de ouvido que a opção existe.
      //
      // O comentário do primeiro passo já dizia "continua alcançável pela seta",
      // e nada aqui apertava tecla nenhuma — `aria-disabled` sozinho não prova
      // percurso. Este passo é quem cobra a promessa.
      const previous = items[ITEMS_WITH_BLOCK.findIndex((i) => i.disabled) - 1];
      previous.focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(bloqueado);
    });

    await step('Escolher o item bloqueado não executa nada', async () => {
      await userEvent.click(bloqueado, { pointerEventsCheck: 0 });
      await expect(args['onSelect']).not.toHaveBeenCalledWith(bloqueado.textContent?.trim());
    });
  },
};

// ─── CheckboxChecked ──────────────────────────────────────────────────────────

export const CheckboxChecked: Story = {
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    covers: ['functional.item7'],
    docs: { source: { transform: menubarCheckboxCheckedSource } },
  },
  render: () => ({
    props: { regua: true, grid: false },
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Exibir</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>Mostrar na tela</div>
            <div
              ndsMenubarCheckboxItem
              [checked]="regua"
              (checkedChange)="regua = $event"
            >Régua</div>
            <div
              ndsMenubarCheckboxItem
              [checked]="grid"
              (checkedChange)="grid = $event"
            >Grade</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const regua = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const grid = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado inicial chega marcado ao markup', async () => {
      // Afirmar o resultado do input é o que impede o defeito silencioso do
      // fallback JIT, em que `[checked]="true"` é ignorado sem erro nenhum.
      await expect(regua.getAttribute('aria-checked')).toBe('true');
      await expect(grid.getAttribute('aria-checked')).toBe('false');
    });

    await step('O marcado mostra o tique; o desmarcado, não', async () => {
      // O visual do estado não pode depender só de cor: o tique é o que a
      // pessoa vê, e o `aria-checked` é o que ela ouve. O indicador fica no DOM
      // nos dois casos (é assim que a lib deixa a animação de saída possível) —
      // o que muda é o `display`, então é ele que a asserção olha.
      const marca = (item: HTMLElement) =>
        getComputedStyle(item.querySelector<HTMLElement>('[rdxmenucheckboxitemindicator]')!).display;
      await expect(marca(regua)).not.toBe('none');
      await expect(marca(grid)).toBe('none');
    });

    await step('Desmarcar o que estava marcado mantém o menu aberto', async () => {
      if (regua.getAttribute('aria-checked') !== 'false') await userEvent.click(regua);
      await waitFor(async () => {
        await expect(regua.getAttribute('aria-checked')).toBe('false');
      });
      await expect(document.body.contains(menu)).toBe(true);
      // E o documento o confirma: UM menu, sem a marca de fechado. A referência
      // capturada antes do clique sozinha passaria durante a animação de saída.
      const menus = within(document.body).queryAllByRole('menu');
      await expect(menus).toHaveLength(1);
      await expect(menus[0].hasAttribute('data-closed')).toBe(false);
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
  parameters: {
    a11y: { config: { rules: axeRules(FOCUS_RULE_GUARDA) } },
    covers: ['functional.item9'],
    docs: { source: { transform: menubarCheckboxIndeterminateSource } },
  },
  render: () => ({
    template: `
      <nds-menubar [modal]="false">
        <nds-menubar-menu [defaultOpen]="true">
          <button ndsMenubarTrigger>Exibir</button>
          <ng-template ndsMenubarContent>
            <div ndsMenubarLabel>Mostrar na tela</div>
            <div ndsMenubarCheckboxItem [checked]="'indeterminate'">Colunas</div>
            <div ndsMenubarCheckboxItem [checked]="true">Régua</div>
            <div ndsMenubarCheckboxItem [checked]="false">Grade</div>
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ step }) => {
    const menu = await waitForPortal('menu');
    const canvas = within(menu);
    const misto = canvas.getByRole('menuitemcheckbox', { name: 'Colunas' });
    const checked = canvas.getByRole('menuitemcheckbox', { name: 'Régua' });
    const desmarcado = canvas.getByRole('menuitemcheckbox', { name: 'Grade' });

    await step('O estado misto é anunciado como misto, e não como marcado', async () => {
      // Uma comparação frouxa leria `'indeterminate'` como verdadeiro; o que a
      // pessoa ouve tem que separar os três estados.
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

    await step('O desmarcado não mostra glifo nenhum', async () => {
      // Aqui o indicador CONTINUA montado (é assim que a lib deixa possível uma
      // animação de saída) e some por `display: none`. Sem caixa de layout o
      // `getBBox` devolve tudo zerado, que é o que o colhedor lê como
      // "sem glifo" — a asserção mede o que a pessoa vê, não o que existe.
      await expect(formaDoIndicador(desmarcado)).toBeNull();
    });
  },
};

// ─── ControlledOpen ───────────────────────────────────────────────────────────
//
// O menu CONTROLADO: quem consome guarda a abertura, e a barra obedece.
//
// Nesta stack o par mora no MENU, não na barra — o primitivo publica `open` como
// modelo, então a entrada é `[open]` e a saída, `(openChange)`. É isso que
// permite controlar um menu deixando os vizinhos se governarem sozinhos, e é a
// forma que `props.extensibilityCode` ensina; até aqui nenhuma story a
// exercitava.
//
// A story prova os DOIS sentidos, e o segundo é o que importa. Menu controlado
// sem o retorno ligado abre e nunca mais fecha, porque o primitivo PEDE o
// fechamento e não há quem atenda — armadilha de teclado, WCAG 2.1.2. Por isso o
// último passo aperta Escape e cobra que o painel suma E que o estado externo
// tenha acompanhado.

const CONTROLLED_ITEMS = ['Novo', 'Abrir'] as const;

export const ControlledOpen: Story = {
  parameters: {
    // Sem `args` próprios: sem isto o painel Controls abre vazio e a aba
    // Actions lista espião que esta story não usa.
    controls: { disable: true },
    actions: { disable: true },
    // A story guarda a abertura num campo comum do objeto de props do
    // renderer; o snippet guarda num sinal, que é o que agenda o redesenho num
    // componente de verdade.
    docs: { source: { transform: menubarControlledSource } },
  },
  render: () => ({
    // O estado vive AQUI, fora da barra — é esse o assunto da story.
    props: { open: false, items: CONTROLLED_ITEMS },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <div class="nds-cluster" data-align="center">
          <button
            type="button"
            class="nds-button nds-button-outline nds-button-sm"
            data-testid="external-open"
            (click)="open = true"
          >
            Abrir Arquivo
          </button>
          <span data-testid="external-state">{{ open ? 'aberto' : 'fechado' }}</span>
        </div>

        <nds-menubar [modal]="false">
          <nds-menubar-menu [open]="open" (openChange)="open = $event">
            <button ndsMenubarTrigger>Arquivo</button>
            <ng-template ndsMenubarContent>
              @for (item of items; track item) {
                <div ndsMenubarItem>{{ item }}</div>
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
      </div>
    `,
  }),
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
      // O retorno ligado é o que separa "controlado" de armadilha de teclado:
      // sem ele o estado externo continuaria dizendo "aberto" — e o painel nem
      // teria saído do DOM.
      await expect(readout.textContent?.trim()).toBe('fechado');
      await expect(file.getAttribute('aria-expanded')).toBe('false');
    });
  },
};

// ─── LongMenu ─────────────────────────────────────────────────────────────────
//
// O painel de menu RECORTA na viewport e ROLA (D17 do PRD do dropdown-menu,
// fixada em 2026-09-18 sobre medição). A decisão veio com uma premissa, e esta
// story é a premissa virada asserção: **navegar por seta num menu longo traz o
// item focado para dentro da caixa visível**.
//
// A saída oposta — `overflow: visible` nas cinco — foi recusada com o motivo:
// trocaria um achado de ferramenta por um defeito real, um menu longo
// transbordando a viewport com parte dele inalcançável por qualquer meio.
//
// SOBRE O `scrollable-region-focusable` DO AXE, e por que aqui não há exceção a
// declarar. A regra pede que região rolável seja alcançável pelo teclado, e o
// que ela procura é conteúdo TABULÁVEL dentro dela. O menu deste stack tem: o
// primitivo implementa foco ITINERANTE — `tabindex="0"` no item destacado e
// `-1` em todos os outros —, que é o que a WAI-ARIA APG pede de um menu. O
// segundo passo MEDE isso, em vez de supô-lo: se um dia a lib passar a marcar
// todos os itens com `-1`, este caso reprova e a exceção do axe passa a ser
// necessária — em vez de o achado aparecer sem ninguém entender por quê.

export const LongMenu: Story = {
  parameters: {
    // `item10` é Home/End saltando às pontas — aqui o End é o gesto que leva o
    // foco ao item fora da caixa visível, que é o assunto da story.
    covers: ['functional.item10'],
    docs: { source: { transform: menubarLongMenuSource } },
  },
  render: () => ({
    props: { actions: LONG_MENU_LABELS },
    template: `
      <nds-menubar>
        <nds-menubar-menu>
          <button ndsMenubarTrigger>Ações</button>
          <ng-template ndsMenubarContent>
            @for (action of actions; track action) {
              <div ndsMenubarItem>{{ action }}</div>
            }
          </ng-template>
        </nds-menubar-menu>
      </nds-menubar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('menubar');
    const [trigger] = within(bar).getAllByRole('menuitem');

    let panel!: HTMLElement;

    /** O item focado está dentro da caixa visível do painel? */
    const focusedIsInsideBox = async () => {
      const box = panel.getBoundingClientRect();
      const focused = (document.activeElement as HTMLElement).getBoundingClientRect();
      await expect(focused.top).toBeGreaterThanOrEqual(Math.floor(box.top));
      await expect(focused.bottom).toBeLessThanOrEqual(Math.ceil(box.bottom));
    };

    await step('Precondição: o painel não cabe na tela e RECORTA', async () => {
      if (trigger!.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger!);
      panel = await waitForPortal('menu');
      await expect(within(panel).getAllByRole('menuitem')).toHaveLength(LONG_MENU_ITEMS);

      // Sem esta conferência a story mediria um menu que COUBE — e passaria
      // verde sem exercer o recorte, que é o assunto dela. O `max-height` vem
      // da folha, pela altura disponível; `overflow-y: auto` é o que rola.
      await expect(window.getComputedStyle(panel).overflowY).toBe('auto');
      await expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
    });

    await step('O foco é ITINERANTE: um item tabulável por vez, -1 nos demais', async () => {
      const options = within(panel).getAllByRole('menuitem');
      options[0]!.focus();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(options[0]);
      });

      // UM item na roda de tabulação, e ele é o que tem o foco. É o padrão ARIA
      // de menu — e é ele, e não `tabindex="0"` em toda parte, que mantém o
      // painel rolável alcançável pelo teclado.
      //
      // Dentro do `waitFor` só LEITURA: o atributo sai de um binding, e a
      // detecção de mudança que o escreve roda depois do `focus()`. Sonda que
      // MEXE no DOM aqui reagendaria a si mesma pelo observador de mutação e
      // penduraria o arquivo inteiro, sem reprovar.
      await waitFor(async () => {
        const tabbable = options.filter((o) => o.getAttribute('tabindex') === '0');
        const outsideTabOrder = options.filter((o) => o.getAttribute('tabindex') !== '-1');
        await expect(tabbable).toHaveLength(1);
        await expect(tabbable[0]).toBe(document.activeElement);
        await expect(outsideTabOrder).toEqual(tabbable);
      });
    });

    await step('A seta leva o foco ao item que rolou para fora, e ele entra na caixa', async () => {
      const options = within(panel).getAllByRole('menuitem');
      const tail = options[options.length - 1]!;

      // `End` vai à ponta (C3) — o gesto mais curto até um item que com certeza
      // está fora da caixa visível.
      await userEvent.keyboard('{End}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(tail);
      });

      // A premissa da D17, medida. Sem a rolagem automática o foco estaria num
      // item que a pessoa não vê — o defeito real que `overflow: visible`
      // traria de volta em troca do achado de ferramenta.
      await waitFor(focusedIsInsideBox);
      // E a caixa rolou de verdade: no topo, `scrollTop` é 0.
      await expect(panel.scrollTop).toBeGreaterThan(0);

      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(options[0]);
      });
      await waitFor(focusedIsInsideBox);
    });
  },
};
