import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Select } from './index';
import SelectStory from './SelectStory.svelte';
import {
  selectComGruposSource,
  selectComIconeSource,
  selectCompactoSource,
  selectSource,
} from './select.source';

const meta: Meta = {
  title: 'UI/Select/Compositions',
  component: Select,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: selectSource },
      description: {
        component:
          'Composicoes do Select: tamanho compacto (sm) para formulários densos, seleção por região com grupos e Select com ícones por item.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const CompactSize: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      size: 'sm',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    docs: {
      source: { transform: selectCompactoSource },
      description: {
        story:
          'Densidade compacta (`size="sm"`) — para formulários densos e toolbars. A altura menor vem do `padding-block`, não de um valor cravado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });

    await step('O campo compacto se declara pelo atributo de densidade', async () => {
      await expect(trigger).toHaveAttribute('data-size', 'sm');
    });

    await step('A altura menor nasce do padding, não de altura cravada', async () => {
      // Altura cravada não cresce quando a pessoa aumenta a fonte do navegador
      // (WCAG 1.4.4). O padding do tamanho compacto é o que encolhe a caixa.
      const estilo = getComputedStyle(trigger);
      await expect(Number.parseFloat(estilo.paddingBlockStart)).toBeGreaterThan(0);
      await expect(Number.parseFloat(estilo.paddingBlockStart)).toBeLessThan(8);
    });
  },
};

export const RegionSelection: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withGroups',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    // Mesma composição da variante agrupada — é o uso real dela.
    docs: {
      source: { transform: selectComGruposSource },
      description: {
        story:
          'Lista de estados agrupada por região via SelectGroup + SelectGroupHeading. Útil para listas médias (8–15 itens) com categorias naturais.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Selecionar item dentro de grupo atualiza o campo', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      await expect(within(listbox).getAllByRole('group')).toHaveLength(2);
      const option = await waitForPortal('option', { name: /Paraná/i });
      await userEvent.click(option);
      await waitFor(async () => {
        await expect(trigger).toHaveTextContent(/Paraná/);
      });
    });
  },
};

export const WithIcons: Story = {
  render: () => ({
    Component: SelectStory,
    props: {
      variant: 'withIcon',
      placeholder: 'Selecione...',
      ariaLabel: 'Selecionar estado',
    },
  }),
  parameters: {
    docs: {
      source: { transform: selectComIconeSource },
      description: {
        story:
          'SelectItem com ícone (MapPin) inline antes do label. O ícone fica decorativo (aria-hidden).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Toda opção traz o ícone, e ele fica fora do nome acessível', async () => {
      const trigger = canvas.getByRole('combobox', { name: /Selecionar estado/i });
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger);
      const listbox = await waitForPortal('listbox');
      const opcoes = within(listbox).getAllByRole('option');
      await expect(opcoes).toHaveLength(4);
      for (const opcao of opcoes) {
        await expect(opcao.querySelector('svg')).toBeTruthy();
      }
      await expect(opcoes[0]).toHaveAccessibleName('São Paulo');
    });
  },
};
