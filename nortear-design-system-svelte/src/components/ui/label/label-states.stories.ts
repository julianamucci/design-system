import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import {
  themeContrast,
  cursorComputado,
  opacityComputada,
} from '@shared/testing/label-probe';
import LabelStory from './LabelStory.svelte';
import LabelDisabledPeerStory from './LabelDisabledPeerStory.svelte';
import LabelDisabledGroupStory from './LabelDisabledGroupStory.svelte';
import {
  labelDisabledSiblingSource,
  blockLabelDisabledSource,
  labelObrigatorioSource,
  labelSource,
} from './label.source';

/**
 * Estados do rótulo.
 *
 * Desabilitado não é prop do rótulo: o estado vem por cascata do CSS, seja do
 * controle irmão marcado com `nds-peer`, seja de um ancestral com
 * `data-disabled="true"`. O rótulo não recebe classe nenhuma nos dois casos.
 */
const meta: Meta = {
  title: 'Primitives/Form/Label/States',
  component: LabelStory,
  tags: ['form'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; a de estado padrão já é a
      // forma canônica, as demais sobrescrevem logo abaixo.
      source: { transform: labelSource },
      description: {
        component:
          'Estados do rótulo: padrão, desabilitado pelo controle irmão, desabilitado pelo bloco e obrigatório.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: () => ({
    Component: LabelStory,
    props: { children: 'Nome completo', for: 'estado-padrao' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Nome completo');

    await step('O rótulo está em opacidade cheia', async () => {
      // Efeito computado, não nome de classe.
      await expect(opacityComputada(label)).toBe(1);
    });

    await step('O contraste do texto passa em AA nos dois temas', async () => {
      // O axe do test-runner só vê o tema claro. 4.5 porque o rótulo é texto
      // normal: 14px em peso 500 não alcança o limite de texto grande.
      const { light, escuro } = themeContrast(label);
      await expect(light).toBeGreaterThanOrEqual(4.5);
      await expect(escuro).toBeGreaterThanOrEqual(4.5);
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item3'],
    docs: { source: { transform: labelDisabledSiblingSource } },
  },
  render: () => ({ Component: LabelDisabledPeerStory, props: {} }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('CPF');
    const input = canvasElement.querySelector<HTMLInputElement>('#cpf-disabled')!;

    await step('O controle está desabilitado', async () => {
      await expect(input).toBeDisabled();
    });

    await step('O rótulo esmaece junto e mostra o cursor de bloqueio', async () => {
      await expect(opacityComputada(label)).toBeLessThan(1);
      await expect(cursorComputado(label)).toBe('not-allowed');
    });
  },
};

export const DisabledViaGroup: Story = {
  parameters: {
    covers: ['functional.item4'],
    docs: { source: { transform: blockLabelDisabledSource } },
  },
  render: () => ({ Component: LabelDisabledGroupStory, props: {} }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText('Documento');

    await step('O rótulo herda o estado do bloco desabilitado', async () => {
      await expect(label.closest('[data-disabled="true"]')).toBeInTheDocument();
      await expect(opacityComputada(label)).toBeLessThan(1);
      await expect(getComputedStyle(label).pointerEvents).toBe('none');
    });
  },
};

export const Required: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item3', 'visual.item2'],
    docs: { source: { transform: labelObrigatorioSource } },
  },
  render: () => ({
    Component: LabelStory,
    props: { children: 'Email profissional', for: 'estado-required', required: true },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const marcador = canvasElement.querySelector<HTMLElement>('.nds-text-destructive')!;
    const input = canvas.getByRole('textbox');

    await step('O asterisco é visível e decorativo', async () => {
      await expect(marcador).toBeVisible();
      await expect(marcador.textContent?.trim()).toBe('*');
      await expect(marcador).toHaveAttribute('aria-hidden', 'true');
    });

    await step('A obrigatoriedade é anunciada pelo controle', async () => {
      await expect(input).toHaveAttribute('aria-required', 'true');
    });
  },
};
