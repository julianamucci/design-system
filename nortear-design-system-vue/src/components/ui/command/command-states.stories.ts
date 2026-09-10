import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect, fn } from 'storybook/test';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  commandEmptySource,
  commandItemCheckedSource,
  commandItemDisabledSource,
  commandLongListSource,
} from './command.source';
import {
  CHECKED_BLOCKS,
  DISABLED_ITEM_BLOCKS,
  EMPTY_STATE_BLOCKS,
  EMPTY_STATE_SEARCH,
  FRAME,
  LIST_TEMPLATE,
  LONG_LIST_NAMES,
  NO_RESULT,
  commandItem,
  emptyRegion,
  highlighted,
} from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
const meta = {
  title: 'Components/Overlay/Command/States',
  component: Command,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('command'),
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandEmptySource },
      description: {
        component:
          'Os estados que a paleta assume sozinha (sem resultados, lista longa) e os que '
          + 'cada comando assume (marcado, desabilitado).',
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

// ─── Sem resultados ───────────────────────────────────────────────────────────

export const EmptyState: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: commandEmptySource } },
  },
  render: () => ({
    components: LIST_COMPONENTS,
    setup() {
      return { blocks: EMPTY_STATE_BLOCKS, select: () => {}, search: EMPTY_STATE_SEARCH };
    },
    // A busca já nasce sem correspondência: é o estado que esta story
    // documenta, e o quadro que o Chromatic captura.
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar componente..." :model-value="search" />
          ${LIST_TEMPLATE}
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');
    const empty = emptyRegion(canvasElement);

    await step(`Buscando "${EMPTY_STATE_SEARCH}" não sobra nenhum comando`, async () => {
      await userEvent.clear(field);
      await userEvent.type(field, EMPTY_STATE_SEARCH);
      await waitFor(async () => {
        await expect(canvas.queryAllByRole('option')).toHaveLength(0);
      });
    });

    await step('A frase é anunciada, não só desenhada', async () => {
      await waitFor(async () => {
        await expect(empty).toHaveAttribute('data-empty', '');
      });
      await expect(empty).toBeVisible();
      await expect(empty).toHaveTextContent(NO_RESULT);
      await expect(empty).toHaveClass(/nds-command-empty/);
      // Sem a região viva, quem usa leitor de tela digitaria no vazio sem nunca
      // saber que a busca não achou nada.
      await expect(empty).toHaveAttribute('role', 'status');
      await expect(empty).toHaveAttribute('aria-live', 'polite');
      await expect(empty).toHaveAttribute('aria-atomic', 'true');
      // `role="status"` dentro de `role="listbox"` é filho não permitido, e o
      // axe reprova por aria-required-children.
      await expect(list.contains(empty)).toBe(false);
    });

    await step('Apagar a busca traz os 3 comandos de volta', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(empty).not.toHaveAttribute('data-empty');
      await expect(empty).not.toHaveClass(/nds-command-empty/);
    });

    await step('A story termina SEM resultados', async () => {
      // O Chromatic fotografa o estado final: terminar com a lista cheia
      // capturaria outra story.
      await userEvent.type(field, EMPTY_STATE_SEARCH);
      await waitFor(async () => {
        await expect(empty).toHaveAttribute('data-empty', '');
      });
      await expect(canvas.queryAllByRole('option')).toHaveLength(0);
    });
  },
};

// ─── Comando desabilitado ─────────────────────────────────────────────────────

const onChooseWithDisabled = fn();

export const ItemDisabled: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item4', 'visual.item4'],
    // `disabled` no item é o assunto: a do meta mostraria uma paleta sem
    // comando desabilitado nenhum.
    docs: { source: { transform: commandItemDisabledSource } },
  },
  render: () => ({
    components: LIST_COMPONENTS,
    setup() {
      return { blocks: DISABLED_ITEM_BLOCKS, select: (value: string) => onChooseWithDisabled(value) };
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
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });
    // Consultado a cada passo: o filtro desmonta e remonta os itens, e um nó
    // guardado antes de um re-render vira asserção sobre elemento solto no ar.
    const archive = () => commandItem(canvasElement, 'arquivar');

    await step('O estado chega ao markup e ao desenho', async () => {
      await expect(archive()).toHaveAttribute('aria-disabled', 'true');
      await expect(archive()).toHaveAttribute('data-disabled', '');
      // O que a pessoa percebe: o comando esmaecido e surdo ao ponteiro.
      const computedStyle = getComputedStyle(archive());
      await expect(computedStyle.pointerEvents).toBe('none');
      await expect(Number.parseFloat(computedStyle.opacity)).toBeLessThan(1);
    });

    await step('Clicar não executa o comando', async () => {
      const before = onChooseWithDisabled.mock.calls.length;
      // `pointerEventsCheck: 0` porque a folha bloqueia o ponteiro: sem isso o
      // user-event recusa o clique antes de o componente ter chance de errar.
      await userEvent.click(archive(), { pointerEventsCheck: 0 });
      await expect(onChooseWithDisabled.mock.calls.length).toBe(before);
    });

    await step('As setas pulam o comando desabilitado', async () => {
      field.focus();
      // Home fixa a precondição do passo: destaque no primeiro comando.
      await userEvent.keyboard('{Home}');
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Novo');
      });

      await userEvent.keyboard('{ArrowDown}');
      // "Arquivar" não é destino de navegação — quem usa teclado nunca para
      // num comando que não pode executar.
      await waitFor(async () => {
        await expect(highlighted(canvasElement)).toHaveTextContent('Renomear');
      });
      await expect(archive()).toHaveAttribute('aria-selected', 'false');
      await expect(archive()).not.toHaveAttribute('data-highlighted');
    });

    await step('Enter no comando habilitado seguinte executa normalmente', async () => {
      const before = onChooseWithDisabled.mock.calls.length;
      await userEvent.keyboard('{Enter}');
      await waitFor(async () => {
        await expect(onChooseWithDisabled.mock.calls.length).toBe(before + 1);
      });
      await expect(onChooseWithDisabled.mock.calls[before][0]).toBe('renomear');
    });
  },
};

