import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import SonnerStory from './SonnerStory.svelte';
import SonnerPlaygroundStory from './SonnerPlaygroundStory.svelte';
import SonnerDocs from '@/components/docs/SonnerDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Sonner',
  component: SonnerStory,
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
    layout: 'padded',
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'top-center', 'bottom-right', 'bottom-left', 'bottom-center'],
      description: 'Posição dos toasts na tela',
    },
    richColors: {
      control: 'boolean',
      description: 'Aplica cores semânticas do tema para cada tipo de toast',
    },
    expand: {
      control: 'boolean',
      description: 'Exibe todos os toasts expandidos ao invés de empilhados',
    },
    duration: {
      control: 'number',
      description: 'Duração em ms antes do toast fechar automaticamente',
    },
  },
  args: {
    position: 'top-right',
    richColors: true,
    expand: false,
    duration: 4000,
  },
} satisfies Meta<typeof SonnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: SonnerPlaygroundStory,
    props: args,
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
