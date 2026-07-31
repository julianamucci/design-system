import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, fn } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import AlertDocs from '@/components/docs/AlertDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { Info } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDocs) },
  },
  // A aba "API Reference" combina o docgen com estes argTypes. O slot default
  // fica sem control porque o template da story fixa a composição.
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
      description: 'Variante semântica do alert.',
      table: { type: { summary: "'default' | 'destructive' | 'success' | 'warning' | 'info'" }, defaultValue: { summary: "'default'" } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz. Esta stack usa class, não className.',
      table: { type: { summary: 'string' } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Exibe o botão de fechar no canto superior direito. Fechar remove o alert da tela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dismissLabel: {
      control: false,
      description: 'Rótulo acessível do botão de fechar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Fechar alerta'" } },
    },
    onDismiss: {
      control: false,
      description: 'Emit dismiss — disparado uma única vez quando o usuário aciona o botão de fechar.',
      table: { category: 'events', type: { summary: '@dismiss' } },
    },
    default: {
      control: false,
      description: 'Slot de composição: ícone opcional, AlertTitle, AlertDescription e AlertAction.',
      table: { type: { summary: 'slot' } },
    },
  },
  args: {
    variant: 'default',
    dismissible: false,
    onDismiss: fn(),
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return { args }; },
    template: `
      <Alert v-bind="args">
        <Info class="" style="height: 1rem; width: 1rem" aria-hidden="true" />
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

    await step('AlertTitle é H5 por default', async () => {
      await expect(canvas.getByText('Atenção').tagName).toBe('H5');
    });

    await step('AlertDescription é renderizado corretamente', async () => {
      await expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible();
    });

    await step('Variante default aplica classes corretas', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toHaveClass('nds-alert');
    });
  },
};
