import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createButton, createButtonIcon } from './button';

const meta: Meta = {
  tags: ['form'],
  parameters: {
    design: figmaDesign('button'),
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Button/Tamanhos',
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => createButton({ size: 'default', label: 'Padrão' }),
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
  render: () => createButton({ size: 'xs', label: 'Mínimo' }),
  parameters: { docs: { description: { story: 'Tamanho mínimo. Use em densidades máximas: chips de filtro e ações dentro de linha de tabela.' } } },
  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /mínimo/i });
    await expect(btn).toHaveClass('nds-button-xs');
  },
};

export const Small: Story = {
  render: () => createButton({ size: 'sm', label: 'Pequeno' }),
  parameters: { docs: { description: { story: 'Tamanho pequeno. Use em toolbars e áreas densas.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /pequeno/i });
    await expect(btn).toHaveClass('nds-button-sm');
  },
};

export const Large: Story = {
  render: () => createButton({ size: 'lg', label: 'Grande' }),
  parameters: { docs: { description: { story: 'Tamanho grande. Use em CTAs de destaque e hero sections.' } } },

  play: async ({ canvasElement }) => {
    const btn = within(canvasElement).getByRole('button', { name: /grande/i });
    await expect(btn).toHaveClass('nds-button-lg');
  },
};

// Os quatro botões icon-only repetem a mesma play de propósito: cada story
// afirma o próprio tamanho. Uma play compartilhada cobriria os quatro com uma
// asserção só, e trocar icon-lg por icon-xs passaria em todas.

export const Icon: Story = {
  render: () => {
    const btn = createButton({ size: 'icon', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: {
    covers: ['functional.item6', 'accessibility.item4'],
    docs: { description: { story: 'Botão ícone padrão. Sempre forneça aria-label descritivo.' } },
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
  render: () => {
    const btn = createButton({ size: 'icon-xs', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone mínimo. Use em linhas de tabela e listas densas.' } } },
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
  render: () => {
    const btn = createButton({ size: 'icon-sm', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone pequeno. Use em toolbars compactas.' } } },
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
  render: () => {
    const btn = createButton({ size: 'icon-lg', ariaLabel: 'Adicionar item' });
    btn.appendChild(createButtonIcon('plus'));
    return btn;
  },
  parameters: { docs: { description: { story: 'Botão ícone grande. Use como FAB ou CTAs visuais.' } } },
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
