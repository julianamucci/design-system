import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import ResizableStory from './ResizableStory.svelte';
import { SEL_GROUP, fracoes, panelsDiretos } from './resizable.fixtures';
import {
  resizableNestedSource,
  resizableWithGrabberSource,
  resizableHorizontalSource,
  resizableSource,
  resizableVerticalSource,
} from './resizable.source';

const meta: Meta = {
  title: 'Components/Layout/Resizable/Variants',
  component: ResizableStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com o
      // seu próprio arranjo de painéis logo abaixo.
      source: { transform: resizableSource },
      description: {
        component:
          'Variantes do Resizable: Horizontal (split lateral), Vertical (split empilhado), Nested (grupo dentro de painel) e WithHandle (pegador visual centralizado).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: resizableHorizontalSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: 'horizontal',
      defaultSize: 30,
      minSize: 20,
      labelA: 'Sidebar',
      labelB: 'Conteúdo principal',
      ariaLabel: 'Redimensionar as colunas — use setas para ajustar',
      height: '240px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Split lateral: o divisor é uma linha vertical', async () => {
      // O CSS decide espessura e cursor pelo eixo do punho. Um grupo horizontal
      // é dividido por uma linha VERTICAL — a inversão é a fonte clássica de
      // erro aqui.
      const group = canvasElement.querySelector<HTMLElement>(SEL_GROUP)!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute('aria-orientation', 'vertical');
      await expect(getComputedStyle(group).flexDirection).toBe('row');
      await expect(punho.getBoundingClientRect().width).toBeLessThan(4);
    });

    await step('Os painéis dividem a LARGURA na proporção declarada', async () => {
      const group = canvasElement.querySelector(SEL_GROUP)!;
      await expect(fracoes(panelsDiretos(group))[0]).toBeCloseTo(0.3, 1);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: resizableVerticalSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: 'vertical',
      defaultSize: 40,
      minSize: 20,
      labelA: 'Topo',
      labelB: 'Rodapé',
      ariaLabel: 'Redimensionar as faixas — use setas para ajustar',
      height: '300px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Split empilhado: o divisor é uma linha deitada', async () => {
      const group = canvasElement.querySelector<HTMLElement>(SEL_GROUP)!;
      const punho = canvasElement.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!;
      await expect(punho).toHaveAttribute('aria-orientation', 'horizontal');
      await expect(getComputedStyle(group).flexDirection).toBe('column');
      await expect(punho.getBoundingClientRect().height).toBeLessThan(4);
    });

    await step('Os painéis dividem a ALTURA, e não a largura', async () => {
      // O eixo trocado é invisível numa foto quadrada: os dois painéis
      // apareceriam empilhados de qualquer jeito e só a proporção denunciaria.
      const group = canvasElement.querySelector(SEL_GROUP)!;
      await expect(fracoes(panelsDiretos(group), 'vertical')[0]).toBeCloseTo(0.4, 1);
    });
  },
};

export const Nested: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: resizableNestedSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'nested',
      direction: 'horizontal',
      defaultSize: 30,
      minSize: 20,
      labelA: 'Sidebar',
      innerTop: 'Editor',
      innerBottom: 'Console',
      ariaLabel: 'Redimensionar sidebar e conteúdo — use setas',
      innerAriaLabel: 'Redimensionar editor e console — use setas',
      height: '320px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada grupo governa só os próprios painéis', async () => {
      // O grupo de dentro é outro grupo: os painéis dele não podem entrar na
      // conta do de fora, senão um ajuste move os dois layouts ao mesmo tempo.
      const groups = [...canvasElement.querySelectorAll(SEL_GROUP)];
      await expect(groups).toHaveLength(2);
      for (const g of groups) await expect(panelsDiretos(g)).toHaveLength(2);
    });

    await step('O divisor de dentro tem o eixo do grupo de dentro', async () => {
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar sidebar e conteúdo — use setas' }),
      ).toHaveAttribute('aria-orientation', 'vertical');
      await expect(
        canvas.getByRole('separator', { name: 'Redimensionar editor e console — use setas' }),
      ).toHaveAttribute('aria-orientation', 'horizontal');
    });

    await step('E as proporções de cada grupo são independentes', async () => {
      const groups = [...canvasElement.querySelectorAll(SEL_GROUP)];
      await expect(fracoes(panelsDiretos(groups[0]))[0]).toBeCloseTo(0.3, 1);
      await expect(fracoes(panelsDiretos(groups[1]), 'vertical')[0]).toBeCloseTo(0.6, 1);
    });
  },
};

export const WithHandle: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: resizableWithGrabberSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: 'horizontal',
      withHandle: true,
      defaultSize: 50,
      minSize: 20,
      labelA: 'Antes',
      labelB: 'Depois',
      ariaLabel: 'Redimensionar painéis — use setas',
      height: '240px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O pegador aparece e é maior que a linha de 1px', async () => {
      // A linha sozinha é quase invisível; o pegador é o que anuncia que ali
      // existe um controle. É por isso que a guideline pede o pegador em
      // desktop.
      const grip = canvasElement.querySelector<HTMLElement>('.nds-resizable-grip-bar')!;
      await expect(grip).toBeInTheDocument();
      await expect(grip.getBoundingClientRect().height).toBeGreaterThan(8);
    });

    await step('O pegador não rouba o nome acessível do divisor', async () => {
      // Quem carrega o significado é o `aria-label` do separator; o pegador é
      // desenho. Um elemento com texto ali dentro passaria a compor o nome.
      const punho = canvas.getByRole('separator', { name: 'Redimensionar painéis — use setas' });
      await expect(punho.querySelector('.nds-resizable-grip-bar')?.textContent?.trim()).toBe('');
    });
  },
};
