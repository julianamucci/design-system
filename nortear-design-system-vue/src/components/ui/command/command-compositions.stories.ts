import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { onMounted, onUnmounted, ref } from 'vue';
import { within, userEvent, waitFor, expect, fn } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import {
  commandPaletteSource,
  commandWithDisabledItemsSource,
  commandWithSeparatorSource,
  commandWithShortcutsSource,
} from './command.source';
import {
  DISABLED_ITEMS_BLOCKS,
  FRAME,
  LIST_TEMPLATE,
  NO_RESULT,
  PALETTE_BLOCKS,
  PALETTE_DESCRIPTION,
  PALETTE_TITLE,
  SEPARATOR_BLOCKS,
  SHORTCUT_BLOCKS,
  commandItem,
  emptyRegion,
  highlighted,
  searchOf,
  visibleSeparators,
} from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/Command/Compositions',
  component: Command,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('command'),
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandWithShortcutsSource },
      description: {
        component:
          'As composições da paleta: com traço declarado, com atalhos, com itens '
          + 'desabilitados e a paleta dentro de um Dialog (padrão command palette). A '
          + 'paleta em si não flutua — quem flutua é o Dialog, que já existe no sistema. '
          + 'A lista dividida em grupos é VARIANTE (variants.items.withGroups) e mora em '
          + 'Variants; a lista longa é ESTADO (states.longList) e mora em States.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

const LIST_COMPONENTS = {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
};

// ─── Com traço declarado ──────────────────────────────────────────────────────

export const WithSeparator: Story = {
  parameters: {
    docs: {
      // Dois blocos SEM cabeçalho: sem override o snippet mostraria grupos
      // nomeados e esconderia o assunto da story.
      source: { transform: commandWithSeparatorSource },
      description: {
        story:
          'Traço entre dois blocos de uma lista sem grupos. Ele é uma QUEBRA na sequência: '
          + 'some junto com os comandos quando o filtro esvazia um dos lados, porque não sobra '
          + 'fronteira para marcar.',
      },
    },
  },
  render: () => ({
    components: LIST_COMPONENTS,
    setup() {
      return { blocks: SEPARATOR_BLOCKS, select: () => {} };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar comando..." />
          ${LIST_TEMPLATE}
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);

    await step('O traço declarado divide a lista plana em dois blocos', async () => {
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      const separators = visibleSeparators(canvasElement);
      await expect(separators).toHaveLength(1);
      // Dentro de um listbox a linha é decorativa: só `option` e `group` são
      // filhos permitidos.
      await expect(separators[0]).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
      // Nenhum cabeçalho: a divisão aqui não veio de grupo nomeado — e bloco
      // sem nome não se anuncia como grupo.
      await expect(canvasElement.querySelectorAll('.nds-command-group-heading')).toHaveLength(0);
      await expect(canvas.queryAllByRole('group')).toHaveLength(0);
    });

    await step('Filtrando até sobrar um lado só, o traço vai junto', async () => {
      await userEvent.type(field, 'sair');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await waitFor(async () => {
        await expect(visibleSeparators(canvasElement)).toHaveLength(0);
      });
    });

    await step('A story termina no estado padrão', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(visibleSeparators(canvasElement)).toHaveLength(1);
    });
  },
};

// ─── Com atalhos ──────────────────────────────────────────────────────────────

export const WithShortcuts: Story = {
  // O atalho mora DENTRO do item, que é o que o faz entrar no nome acessível.
  parameters: { docs: { source: { transform: commandWithShortcutsSource } } },
  render: () => ({
    components: LIST_COMPONENTS,
    setup() {
      return { blocks: SHORTCUT_BLOCKS, select: () => {} };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar comando..." />
          ${LIST_TEMPLATE}
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const shortcutOf = (item: HTMLElement) =>
      item.querySelector<HTMLElement>('[data-slot="command-shortcut"]');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(4);
    });

    await step('O atalho aparece à direita do comando', async () => {
      const save = commandItem(canvasElement, 'salvar');
      const shortcut = shortcutOf(save)!;
      await expect(shortcut).toHaveTextContent('Ctrl+S');
      await expect(shortcut).toHaveClass(/nds-command-shortcut/);

      // A distância até a borda direita é menor que até a esquerda: é o
      // `margin-left: auto` da folha empurrando o atalho para o fim da linha.
      const itemBox = save.getBoundingClientRect();
      const shortcutBox = shortcut.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Salvar" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const save = commandItem(canvasElement, 'salvar');
      await expect(shortcutOf(save)!.getAttribute('aria-hidden')).toBeNull();
      await expect(save).toHaveAccessibleName(/Ctrl\+S/);
    });

    await step('Comando sem atalho não ganha um espaço vazio', async () => {
      await expect(shortcutOf(commandItem(canvasElement, 'preferencias'))).toBeNull();
    });

    await step('Buscando "sal" sobra 1 comando, com o atalho junto', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'sal');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      await expect(shortcutOf(commandItem(canvasElement, 'salvar'))).not.toBeNull();
    });

    await step('O texto do atalho não é nome de comando — buscar "ctrl" não acha nada', async () => {
      // O filtro compara o rótulo e o `value`. Quando comparava o texto inteiro
      // do item, "ctrl" trazia de volta os três comandos com atalho.
      await userEvent.clear(field);
      await userEvent.type(field, 'ctrl');
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
      await expect(emptyRegion(canvasElement)).toHaveAttribute('data-empty', '');
    });

    await step('A story termina no estado padrão', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(4);
      });
    });
  },
};

