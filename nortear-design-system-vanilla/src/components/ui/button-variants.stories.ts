import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { createButton } from './button';
import { buttonSource, buttonSourceWith } from './button.source';
import { within, expect } from 'storybook/test';
import { contrastDeTextFailures } from '@shared/testing/button-probe';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: buttonSource } },
  },
  title: 'UI/Button/Variants',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ variant: 'default', label: 'Salvar' }),
  parameters: {
    covers: ['visual.item2'],
    docs: { description: { story: 'Variante primária. Use para a ação principal de uma seção.' } },
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
  render: () => createButton({ variant: 'destructive', label: 'Excluir conta' }),
  parameters: {
    // Override de story: a variante não passa por control neste arquivo, e o
    // snippet do meta mostraria a padrão onde a story renderiza a destrutiva.
    docs: {
      source: { transform: buttonSourceWith({ variant: 'destructive', label: 'Excluir conta' }) },
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
  render: () => createButton({ variant: 'outline', label: 'Cancelar' }),
  parameters: {
    // Override de story: a variante não passa por control neste arquivo.
    docs: {
      source: { transform: buttonSourceWith({ variant: 'outline', label: 'Cancelar' }) },
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
  render: () => createButton({ variant: 'secondary', label: 'Ver detalhes' }),
  parameters: {
    // Override de story: a variante não passa por control neste arquivo.
    docs: {
      source: { transform: buttonSourceWith({ variant: 'secondary', label: 'Ver detalhes' }) },
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
  render: () => createButton({ variant: 'ghost', label: 'Fechar' }),
  parameters: {
    // Override de story: a variante não passa por control neste arquivo.
    docs: {
      source: { transform: buttonSourceWith({ variant: 'ghost', label: 'Fechar' }) },
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
  render: () => createButton({ variant: 'link', label: 'Saiba mais' }),
  parameters: {
    // Override de story: a variante não passa por control neste arquivo.
    docs: {
      source: { transform: buttonSourceWith({ variant: 'link', label: 'Saiba mais' }) },
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
