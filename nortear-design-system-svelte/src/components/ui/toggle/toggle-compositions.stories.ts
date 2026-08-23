import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect } from 'storybook/test';
import ToggleScenarioStory from './ToggleScenarioStory.svelte';
import {
  formattingToggleBarSource,
  toggleControlledSource,
  toggleFiltersSource,
  toggleSource,
} from './toggle.source';

const meta = {
  title: 'UI/Toggle/Compositions',
  component: ToggleScenarioStory,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: o painel Controls ficaria vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada composição sobrescreve
      // com a sua própria marcação logo abaixo.
      source: { transform: toggleSource },
      description: {
        component:
          'As duas composições documentadas — toolbar de formatação e lista de filtros — mais o padrão controlado.',
      },
    },
  },
} satisfies Meta<typeof ToggleScenarioStory>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Leva o toggle a um estado conhecido clicando SÓ quando ele ainda não está
 * lá. O painel Interactions reexecuta a play no mesmo DOM: um clique cego
 * partiria do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function definir(btn: HTMLElement, target: boolean) {
  if ((btn.getAttribute('aria-pressed') === 'true') !== target) await userEvent.click(btn);
  await expect(btn).toHaveAttribute('aria-pressed', String(target));
}

export const FormattingToolbar: Story = {
  parameters: { docs: { source: { transform: formattingToggleBarSource } } },
  args: { cenario: 'toolbar' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O conjunto é anunciado como grupo, com nome próprio', async () => {
      const group = canvas.getByRole('group', { name: 'Formatação de texto' });
      await expect(group).toBeVisible();
      await expect(within(group).getAllByRole('button')).toHaveLength(4);
    });

    await step('Cada toggle icon-only tem nome acessível próprio', async () => {
      for (const name of ['Negrito', 'Itálico', 'Sublinhado', 'Lista']) {
        const btn = canvas.getByRole('button', { name: name });
        await expect(btn).toHaveAttribute('aria-label', name);
        await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Os toggles são independentes: ativar um não mexe no vizinho', async () => {
      const negrito = canvas.getByRole('button', { name: 'Negrito' });
      const italico = canvas.getByRole('button', { name: 'Itálico' });
      await definir(negrito, false);
      await definir(italico, false);
      // O par idempotente também prova o clique DESTA rodada: se o toggle já
      // estivesse ligado, o `definir` acima o teria desligado antes.
      await definir(negrito, true);
      await expect(italico).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

export const FilterList: Story = {
  parameters: { docs: { source: { transform: toggleFiltersSource } } },
  args: { cenario: 'filters' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível é o nome acessível de cada filtro', async () => {
      // Sem interação nesta story de propósito: a asserção de estado INICIAL
      // não sobreviveria ao replay se um clique a precedesse.
      const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const compacta = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ocultos.getAttribute('aria-label')).toBe(null);
      await expect(compacta.getAttribute('aria-label')).toBe(null);
    });

    await step('Cada filtro é uma escolha booleana isolada, e podem combinar', async () => {
      const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const compacta = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ocultos).toHaveAttribute('aria-pressed', 'false');
      await expect(compacta).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Os dois filtros usam a variante outline', async () => {
      for (const name of ['Mostrar ocultos', 'Visão compacta']) {
        await expect(canvas.getByRole('button', { name: name })).toHaveAttribute(
          'data-variant',
          'outline',
        );
      }
    });
  },
};

export const Controlled: Story = {
  parameters: { docs: { source: { transform: toggleControlledSource } } },
  args: { cenario: 'controlled' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole('button', { name: 'Negrito' });

    await step('O estado externo acompanha o toggle ao ligar', async () => {
      // O par (desliga, liga) garante um clique REAL nesta rodada, venha o DOM
      // de onde vier: sem ele, o replay partiria do estado que a rodada
      // anterior deixou e a asserção absoluta inverteria.
      await definir(toggle, false);
      await definir(toggle, true);
      await expect(canvas.getByText('true')).toBeVisible();
    });

    await step('E acompanha também ao desligar', async () => {
      await definir(toggle, false);
      await expect(canvas.getByText('false')).toBeVisible();
    });
  },
};