// ─── Com itens desabilitados ──────────────────────────────────────────────────

const onListSelect = fn();

export const WithDisabledItems: Story = {
  parameters: { docs: { source: { transform: commandWithDisabledItemsSource } } },
  render: () => ({
    components: LIST_COMPONENTS,
    setup() {
      return { blocks: DISABLED_ITEMS_BLOCKS, select: (value: string) => onListSelect(value) };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar..." />
          ${LIST_TEMPLATE}
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(6);
    });

    await step('Os três desabilitados se declaram no markup', async () => {
      for (const value of ['input', 'select', 'clsx']) {
        await expect(commandItem(canvasElement, value)).toHaveAttribute('aria-disabled', 'true');
      }
      for (const value of ['button', 'badge', 'cn']) {
        await expect(commandItem(canvasElement, value)).not.toHaveAttribute('aria-disabled');
      }
    });

    await step('As setas percorrem só os 3 habilitados, em sequência', async () => {
      field.focus();
      // Home fixa a precondição: o destaque parte do primeiro comando.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Button');
      });

      for (const expected of ['Badge', 'cn()']) {
        await userEvent.keyboard('{ArrowDown}');
        await waitFor(async () => {
          await expect(highlighted(canvasElement)).toHaveTextContent(expected);
        });
      }
      // Fim da lista: a seta não volta ao primeiro nem cai num comando
      // desabilitado.
      await userEvent.keyboard('{ArrowDown}');
      await expect(highlighted(canvasElement)).toHaveTextContent('cn()');
      await expect(field.getAttribute('aria-activedescendant')).toBe(
        commandItem(canvasElement, 'cn').id,
      );
    });

    await step('Clicar num desabilitado não executa nada', async () => {
      const before = onListSelect.mock.calls.length;
      await userEvent.click(commandItem(canvasElement, 'select'), { pointerEventsCheck: 0 });
      await expect(onListSelect.mock.calls.length).toBe(before);
    });
  },
};

// ─── Command Palette (Command dentro de Dialog) ───────────────────────────────

const onRunCommand = fn();

/**
 * Command dentro de um Dialog, aberto por atalho global.
 *
 * O Ctrl+K não é nativo de componente nenhum — é um ouvinte de janela, e é o
 * consumidor que o registra. Aqui ele nasce com a story e MORRE com ela: um
 * ouvinte de janela que sobrevive à troca de story vira flake em qualquer teste
 * que use a mesma tecla.
 */
