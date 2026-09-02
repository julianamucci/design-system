import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, waitFor, expect } from 'storybook/test';
import { Root as Command } from '@/components/ui/command';
import CommandComposicaoGruposStory from './CommandComposicaoGruposStory.svelte';
import { commandWithGroupsSource } from './command.source';

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
  title: 'Primitives/Overlay/Command/Variants',
  component: Command,
  tags: ['overlay'],
  parameters: {
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
    Component: CommandComposicaoGruposStory,
    props: {},
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
      const cabecalhos = root.querySelectorAll('.nds-command-group-heading');
      await expect(cabecalhos).toHaveLength(2);
      for (const header of cabecalhos) {
        await expect(header.getAttribute('role')).not.toBe('option');
      }
    });

    await step('O divisor é desenho, não estrutura', async () => {
      const divisor = root.querySelector<HTMLElement>('[data-slot="command-separator"]')!;
      await expect(divisor).toHaveClass(/nds-command-separator/);
      // `role="separator"` não é filho permitido de um listbox; quem separa os
      // blocos para quem não vê a tela é o rótulo do grupo.
      await expect(divisor).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas.queryAllByRole('separator')).toHaveLength(0);
    });

    await step('O filtro atravessa os grupos', async () => {
      await userEvent.type(field, 'n');
      await waitFor(async () => {
        // Buscando "n": button, input (Componentes) e cn (Utilitários).
        await expect(canvas.getAllByRole('option')).toHaveLength(3);
      });
      await expect(canvas.getByRole('group', { name: 'Componentes' })).toBeVisible();
      await expect(canvas.getByRole('group', { name: 'Utilitários' })).toBeVisible();

      // A story TERMINA com a lista inteira: é o quadro de `visual.item1`.
      await userEvent.clear(field);
      await waitFor(async () => {
        await expect(canvas.getAllByRole('option')).toHaveLength(7);
      });
    });
  },
};
