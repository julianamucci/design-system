import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import AlertDocs from '@/components/docs/AlertDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Variante visual nativa do Alert',
    },
  },
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return { args }; },
    template: `
      <Alert v-bind="args">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento alert está presente no DOM', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toBeInTheDocument();
    });

    await step('Alert está visível', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toBeVisible();
    });

    await step('AlertTitle é renderizado corretamente', async () => {
      await expect(canvas.getByText('Atenção')).toBeVisible();
    });

    await step('AlertDescription é renderizado corretamente', async () => {
      await expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible();
    });

    await step('Variante default aplica classes corretas', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toHaveClass('bg-card');
    });
  },
};
