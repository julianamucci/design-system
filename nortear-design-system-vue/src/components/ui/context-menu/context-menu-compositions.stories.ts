import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { ref } from 'vue';
import { axeRules, FOCUS_RULE_GUARDA, waitForPortal } from '@/lib/wait-for-portal';
import { AREA_CLICK_DIREITO, gestoOpen, menuOpen } from '@shared/testing/context-menu-area';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';
import {
  contextMenuSource,
  contextMenuWithShortcutsSource,
  contextMenuWithRadioGroupSource,
  contextMenuWithCheckboxSource,
  contextMenuWithSubmenuSource,
  contextMenuCompletoSource,
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
      // O padrão do arquivo é a forma CANÔNICA do menu, e não o snippet de uma
      // composição: cada story declara a sua logo abaixo. Com `WithShortcuts`
      // no `meta`, toda story nova herdava em silêncio o painel Code de um menu
      // de atalhos que ela não desenha. Vanilla e Svelte já usam a canônica.
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

const componentes = {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuLabel,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuShortcut,
};

const target = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;

/**
 * Os ids de `aria-labelledby` do menu que não apontam para elemento nenhum.
 *
 * A lib escreve `aria-labelledby` em TODO grupo, com o id do grupo; quem o
 * realiza é o rótulo que mora dentro dele. Grupo sem rótulo, ou rótulo que pega
 * o id de outro grupo, deixa a referência pendurada — e o leitor de tela resolve
 * o nome em nada, sem erro nenhum na tela.
 */
function danglingLabelledby(menu: HTMLElement): string[] {
  return [menu, ...menu.querySelectorAll<HTMLElement>('[aria-labelledby]')]
    .flatMap((el) => (el.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean))
    .filter((id) => !document.getElementById(id));
}

/** Os grupos entre o item e o painel, do mais próximo ao mais distante. */
function groupsAround(item: HTMLElement, menu: HTMLElement): HTMLElement[] {
  const groups: HTMLElement[] = [];
  for (let node = item.parentElement; node && node !== menu; node = node.parentElement) {
    if (node.getAttribute('role') === 'group') groups.push(node);
  }
  return groups;
}

// ── Com atalhos ───────────────────────────────────────────────────────────────

export const WithShortcut: Story = {
  parameters: {
    covers: ['functional.item17'],
    // A story mostra três atalhos e nenhum grupo; a forma canônica do `meta`
    // publica "Duplicar" sem atalho. Declarada aqui, e não herdada do `meta`,
    // para que a fiação viva ao lado do preview que ela publica.
    docs: { source: { transform: contextMenuWithShortcutsSource } },
  },
  render: () => ({
    components: componentes,
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem data-testid="editar">
            Editar
            <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Desfazer
            <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            Excluir
            <ContextMenuShortcut>Delete</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O atalho vive dentro do item e é lido junto dele', async () => {
      const menu = await gestoOpen(area());
      const shortcuts = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-shortcut"]');
      await expect(shortcuts.length).toBe(3);
      for (const atalho of shortcuts) {
        await expect(atalho.hasAttribute('aria-hidden')).toBe(false);
        await expect(atalho.closest('[data-slot="context-menu-item"]')).not.toBeNull();
      }
      // E integra o NOME acessível (F17): "Editar Ctrl+E" é o que o leitor
      // anuncia, e é o que ensina a tecla a quem não enxerga a coluna.
      await expect(target('editar')).toHaveAccessibleName('Editar Ctrl+E');
    });

    await step('O atalho fica encostado à direita do rótulo', async () => {
      // É o alinhamento que faz a coluna de atalhos existir; sem ele o texto
      // sai colado no rótulo e a leitura visual se perde.
      const item = target('editar').getBoundingClientRect();
      const atalho = target('editar')
        .querySelector<HTMLElement>('[data-slot="context-menu-shortcut"]')!
        .getBoundingClientRect();
      await expect(item.right - atalho.right).toBeLessThan(16);
    });
  },
};

// ── Com marcação ──────────────────────────────────────────────────────────────

