import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect, within } from 'storybook/test';
import { Button } from './index';
import ButtonStory from './ButtonStory.svelte';
import { contrastDeTextFailures } from '@shared/testing/button-probe';
import {
  buttonDestructiveSource,
  buttonGhostSource,
  buttonLinkSource,
  buttonOutlineSource,
  buttonDefaultSource,
  buttonSecundarioSource,
  buttonSource,
} from './button.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada variante sobrescreve
      // com o próprio par de variante e rótulo logo abaixo.
      source: { transform: buttonSource },
    },
  },
  title: 'Primitives/Form/Button/Variants',
  component: Button,
  tags: ['form'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'default', label: 'Salvar' } }),
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: buttonDefaultSource },
      description: { story: 'Variante primária. Use para a ação principal de uma seção.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /salvar/i });
    await expect(btn).toHaveClass('nds-button-default');

    // accessibility.item2 — contraste minimo 4.5:1 em TODAS as variantes.
    // O campo how do item dizia "axe-core / Lighthouse", e nenhum dos dois
    // olhava esta matriz: o axe do test-runner mede o que esta na tela, e a
    // tela esta sempre no tema claro padrao — cinco sextos das combinacoes
    // nunca foram verificados. A sonda varre os tres temas nos dois modos e
    // compoe o alfa do fundo antes de dividir.
    await expect(contrastDeTextFailures(canvasElement, 4.5)).toEqual([]);
  },
};

export const Destructive: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'destructive', label: 'Excluir conta' } }),
  parameters: {
    docs: {
      source: { transform: buttonDestructiveSource },
      description: { story: 'Variante destrutiva. Use para ações irreversíveis como excluir ou remover.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /excluir conta/i });
    await expect(btn).toHaveClass('nds-button-destructive');

    // accessibility.item2 — contraste minimo 4.5:1 em TODAS as variantes.
    // O campo how do item dizia "axe-core / Lighthouse", e nenhum dos dois
    // olhava esta matriz: o axe do test-runner mede o que esta na tela, e a
    // tela esta sempre no tema claro padrao — cinco sextos das combinacoes
    // nunca foram verificados. A sonda varre os tres temas nos dois modos e
    // compoe o alfa do fundo antes de dividir.
    await expect(contrastDeTextFailures(canvasElement, 4.5)).toEqual([]);
  },
};

export const Outline: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'outline', label: 'Cancelar' } }),
  parameters: {
    docs: {
      source: { transform: buttonOutlineSource },
      description: { story: 'Variante secundária com borda. Use ao lado da ação primária em pares de ações.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /cancelar/i });
    await expect(btn).toHaveClass('nds-button-outline');

    // accessibility.item2 — contraste minimo 4.5:1 em TODAS as variantes.
    // O campo how do item dizia "axe-core / Lighthouse", e nenhum dos dois
    // olhava esta matriz: o axe do test-runner mede o que esta na tela, e a
    // tela esta sempre no tema claro padrao — cinco sextos das combinacoes
    // nunca foram verificados. A sonda varre os tres temas nos dois modos e
    // compoe o alfa do fundo antes de dividir.
    await expect(contrastDeTextFailures(canvasElement, 4.5)).toEqual([]);
  },
};

export const Secondary: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'secondary', label: 'Ver detalhes' } }),
  parameters: {
    docs: {
      source: { transform: buttonSecundarioSource },
      description: { story: 'Variante secundária sólida. Use para ações complementares de menor ênfase.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /ver detalhes/i });
    await expect(btn).toHaveClass('nds-button-secondary');

    // accessibility.item2 — contraste minimo 4.5:1 em TODAS as variantes.
    // O campo how do item dizia "axe-core / Lighthouse", e nenhum dos dois
    // olhava esta matriz: o axe do test-runner mede o que esta na tela, e a
    // tela esta sempre no tema claro padrao — cinco sextos das combinacoes
    // nunca foram verificados. A sonda varre os tres temas nos dois modos e
    // compoe o alfa do fundo antes de dividir.
    await expect(contrastDeTextFailures(canvasElement, 4.5)).toEqual([]);
  },
};

export const Ghost: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'ghost', label: 'Fechar' } }),
  parameters: {
    docs: {
      source: { transform: buttonGhostSource },
      description: { story: 'Variante sem borda ou fundo. Use em toolbars e menus para reduzir ruído visual.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /fechar/i });
    await expect(btn).toHaveClass('nds-button-ghost');

    // accessibility.item2 — contraste minimo 4.5:1 em TODAS as variantes.
    // O campo how do item dizia "axe-core / Lighthouse", e nenhum dos dois
    // olhava esta matriz: o axe do test-runner mede o que esta na tela, e a
    // tela esta sempre no tema claro padrao — cinco sextos das combinacoes
    // nunca foram verificados. A sonda varre os tres temas nos dois modos e
    // compoe o alfa do fundo antes de dividir.
    await expect(contrastDeTextFailures(canvasElement, 4.5)).toEqual([]);
  },
};

export const Link: Story = {
  render: () => ({ Component: ButtonStory, props: { variant: 'link', label: 'Saiba mais' } }),
  parameters: {
    docs: {
      source: { transform: buttonLinkSource },
      description: { story: 'Variante com aparência de link. Use quando a ação for navegacional em contexto textual.' },
    },
  },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /saiba mais/i });
    await expect(btn).toHaveClass('nds-button-link');

    // accessibility.item2 — contraste minimo 4.5:1 em TODAS as variantes.
    // O campo how do item dizia "axe-core / Lighthouse", e nenhum dos dois
    // olhava esta matriz: o axe do test-runner mede o que esta na tela, e a
    // tela esta sempre no tema claro padrao — cinco sextos das combinacoes
    // nunca foram verificados. A sonda varre os tres temas nos dois modos e
    // compoe o alfa do fundo antes de dividir.
    await expect(contrastDeTextFailures(canvasElement, 4.5)).toEqual([]);
  },
};
