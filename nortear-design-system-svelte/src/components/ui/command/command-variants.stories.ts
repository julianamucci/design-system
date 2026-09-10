import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect } from 'storybook/test';
import { Root as Command } from '@/components/ui/command';
import CommandInlineStory from './CommandInlineStory.svelte';
import { commandWithGroupsSource, GROUPED_ITEMS, NO_RESULT } from './command.source';
import { separatorsOf } from './command.fixtures';

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
const meta: Meta = {
  title: 'Components/Overlay/Command/Variants',
  component: Command,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('command'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: commandWithGroupsSource },
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

export const WithGroups: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: commandWithGroupsSource } },
  },
  render: () => ({
    Component: CommandInlineStory,
    props: { placeholder: 'Buscar componente...', emptyMessage: NO_RESULT, items: GROUPED_ITEMS },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="command"]')!;
    const field = canvas.getByRole('combobox');

    await userEvent.clear(field);
    await waitFor(async () => {
      // Com o campo vazio: 4 componentes + 3 utilitários.
      await expect(canvas.getAllByRole('option')).toHaveLength(7);
    });

    await step('Cada grupo é nomeado pelo próprio cabeçalho', async () => {
      // Sem o `aria-labelledby` o leitor anuncia "grupo" e a pessoa não sabe de
      // qual bloco se trata.
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
    });

    await step('O cabeçalho não é opção da lista', async () => {
      // Cabeçalho navegável seria pior que inútil: a seta pararia nele como se
      // fosse comando. Os 7 contados acima são exatamente os comandos.
      const headings = root.querySelectorAll('.nds-command-group-heading');
      await expect(headings).toHaveLength(2);
      for (const heading of headings) {
        await expect(heading.getAttribute('role')).not.toBe('option');
      }
      const names = canvas.getAllByRole('option').map((option) => option.textContent?.trim());
      await expect(names).not.toContain('Componentes');
    });

    await step('O divisor é desenho, não estrutura', async () => {
      await expect(separatorsOf(root)).toHaveLength(1);
      const divider = separatorsOf(root)[0];
      await expect(divider).toHaveClass(/nds-command-separator/);
      // `role="separator"` não é filho permitido de um listbox; quem separa os
      // blocos para quem não vê a tela é o rótulo do grupo.
      await expect(divider).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('Buscando "n" o filtro atravessa os dois grupos — sobram 3', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'n');
      await waitFor(async () => {
        // Button e Input (Componentes) + cn() (Utilitários).
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();
    });

    await step('Buscando "badge" sobra 1 comando e nenhum divisor', async () => {
      await userEvent.clear(field);
      await userEvent.type(field, 'badge');
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(1);
      });
      // Um grupo só na tela: divisor sem nada de um dos lados seria ruído. O
      // grupo que esvaziou fica `hidden`, fora da árvore.
      await expect(separatorsOf(root)).toHaveLength(0);
      await expect(canvas.queryAllByRole('group')).toHaveLength(1);
    });

    await step('A story termina no estado padrão, com os 7 comandos', async () => {
      // É o quadro de `visual.item1`.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(7);
      });
      await expect(separatorsOf(root)).toHaveLength(1);
    });
  },
};
