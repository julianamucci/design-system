import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, within } from 'storybook/test';
import { Plus } from 'lucide-vue-next';
import { Button } from './index';
import {
  buttonIconLgSource,
  buttonIconSmSource,
  buttonIconSource,
  buttonIconXsSource,
  buttonSizeLgSource,
  buttonSizeDefaultSource,
  buttonSizeSmSource,
  buttonSizeXsSource,
} from './button.source';

const meta: Meta<any> = {
  title: 'Primitives/Form/Button/Sizes',
  component: Button,
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: buttonSizeDefaultSource } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Button },
    template: '<Button>Padrão</Button>',
  }),
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Tamanho padrão. Use em formulários e diálogos como default.' } },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /padrão/i });
    await expect(btn).toHaveClass('nds-button');
    await expect(btn).not.toHaveClass('nds-button-xs');
    await expect(btn).not.toHaveClass('nds-button-sm');
    await expect(btn).not.toHaveClass('nds-button-lg');
  },
};

export const ExtraSmall: Story = {
  render: () => ({
    components: { Button },
    template: '<Button size="xs">Mínimo</Button>',
  }),
  // Outro tamanho e outro rótulo: os args não descrevem nada nesta story.
  parameters: {
    docs: {
      source: { transform: buttonSizeXsSource },
      description: { story: 'Tamanho mínimo. Use em densidades máximas: chips de filtro e ações dentro de linha de tabela.' },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /mínimo/i });
    await expect(btn).toHaveClass('nds-button-xs');
  },
};

export const Small: Story = {
  render: () => ({
    components: { Button },
    template: '<Button size="sm">Pequeno</Button>',
  }),
  // Outro tamanho e outro rótulo: os args não descrevem nada nesta story.
  parameters: {
    docs: {
      source: { transform: buttonSizeSmSource },
      description: { story: 'Tamanho pequeno. Use em toolbars e áreas densas.' },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /pequeno/i });
    await expect(btn).toHaveClass('nds-button-sm');
  },
};

export const Large: Story = {
  render: () => ({
    components: { Button },
    template: '<Button size="lg">Grande</Button>',
  }),
  // Outro tamanho e outro rótulo: os args não descrevem nada nesta story.
  parameters: {
    docs: {
      source: { transform: buttonSizeLgSource },
      description: { story: 'Tamanho grande. Use em CTAs de destaque e hero sections.' },
    },
  },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /grande/i });
    await expect(btn).toHaveClass('nds-button-lg');
  },
};

// Os quatro botões icon-only repetem a mesma play de propósito: cada story
// afirma o próprio tamanho. Uma play compartilhada cobriria os quatro com uma
// asserção só, e trocar icon-lg por icon-xs passaria em todas.

export const Icon: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  parameters: {
    covers: ['functional.item6', 'accessibility.item4'],
    // Sem texto dentro: o ícone e o rótulo acessível são a composição, e a do
    // meta mostraria um botão de texto.
    docs: {
      source: { transform: buttonIconSource },
      description: { story: 'Botão ícone padrão. Sempre forneça aria-label descritivo.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Adicionar item' });

    await step('Botão icon-only é acessível via aria-label', async () => {
      await expect(button).toBeInTheDocument();
    });

    await step('O tamanho pedido é a classe aplicada', async () => {
      await expect(button).toHaveClass('nds-button-icon');
    });
  },
};

export const IconExtraSmall: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon-xs" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  // Sem texto dentro: o ícone e o rótulo acessível são a composição.
  parameters: {
    docs: {
      source: { transform: buttonIconXsSource },
      description: { story: 'Botão ícone mínimo. Use em linhas de tabela e listas densas.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Adicionar item' });

    await step('Botão icon-only é acessível via aria-label', async () => {
      await expect(button).toBeInTheDocument();
    });

    await step('O tamanho pedido é a classe aplicada', async () => {
      await expect(button).toHaveClass('nds-button-icon-xs');
    });
  },
};

export const IconSmall: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon-sm" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  // Sem texto dentro: o ícone e o rótulo acessível são a composição.
  parameters: {
    docs: {
      source: { transform: buttonIconSmSource },
      description: { story: 'Botão ícone pequeno. Use em toolbars compactas.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Adicionar item' });

    await step('Botão icon-only é acessível via aria-label', async () => {
      await expect(button).toBeInTheDocument();
    });

    await step('O tamanho pedido é a classe aplicada', async () => {
      await expect(button).toHaveClass('nds-button-icon-sm');
    });
  },
};

export const IconLarge: Story = {
  render: () => ({
    components: { Button, Plus },
    template: `
      <Button size="icon-lg" aria-label="Adicionar item">
        <Plus aria-hidden="true" />
      </Button>
    `,
  }),
  // Sem texto dentro: o ícone e o rótulo acessível são a composição.
  parameters: {
    docs: {
      source: { transform: buttonIconLgSource },
      description: { story: 'Botão ícone grande. Use como FAB ou CTAs visuais.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Adicionar item' });

    await step('Botão icon-only é acessível via aria-label', async () => {
      await expect(button).toBeInTheDocument();
    });

    await step('O tamanho pedido é a classe aplicada', async () => {
      await expect(button).toHaveClass('nds-button-icon-lg');
    });
  },
};
