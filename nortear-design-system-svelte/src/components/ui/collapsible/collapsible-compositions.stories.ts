import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, waitFor, expect } from 'storybook/test';
import { Collapsible } from './index';
import CollapsibleComButtonStory from './CollapsibleComButtonStory.svelte';
import CollapsibleComIconeStory from './CollapsibleComIconeStory.svelte';
import {
  collapsibleWithButtonSource,
  collapsibleWithChevronSource,
  collapsibleSource,
} from './collapsible.source';

const meta: Meta = {
  title: 'Components/Disclosure/Collapsible/Compositions',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: collapsibleSource },
      description: {
        component:
          'Composicoes do Collapsible: trigger estilizado como botão e trigger com chevron que gira ao abrir.',
      },
    },
  },
};

export default meta;

/** Par idempotente — ver a nota em collapsible.stories.ts. */
const open = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

// Wrapper sem props: o Args generico nao e atribuivel a Record<string, never>.
// Nome anterior: `WithButton`. `WithCustomButton` é o nome do Vanilla, que é a
// referência cross-stack.
export const WithCustomButton: StoryObj<Record<string, never>> = {
  parameters: {
    covers: ['functional.item5'],
    docs: { source: { transform: collapsibleWithButtonSource } },
  },
  render: () => ({
    Component: CollapsibleComButtonStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Exibir opções avançadas/i });

    await step('o botão do design system E o trigger são o MESMO elemento', async () => {
      // Não há repasse de comportamento para um filho: as classes do Button
      // moram no próprio trigger, que por isso carrega aria-expanded e, aberto,
      // aria-controls, sem código de ligação.
      await expect(trigger).toHaveClass(/nds-button-outline/);
      await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger');
      await expect(trigger).toHaveAttribute('aria-expanded');
    });

    await step('aberto, o mesmo botão aponta para o painel', async () => {
      await close(trigger);
      await open(trigger);
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      );
    });
  },
};

// Nome anterior: `WithRotatingIcon`. `WithRotatingChevron` é o nome do Vanilla.
export const WithRotatingChevron: StoryObj<Record<string, never>> = {
  parameters: {
    covers: ['accessibility.item4', 'visual.item4'],
    docs: { source: { transform: collapsibleWithChevronSource } },
  },
  render: () => ({
    Component: CollapsibleComIconeStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Configurações avançadas/i });
    const chevron = trigger.querySelector<SVGElement>('svg')!;

    await step('o chevron é decorativo e carrega a classe da rotação', async () => {
      // Se o SVG não fosse aria-hidden, o `getByRole` acima já não acharia por
      // este nome — o gráfico entraria no nome acessível.
      await expect(chevron).toHaveAttribute('aria-hidden', 'true');
      await expect(chevron.getAttribute('class')).toContain('nds-chevron');
    });

    await step('fechado, o ícone não está girado', async () => {
      await close(trigger);
      // waitFor porque `.nds-chevron` tem transition: transform — medido no
      // primeiro quadro, o valor computado ainda é a matriz da animação.
      await waitFor(() => expect(getComputedStyle(chevron).transform).toBe('none'));
    });

    await step('aberto, o CSS gira 180° a partir do estado no trigger', async () => {
      await open(trigger);
      // matrix(-1, 0, 0, -1, 0, 0) é a forma computada de rotate(180deg).
      await waitFor(() =>
        expect(getComputedStyle(chevron).transform).toBe('matrix(-1, 0, 0, -1, 0, 0)'),
      );
    });
  },
};
