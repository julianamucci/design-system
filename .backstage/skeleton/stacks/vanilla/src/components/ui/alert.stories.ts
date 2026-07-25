import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from './alert';
import { createAlertDocs } from '@/components/docs/AlertDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AlertArgs = {
  variant: 'default' | 'destructive';
  title: string;
  description: string;
};

const meta: Meta<AlertArgs> = {
  title: 'UI/Alert',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createAlertDocs) },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
      description: 'Variante visual nativa do Alert',
    },
    title:       { control: 'text', description: 'Título do Alert'      },
    description: { control: 'text', description: 'Descrição do Alert'   },
  },
  args: {
    variant:     'default',
    title:       'Atenção',
    description: 'Suas alterações serão aplicadas na próxima sessão.',
  },
};

export default meta;
type Story = StoryObj<AlertArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildAlert(args: AlertArgs): HTMLElement {
  const alert = createAlert({ variant: args.variant });
  alert.appendChild(createAlertIcon(args.variant === 'destructive' ? 'error' : 'info'));
  if (args.title) alert.appendChild(createAlertTitle({ text: args.title }));
  alert.appendChild(createAlertDescription({ text: args.description }));
  return alert;
}

export const Playground: Story = {
  render: (args) => buildAlert(args),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento alert está presente no DOM', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toBeInTheDocument();
    });

    await step('Alert está visível', async () => {
      await expect(canvas.getByRole('alert')).toBeVisible();
    });

    await step('AlertTitle é renderizado corretamente', async () => {
      await expect(canvas.getByText('Atenção')).toBeVisible();
    });

    await step('AlertDescription é renderizado corretamente', async () => {
      await expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible();
    });
  },
};
