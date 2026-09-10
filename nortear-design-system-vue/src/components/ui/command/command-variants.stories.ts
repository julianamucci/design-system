import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
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
import { commandWithGroupsSource } from './command.source';
import { FRAME, GROUPED_BLOCKS, LIST_TEMPLATE, NO_RESULT, visibleSeparators } from './command.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
/*
 * As VARIANTES da paleta são as entradas de `variants.items` do conteúdo
 * compartilhado — inline, command palette e com grupos. `inline` é o próprio
 * Playground e `palette` depende do Dialog, então mora em Compositions; o que
 * sobra para cá é a lista dividida em grupos.
 *
 * Antes esta story morava em Compositions em quatro stacks e em Variants numa
 * quinta — a mesma peça em dois lugares da barra lateral, conforme a stack que
 * a pessoa estivesse lendo. O grupo sai do ARQUIVO, e o arquivo sai do
 * conteúdo: `-variants` espelha `variants.items`, `-states` espelha `states`.
 */
const meta = {
  title: 'Components/Overlay/Command/Variants',
  component: Command,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('command'),
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandWithGroupsSource },
      description: {
        component:
          'A paleta não tem variante visual por prop — o que muda entre os arranjos é a '
          + 'composição. Aqui fica a lista dividida em grupos nomeados, com divisor entre eles.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com grupos ───────────────────────────────────────────────────────────────

export const WithGroups: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => ({
    components: {
      Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
      CommandSeparator, CommandShortcut,
    },
    setup() {
      return { blocks: GROUPED_BLOCKS, select: () => {} };
    },
    template: `
      <div class="${FRAME}">
        <Command>
          <CommandInput placeholder="Buscar componente..." />
          ${LIST_TEMPLATE}
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      await expect(canvas.getAllByRole('option')).toHaveLength(7);
    });

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      const headings = root.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(headings).toHaveLength(2);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      // O cabeçalho NÃO é uma opção — o erro clássico deste componente é
      // deixá-lo entrar na lista e virar destino de navegação.
      await expect(headings[0].getAttribute('role')).not.toBe('option');
      const names = canvas.getAllByRole('option').map((option) => option.textContent?.trim());
      await expect(names).not.toContain('Componentes');
    });

    await step('Um divisor separa os dois grupos, fora da árvore', async () => {
      const separators = visibleSeparators(root);
      await expect(separators).toHaveLength(1);
      await expect(separators[0]).toHaveClass(/nds-command-separator/);
      await expect(separators[0]).toHaveAttribute('aria-hidden', 'true');
      // Só `option` e `group` são filhos permitidos de um listbox.
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('Buscando "n" o filtro atravessa os dois grupos — sobram 3', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'n');
      // Button e Input (Componentes) + cn() (Utilitários).
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      await expect(visibleSeparators(root)).toHaveLength(1);
    });

    await step('Buscando "badge" sobra 1 comando e nenhum divisor', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'badge');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      // Um grupo só na tela: divisor sem nada de um dos lados seria ruído.
      await waitFor(async () => {
        await expect(visibleSeparators(root)).toHaveLength(0);
      });
      await expect(canvas.queryAllByRole('group')).toHaveLength(1);
    });

    await step('A story termina no estado padrão, com os 7 comandos', async () => {
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(7);
      });
      await expect(visibleSeparators(root)).toHaveLength(1);
    });
  },
};