export const CommandPalette: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item6', 'accessibility.item3', 'visual.item3'],
    // `CommandDialog` já traz a raiz por dentro, e o atalho de janela é código
    // de quem consome — nada disso aparece na do meta.
    docs: { source: { transform: commandPaletteSource } },
  },
  render: () => ({
    components: { ...LIST_COMPONENTS, CommandDialog, Button },
    setup() {
      const open = ref(false);

      function onKeydown(event: KeyboardEvent) {
        if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;
        // Sem isto o navegador leva o atalho para a barra de endereço.
        event.preventDefault();
        open.value = true;
      }
      onMounted(() => window.addEventListener('keydown', onKeydown));
      onUnmounted(() => window.removeEventListener('keydown', onKeydown));

      function select(value: string) {
        onRunCommand(value);
        open.value = false;
      }

      return { open, blocks: PALETTE_BLOCKS, select, title: PALETTE_TITLE, description: PALETTE_DESCRIPTION };
    },
    template: `
      <Button
        variant="outline"
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click="open = true"
      >
        Buscar
        <kbd class="nds-kbd">Ctrl+K</kbd>
      </Button>

      <CommandDialog
        v-model:open="open"
        :title="title"
        :description="description"
      >
        <CommandInput placeholder="Buscar componente..." />
        ${LIST_TEMPLATE}
        <CommandEmpty>${NO_RESULT}</CommandEmpty>
      </CommandDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Buscar/ });

    const openByButton = async (): Promise<HTMLElement> => {
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      return await waitForPortal('dialog');
    };

    await step('A dica do atalho fica visível no gatilho', async () => {
      // Atalho escondido é atalho que ninguém descobre — é a metade "do" do par
      // de Do & Don't deste componente.
      const hint = trigger.querySelector<HTMLElement>('kbd')!;
      await expect(hint).toHaveClass(/nds-kbd/);
      await expect(hint).toHaveTextContent('Ctrl+K');
      await expect(hint).toBeVisible();
      // O nome do botão sai do texto visível: um `aria-label` diferente dele
      // violaria a WCAG 2.5.3 (quem fala "Buscar" ao comando de voz erra).
      await expect(trigger).not.toHaveAttribute('aria-label');
    });

    await step('O diálogo é nomeado por um título que só o leitor de tela vê', async () => {
      const panel = await openByButton();
      const titleId = panel.getAttribute('aria-labelledby');
      await expect(titleId).toBeTruthy();

      const title = document.getElementById(titleId!)!;
      await expect(title).toHaveTextContent(PALETTE_TITLE);
      // Fora da tela, mas dentro da árvore de acessibilidade: `display: none`
      // apagaria o nome do diálogo.
      await expect(title.closest('.nds-sr-only')).not.toBeNull();
      await expect(title.getBoundingClientRect().width).toBeLessThan(4);
      await expect(panel).toHaveAccessibleName(PALETTE_TITLE);
    });

    await step('O foco vai direto para a busca, com os 3 comandos na lista', async () => {
      const panel = await openByButton();
      await waitFor(async () => {
        await expect(searchOf(panel)).toHaveFocus();
      });
      await expect(within(panel).getAllByRole('option')).toHaveLength(3);
    });

    await step('Escape fecha o diálogo e devolve o foco ao gatilho', async () => {
      await openByButton();
      await userEvent.keyboard('{Escape}');

      await waitForPortalGone('dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(trigger).toHaveFocus();
      });
    });

    await step('Ctrl+K abre a paleta de qualquer lugar da página', async () => {
      await userEvent.keyboard('{Control>}k{/Control}');

      const panel = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(searchOf(panel)).toHaveFocus();
      });
      // Os atalhos de cada comando aparecem à direita, encostados na borda.
      const shortcut = commandItem(panel, 'button')
        .querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut).toHaveTextContent('Ctrl+B');
      const itemBox = commandItem(panel, 'button').getBoundingClientRect();
      const shortcutBox = shortcut.getBoundingClientRect();
      await expect(itemBox.right - shortcutBox.right).toBeLessThan(
        shortcutBox.left - itemBox.left,
      );
    });

    await step('Escolher um comando executa e fecha', async () => {
      const panel = await waitForPortal('dialog');
      const before = onRunCommand.mock.calls.length;
      await userEvent.click(within(panel).getByRole('option', { name: /Input/ }));

      await waitForPortalGone('dialog');
      await expect(onRunCommand.mock.calls.length).toBe(before + 1);
      await expect(onRunCommand.mock.calls[before][0]).toBe('input');
    });

    await step('A story termina com a paleta ABERTA', async () => {
      // O Chromatic fotografa o estado final e o axe roda depois da play:
      // terminar fechada capturaria só o gatilho.
      await userEvent.keyboard('{Control>}k{/Control}');
      const reopened = await waitForPortal('dialog');
      await waitFor(async () => {
        await expect(searchOf(reopened)).toHaveFocus();
      });
      await expect(reopened).toBeVisible();
      await expect(within(reopened).getAllByRole('option')).toHaveLength(3);
    });
  },
};
