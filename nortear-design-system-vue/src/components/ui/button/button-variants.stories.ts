import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { Button } from './index';
import { contrastDeTextFailures } from '@shared/testing/button-probe';
import {
  buttonDestructiveSource,
  buttonGhostSource,
  buttonLinkSource,
  buttonOutlineSource,
  buttonDefaultSource,
  buttonSecundarioSource,
} from './button.source';

const meta: Meta<any> = {
  title: 'Primitives/Form/Button/Variants',
  component: Button,
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: buttonDefaultSource } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Button },
    template: '<Button>Salvar</Button>',
  }),
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
  render: () => ({
    components: { Button },
    template: '<Button variant="destructive">Excluir conta</Button>',
  }),
  parameters: {
    // Outra variante e outro rótulo: os args não descrevem nada nesta story.
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
  render: () => ({
    components: { Button },
    template: '<Button variant="outline">Cancelar</Button>',
  }),
  parameters: {
    // Outra variante e outro rótulo: os args não descrevem nada nesta story.
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
  render: () => ({
    components: { Button },
    template: '<Button variant="secondary">Ver detalhes</Button>',
  }),
  parameters: {
    // Outra variante e outro rótulo: os args não descrevem nada nesta story.
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
  render: () => ({
    components: { Button },
    template: '<Button variant="ghost">Fechar</Button>',
  }),
  parameters: {
    // Outra variante e outro rótulo: os args não descrevem nada nesta story.
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
  render: () => ({
    components: { Button },
    template: '<Button variant="link">Saiba mais</Button>',
  }),
  parameters: {
    // Outra variante e outro rótulo: os args não descrevem nada nesta story.
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
