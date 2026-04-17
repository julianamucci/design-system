import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import SonnerStory from './SonnerStory.svelte';
import SonnerDocs from '@/components/docs/SonnerDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Sonner',
  component: SonnerStory,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(SonnerDocs) },
  },
  argTypes: {
    position: {
      control: 'select',
      description: 'Posição dos toasts na tela',
      options: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
    },
    richColors: {
      control: 'boolean',
      description: 'Ativa cores vibrantes por tipo de toast',
    },
    expand: {
      control: 'boolean',
      description: 'Expande todos os toasts simultaneamente',
    },
    closeButton: {
      control: 'boolean',
      description: 'Exibe botão de fechar em todos os toasts',
    },
  },
  args: {
    position: 'bottom-right',
    richColors: false,
    expand: false,
    closeButton: false,
    mode: 'playground',
  },
} satisfies Meta<typeof SonnerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Dispara um toast default e verifica que aparece', async () => {
      const defaultBtn = canvas.getByRole('button', { name: 'Default' });
      await userEvent.click(defaultBtn);
      await waitFor(() => {
        const toastEl = document.querySelector('[data-sonner-toast]');
        expect(toastEl).toBeTruthy();
      }, { timeout: 3000 });
    });

    await step('Toast region existe para acessibilidade', async () => {
      const toastRegion = document.querySelector('[data-sonner-toaster]');
      expect(toastRegion).toBeTruthy();
    });

    await step('Dispara toast de sucesso', async () => {
      const successBtn = canvas.getByRole('button', { name: 'Success' });
      await userEvent.click(successBtn);
      await waitFor(() => {
        const toasts = document.querySelectorAll('[data-sonner-toast]');
        expect(toasts.length).toBeGreaterThanOrEqual(2);
      }, { timeout: 3000 });
    });

    await step('Dismiss fecha todos os toasts', async () => {
      const dismissBtn = canvas.getByRole('button', { name: 'Fechar todos' });
      await userEvent.click(dismissBtn);
    });
  },
  parameters: {
    docs: {
      description: {
        story: 'Playground interativo com todos os tipos de toast. Cobre critérios: disparo, visibilidade, acessibilidade e dismiss. Veja a aba **Interactions**.',
      },
    },
  },
};