// ─── Comando marcado ──────────────────────────────────────────────────────────

export const CheckedItem: Story = {
  parameters: {
    covers: ['functional.item5', 'visual.item4'],
    // `checked` ausente e `checked` falso são coisas diferentes, e é isso que a
    // story ensina — a do meta não escreve a prop em item nenhum.
    docs: { source: { transform: commandItemCheckedSource } },
  },
  render: () => ({
    components: LIST_COMPONENTS,
    setup() {
      return { blocks: CHECKED_BLOCKS, select: () => {} };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar tema..." />
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
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
    });

    const light = commandItem(canvasElement, 'claro');
    const dark = commandItem(canvasElement, 'escuro');
    const system = commandItem(canvasElement, 'sistema');
    const mark = (item: HTMLElement) =>
      getComputedStyle(item.querySelector<HTMLElement>('.nds-command-item-check')!);

    await step('O estado chega ao markup', async () => {
      await expect(light).toHaveAttribute('data-checked', 'true');
      await expect(dark).toHaveAttribute('data-checked', 'false');
    });

    await step('A marca aparece só no comando marcado', async () => {
      // O ícone fica no DOM nos dois casos — é a opacidade que muda, para a
      // largura do item não pular a cada troca.
      await expect(mark(light).opacity).toBe('1');
      await expect(mark(dark).opacity).toBe('0');
    });

    await step('Com atalho no item, a marca some', async () => {
      // Os dois disputariam a borda direita. A folha resolve por `:has()`, e a
      // guideline é escolher um dos dois por item.
      await expect(system).toHaveAttribute('data-checked', 'true');
      await expect(mark(system).display).toBe('none');
    });

    await step('O atalho faz parte do nome do comando', async () => {
      // Sem isso o leitor anunciaria "Sistema" e a pessoa nunca saberia que há
      // uma tecla — o atalho é informação, não decoração.
      const shortcut = system.querySelector<HTMLElement>('[data-slot="command-shortcut"]')!;
      await expect(shortcut).toHaveClass(/nds-command-shortcut/);
      await expect(shortcut.getAttribute('aria-hidden')).toBeNull();
      await expect(system).toHaveAccessibleName(/Ctrl\+S/);
    });
  },
};

// ─── Lista longa ──────────────────────────────────────────────────────────────

export const LongList: Story = {
  parameters: {
    // Trinta comandos escritos por `v-for`: a do meta mostraria três.
    docs: { source: { transform: commandLongListSource } },
  },
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    setup() {
      return { componentNames: LONG_LIST_NAMES };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar componente..." />
          <CommandList>
            <CommandGroup heading="Componentes">
              <CommandItem
                v-for="name in componentNames"
                :key="name"
                :value="name.toLowerCase()"
              >
                {{ name }}
              </CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');
    const list = canvas.getByRole('listbox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(30);
    });

    await step('A lista rola em vez de esticar a paleta', async () => {
      // Teto de altura na folha: sem ele a paleta cresceria para fora da tela e
      // o campo de busca sairia do alcance.
      await expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
      await expect(getComputedStyle(list).overflowY).toBe('auto');
    });

    await step('Buscando "dialog" sobram 2 — Dialog e AlertDialog', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'dialog');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(2);
      });
      await expect(commandItem(canvasElement, 'dialog')).toBeVisible();
      await expect(commandItem(canvasElement, 'alertdialog')).toBeVisible();
    });

    await step('A story termina com a lista inteira', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(30);
      });
    });
  },
};
