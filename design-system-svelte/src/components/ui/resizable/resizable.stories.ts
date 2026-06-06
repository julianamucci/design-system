import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { PaneGroup } from './index';
import ResizableStory from './ResizableStory.svelte';
import ResizableDocs from '@/components/docs/ResizableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Resizable',
  component: PaneGroup,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ResizableDocs),
      description: {
        component:
          'Resizable — painéis redimensionáveis via paneforge (PaneGroup, Pane, PaneResizer). Suporta layouts horizontal, vertical e aninhados, com redimensionamento por arrasto e teclado (WCAG 2.5.7).',
      },
    },
  },
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Direção do PaneGroup',
    },
  },
  args: {
    direction: 'horizontal',
  },
} satisfies Meta<typeof PaneGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ResizableStory,
    props: {
      variant: 'horizontal',
      direction: args.direction,
      withHandle: true,
      sidebarLabel: 'Sidebar',
      contentLabel: 'Conteúdo principal',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '260px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('PaneGroup renderizado com data-slot', async () => {
      const group = canvasElement.querySelector('[data-slot="resizable-pane-group"]');
      await expect(group).toBeInTheDocument();
    });

    await step('Handle com role="separator" e aria-label descritivo', async () => {
      const handle = canvas.getByRole('separator', { name: /Redimensionar painéis/ });
      await expect(handle).toBeInTheDocument();
    });

    await step('Labels dos painéis visíveis', async () => {
      await expect(canvas.getByText('Sidebar')).toBeVisible();
      await expect(canvas.getByText('Conteúdo principal')).toBeVisible();
    });

    await step('Handle é focável por teclado (tabIndex)', async () => {
      const handle = canvas.getByRole('separator', { name: /Redimensionar painéis/ });
      await expect(handle).toHaveAttribute('tabindex');
    });
  },
};
