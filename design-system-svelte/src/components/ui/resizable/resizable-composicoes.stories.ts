import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import ResizableStory from './ResizableStory.svelte';

const meta = {
  title: 'UI/Resizable/Composicoes',
  component: ResizableStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Resizable — Sidebar + Conteúdo, Editor + Preview e layout aninhado tipo IDE (Sidebar | Editor / Console).',
      },
    },
  },
} satisfies Meta<typeof ResizableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SidebarLayout: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'horizontal',
      withHandle: true,
      sidebarLabel: 'Navegação',
      contentLabel: 'Conteúdo principal',
      ariaLabel: 'Redimensionar sidebar — use setas para ajustar',
      height: '280px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Sidebar e conteúdo renderizados', async () => {
      await expect(canvas.getByText('Navegação')).toBeVisible();
      await expect(canvas.getByText('Conteúdo principal')).toBeVisible();
    });
    await step('Handle com aria-label contextual', async () => {
      const handle = canvas.getByRole('separator', { name: /sidebar/i });
      await expect(handle).toBeInTheDocument();
    });
  },
};

export const EditorPreview: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'withHandle',
      direction: 'horizontal',
      leftLabel: 'Editor',
      rightLabel: 'Preview',
      ariaLabel: 'Redimensionar editor e preview — use setas',
      height: '320px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Editor e Preview visíveis', async () => {
      await expect(canvas.getByText('Editor')).toBeVisible();
      await expect(canvas.getByText('Preview')).toBeVisible();
    });
  },
};

export const VerticalSplit: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'vertical',
      withHandle: true,
      topLabel: 'Lista',
      bottomLabel: 'Detalhe',
      ariaLabel: 'Redimensionar lista e detalhe — use setas',
      height: '360px',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const IDELayout: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'nested',
      withHandle: true,
      sidebarLabel: 'Arquivos',
      topLabel: 'Editor',
      bottomLabel: 'Console',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '380px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Composição IDE com 2 PaneGroups', async () => {
      const groups = canvasElement.querySelectorAll('[data-slot="resizable-pane-group"]');
      await expect(groups.length).toBe(2);
    });
  },
};