export const WithCheckbox: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item4'],
    // A marcação exige estado ligado por `v-model:checked` — um `ref` no script,
    // que o snippet do meta (só itens de ação) não tem.
    docs: { source: { transform: contextMenuWithCheckboxSource } },
  },
  render: () => ({
    components: componentes,
    setup() {
      const grid = ref(false);
      const reguas = ref(true);
      return { grid, reguas };
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>Visualização</ContextMenuLabel>
            <ContextMenuCheckboxItem :checked="grid" @update:checked="grid = $event" data-testid="grade">
              Mostrar grade
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem :checked="reguas" @update:checked="reguas = $event" data-testid="reguas">
              Mostrar réguas
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que tipo de escolha o item é', async () => {
      await gestoOpen(area());
      await expect(target('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('reguas').getAttribute('aria-checked')).toBe('true');
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // `data-slot` é o endereço de markup que as cinco stacks compartilham, e
      // o do indicador é por TIPO de item. Aqui ele não existia.
      await gestoOpen(area());
      for (const id of ['grade', 'reguas']) {
        await expect(
          target(id).querySelector('[data-slot="context-menu-checkbox-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro, e não no item nem no nó que a lib injeta.
      await expect(
        target('reguas').querySelector(
          '[data-slot="context-menu-checkbox-item-indicator"] svg',
        ),
      ).not.toBeNull();
    });

    await step('O rótulo NOMEIA o grupo das marcações', async () => {
      // O que prova a ligação é o grupo ter o nome do rótulo e conter os itens
      // — não a presença do rótulo.
      const menu = await gestoOpen(area());
      const group = within(menu).getByRole('group', { name: 'Visualização' });
      await expect(group.contains(target('grade'))).toBe(true);
      await expect(group.contains(target('reguas'))).toBe(true);
      await expect(danglingLabelledby(menu)).toEqual([]);
    });

    await step('Marcar alterna o estado anunciado e o indicador, e o menu segue aberto', async () => {
      // Lê o estado ANTES de clicar: no replay a story parte do que a rodada
      // anterior deixou, e um valor esperado fixo inverteria o resultado.
      const antes = target('grade').getAttribute('aria-checked');
      const esperado = antes === 'true' ? 'false' : 'true';
      const panel = menuOpen();
      await userEvent.click(target('grade'));
      await waitFor(() =>
        expect(target('grade').getAttribute('aria-checked')).toBe(esperado),
      );
      await expect(!!target('grade').querySelector('svg')).toBe(esperado === 'true');
      // Alternar NÃO fecha. A lib decide fechar numa microtarefa DEPOIS de
      // entregar a escolha, e sem animação de saída (D5) o painel sai do DOM na
      // hora — então um quadro inteiro depois da troca de estado não é janela
      // de tempo: é o ponto em que a decisão já foi tomada. O MESMO nó: um
      // painel fechado e reaberto no meio passaria por "aberto".
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(menuOpen()).toBe(panel);
      await expect(panel?.isConnected).toBe(true);
    });
  },
};

// ── Com escolha única ─────────────────────────────────────────────────────────

export const WithRadioGroup: Story = {
  parameters: {
    covers: ['functional.item8', 'accessibility.item5'],
    // Na escolha única o valor vive no GRUPO, não em cada item: outra peça e
    // outro estado.
    docs: { source: { transform: contextMenuWithRadioGroupSource } },
  },
  render: () => ({
    components: componentes,
    setup() {
      const layout = ref('grid');
      return { layout };
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuRadioGroup :model-value="layout" @update:model-value="layout = $event">
            <ContextMenuLabel>Layout</ContextMenuLabel>
            <ContextMenuRadioItem value="grid" data-testid="grid">Grade</ContextMenuRadioItem>
            <ContextMenuRadioItem value="list" data-testid="list">Lista</ContextMenuRadioItem>
            <ContextMenuRadioItem value="columns" data-testid="columns">Colunas</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('O papel diz que a escolha é única', async () => {
      await gestoOpen(area());
      await expect(target('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(target('list').getAttribute('role')).toBe('menuitemradio');
    });

    await step('UM grupo em volta das opções: o de rádio, nomeado pelo rótulo', async () => {
      // O grupo de rádio da lib já é um grupo por baixo. Com um grupo comum em
      // volta, eram DOIS: o rótulo pegava o id do de fora, e o de dentro — o
      // que contém as opções — ficava com `aria-labelledby` pendurado. O rótulo
      // mora dentro do grupo de rádio, e é ele que o nomeia.
      const menu = await gestoOpen(area());
      const group = within(menu).getByRole('group', { name: 'Layout' });
      await expect(group.getAttribute('data-slot')).toBe('context-menu-radio-group');
      await expect(menu.querySelectorAll('[role="group"]').length).toBe(1);
      for (const id of ['grid', 'list', 'columns']) {
        const around = groupsAround(target(id), menu);
        await expect(around.length).toBe(1);
        await expect(around[0]).toBe(group);
      }
      await expect(danglingLabelledby(menu)).toEqual([]);
    });

    await step('O indicador publica o data-slot do seu tipo de item', async () => {
      // Endereço por TIPO de item: escolha única e marcação não compartilham
      // slot, como nas outras stacks.
      await gestoOpen(area());
      const options = ['grid', 'list', 'columns'].map(target);
      for (const option of options) {
        await expect(
          option.querySelector('[data-slot="context-menu-radio-item-indicator"]'),
        ).not.toBeNull();
      }
      // O tique mora DENTRO do indicador — prova que o atributo ficou no
      // invólucro. Qual opção está marcada varia entre rodadas, então ela é
      // procurada, nunca fixada.
      const marcada = options.find((o) => o.getAttribute('aria-checked') === 'true')!;
      await expect(
        marcada.querySelector('[data-slot="context-menu-radio-item-indicator"] svg'),
      ).not.toBeNull();
    });

    await step('Escolher uma opção limpa a anterior, e o menu segue aberto', async () => {
      // Alterna entre dois valores conhecidos e afirma o PAR: assim o passo vale
      // igual em qualquer rodada, não importa de onde parta.
      const partiuDeGrid = target('grid').getAttribute('aria-checked') === 'true';
      const click = partiuDeGrid ? 'columns' : 'grid';
      const other = partiuDeGrid ? 'grid' : 'columns';
      const panel = menuOpen();
      await userEvent.click(target(click));
      await waitFor(() => expect(target(click).getAttribute('aria-checked')).toBe('true'));
      await expect(target(other).getAttribute('aria-checked')).toBe('false');
      // Mesma medida do `WithCheckbox`: um quadro depois da troca, a decisão de
      // fechar já foi tomada — e o painel tem de ser o MESMO nó.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(menuOpen()).toBe(panel);
      await expect(panel?.isConnected).toBe(true);
    });
  },
};

// ── Com submenu ───────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  parameters: {
    covers: ['functional.item5', 'functional.item6', 'accessibility.item10', 'visual.item3'],
    // O segundo nível é a tríade Sub/SubTrigger/SubContent, que o snippet do
    // meta esconderia por inteiro.
    docs: { source: { transform: contextMenuWithSubmenuSource } },
  },
  render: () => ({
    components: componentes,
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Editar</ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger data-testid="sub">Compartilhar</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem data-testid="por-email">Por e-mail</ContextMenuItem>
              <ContextMenuItem>Por link</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');
    const submenu = () =>
      document.querySelector<HTMLElement>('[data-slot="context-menu-sub-content"]');

    await step('O sub-gatilho diz que abre um menu', async () => {
      await gestoOpen(area());
      await expect(target('sub').getAttribute('aria-haspopup')).toBe('menu');
      await expect(target('sub').getAttribute('aria-expanded')).toBe('false');
    });

    await step('Seta direita abre o submenu ao lado do item que o dispara', async () => {
      target('sub').focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(target('sub').getAttribute('aria-expanded')).toBe('true'));
      await expect(
        submenu()!.querySelectorAll('[data-slot="context-menu-item"]').length,
      ).toBe(2);

      // E o foco ENTRA: abrir sem levar o foco deixaria o submenu à vista e
      // inalcançável — a seta seguinte andaria no menu de fora (WCAG 2.1.1).
      await waitFor(() => expect(document.activeElement).toBe(target('por-email')));

      // "À direita" é medida, não atributo: é o que o conteúdo promete e o que
      // um `side` errado quebraria sem nenhum aviso. O `waitFor` não é folga —
      // o popup entra no DOM ANTES de o posicionador medir, e até lá fica em
      // (0,0).
      await waitFor(() =>
        expect(submenu()!.getBoundingClientRect().left).toBeGreaterThanOrEqual(
          target('sub').getBoundingClientRect().left,
        ),
      );
    });

    await step('Seta esquerda fecha o submenu e devolve o foco ao sub-gatilho', async () => {
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(() => expect(target('sub').getAttribute('aria-expanded')).toBe('false'));
      await expect(document.activeElement).toBe(target('sub'));
    });

    await step('Escape no submenu fecha só o submenu e devolve o foco ao sub-gatilho', async () => {
      // WAI-ARIA APG: Escape fecha o menu em que o foco está, e o de fora segue
      // aberto. A lib fechava a árvore inteira — um nível de volta custava os
      // dois, e a pessoa recomeçava do clique direito.
      const panel = menuOpen();
      target('sub').focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(document.activeElement).toBe(target('por-email')));
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(submenu()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(target('sub')));
      await expect(target('sub').getAttribute('aria-expanded')).toBe('false');
      // O raiz é o MESMO nó, um quadro depois: a decisão de fechar já teria sido
      // tomada, e um painel fechado e reaberto no meio passaria por "aberto".
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await expect(menuOpen()).toBe(panel);
      await expect(panel?.isConnected).toBe(true);
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
    // O assunto é a CONVIVÊNCIA das três famílias de item no mesmo menu — é o
    // snippet mais longo do componente, e nenhum outro o cobre.
    docs: { source: { transform: contextMenuCompletoSource } },
  },
  render: () => ({
    components: componentes,
    setup() {
      const grid = ref(true);
      const layout = ref('grid');
      return { grid, layout };
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="${AREA_CLICK_DIREITO}" data-align="center" data-justify="center" data-testid="area">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuGroup>
            <ContextMenuLabel>Ações</ContextMenuLabel>
            <ContextMenuItem>
              Editar
              <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Por e-mail</ContextMenuItem>
                <ContextMenuItem>Por link</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Visualização</ContextMenuLabel>
            <ContextMenuCheckboxItem :checked="grid" @update:checked="grid = $event" data-testid="grade">
              Mostrar grade
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup :model-value="layout" @update:model-value="layout = $event">
            <ContextMenuLabel>Layout</ContextMenuLabel>
            <ContextMenuRadioItem value="grid" data-testid="grid">Grade</ContextMenuRadioItem>
            <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            Excluir
            <ContextMenuShortcut>Delete</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const area = () => within(canvasElement).getByTestId('area');

    await step('Marcação e escolha única convivem no mesmo menu', async () => {
      // `visual.item4` descreve exatamente esta convivência — é o que precisa
      // estar na tela quando o Chromatic fotografa.
      const menu = await gestoOpen(area());
      await expect(target('grade').getAttribute('role')).toBe('menuitemcheckbox');
      await expect(target('grid').getAttribute('role')).toBe('menuitemradio');
      await expect(
        menu.querySelectorAll('[data-slot="context-menu-separator"]').length,
      ).toBe(3);
    });

    await step('Os rótulos de grupo não são itens escolhíveis', async () => {
      const menu = await waitForPortal('menu');
      const rotulos = menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-label"]');
      await expect(rotulos.length).toBe(3);
      for (const label of rotulos) {
        await expect(label.getAttribute('role')).not.toBe('menuitem');
      }
    });

    await step('Cada rótulo nomeia o SEU grupo, e nenhuma referência fica pendurada', async () => {
      // Três rótulos, três grupos — e o de escolha única é o próprio grupo de
      // rádio, com uma camada só em volta das opções.
      const menu = await waitForPortal('menu');
      await expect(menu.querySelectorAll('[role="group"]').length).toBe(3);
      for (const label of menu.querySelectorAll<HTMLElement>('[data-slot="context-menu-label"]')) {
        await expect(label.id).not.toBe('');
        await expect(label.closest('[role="group"]')?.getAttribute('aria-labelledby')).toBe(label.id);
      }
      const layout = within(menu).getByRole('group', { name: 'Layout' });
      await expect(layout.getAttribute('data-slot')).toBe('context-menu-radio-group');
      const aroundGrid = groupsAround(target('grid'), menu);
      await expect(aroundGrid.length).toBe(1);
      await expect(aroundGrid[0]).toBe(layout);
      await expect(danglingLabelledby(menu)).toEqual([]);
    });
  },
};
