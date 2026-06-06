import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import ResizableStory from './ResizableStory.svelte';

const meta = {
  title: 'UI/Resizable/Estados',
  component: ResizableStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados visuais do Resizable — idle (padrão), focus (handle focado por teclado) e withHandle (pegador visual centralizado).',
      },
    },
  },
} satisfies Meta<typeof ResizableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'horizontal',
      withHandle: false,
      sidebarLabel: 'Sidebar',
      contentLabel: 'Conteúdo principal',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '220px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Handle presente sem pegador visual', async () => {
      const handle = canvas.getByRole('separator', { name: /Redimensionar/ });
      await expect(handle).toBeInTheDocument();
    });
  },
};

export const WithHandle: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'withHandle',
      direction: 'horizontal',
      leftLabel: 'Esquerda',
      rightLabel: 'Direita',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '220px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Handle renderizado com pegador visual interno', async () => {
      const handle = canvasElement.querySelector('[data-slot="resizable-handle"]');
      await expect(handle).toBeInTheDocument();
      const grabber = handle?.querySelector('div');
      await expect(grabber).toBeInTheDocument();
    });
  },
};

export const Focus: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'horizontal',
      withHandle: true,
      sidebarLabel: 'Sidebar',
      contentLabel: 'Conteúdo',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '220px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Tab move foco até o handle', async () => {
      const handle = canvas.getByRole('separator', { name: /Redimensionar/ });
      handle.focus();
      await expect(handle).toHaveFocus();
    });
    await step('Setas operam o handle (sem erro)', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await userEvent.keyboard('{ArrowLeft}');
    });
  },
};
