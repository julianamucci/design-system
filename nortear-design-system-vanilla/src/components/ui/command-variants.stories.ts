import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import type { CommandItem } from './command';
import { commandSource } from './command.source';
import { separadores, mountInline } from './command.fixtures';

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
const meta: Meta = {
  tags: ['overlay'],
  title: 'Primitives/Overlay/Command/Variants',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandSource },
      description: {
        component:
          'A paleta não tem variante visual por prop — o que muda entre os arranjos é a ' +
          'composição. Aqui fica a lista dividida em grupos nomeados, com divisor entre eles.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Com grupos ───────────────────────────────────────────────────────────────

const ITEMS_AGRUPADOS: CommandItem[] = [
  { value: 'button',    label: 'Button',    group: 'Componentes' },
  { value: 'input',     label: 'Input',     group: 'Componentes' },
  { value: 'badge',     label: 'Badge',     group: 'Componentes' },
  { value: 'separator', label: 'Separator', group: 'Componentes' },
  { value: 'cn',        label: 'cn()',      group: 'Utilitários' },
  { value: 'clsx',      label: 'clsx()',    group: 'Utilitários' },
  { value: 'twmerge',   label: 'twMerge()', group: 'Utilitários' },
];

export const WithGroups: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => mountInline(ITEMS_AGRUPADOS, 'Buscar componente...'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await expect(canvas.getAllByRole('option')).toHaveLength(7);

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      const cabecalhos = canvasElement.querySelectorAll<HTMLElement>('.nds-command-group-heading');
      await expect(cabecalhos).toHaveLength(2);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      // O cabeçalho NÃO é uma opção — o erro clássico deste componente é
      // deixá-lo entrar na lista e virar destino de navegação.
      await expect(cabecalhos[0].getAttribute('role')).toBeNull();
      const names = canvas.getAllByRole('option').map((o) => o.textContent);
      await expect(names).not.toContain('Componentes');
    });

    await step('Um divisor separa os dois grupos, fora da árvore', async () => {
      await expect(separadores(canvasElement)).toHaveLength(1);
      await expect(separadores(canvasElement)[0]).toHaveAttribute('aria-hidden', 'true');
      // Só `option` e `group` são filhos permitidos de um listbox.
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('Buscando "n" o filtro atravessa os dois grupos — sobram 3', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'n');
      // Button e Input (Componentes) + cn() (Utilitários).
      await expect(canvas.getAllByRole('option')).toHaveLength(3);
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
      await expect(separadores(canvasElement)).toHaveLength(1);
    });

    await step('Buscando "badge" sobra 1 comando e nenhum divisor', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'badge');
      await expect(canvas.getAllByRole('option')).toHaveLength(1);
      // Um grupo só na tela: divisor sem nada de um dos lados seria ruído.
      await expect(separadores(canvasElement)).toHaveLength(0);
      await expect(canvas.queryAllByRole('group')).toHaveLength(1);
    });

    await step('A story termina no estado padrão, com os 7 comandos', async () => {
      await userEvent.clear(field);
      await expect(canvas.getAllByRole('option')).toHaveLength(7);
    });
  },
};
