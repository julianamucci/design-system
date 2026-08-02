import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertDocs from '@/components/docs/AlertDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDocs) },
  },
  // O docgen do Svelte está desligado no .storybook/main.ts: a aba
  // "API Reference" sai só destes argTypes.
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
      description: 'Variante semântica do alert.',
      table: { type: { summary: "'default' | 'destructive' | 'success' | 'warning' | 'info'" }, defaultValue: { summary: "'default'" } },
    },
    dismissible: {
      control: 'boolean',
      description: 'Exibe o botão de fechar no canto superior direito. Fechar remove o alert da tela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onDismiss: {
      control: false,
      description: 'Callback de fechamento — disparado quando o usuário aciona o botão de fechar.',
      table: { type: { summary: '() => void' } },
    },
    dismissLabel: {
      control: false,
      description: 'Rótulo acessível do botão de fechar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Fechar alerta'" } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz. Esta stack usa class, não className.',
      table: { type: { summary: 'string' } },
    },
    children: {
      control: false,
      description: 'Snippet de composição: ícone opcional, AlertTitle, AlertDescription e AlertAction.',
      table: { type: { summary: 'Snippet' } },
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
  // Sem docgen, o gerador de source monta a tag a partir do nome interno da
  // função compilada (`<wrapper …/>`). O snippet vai explícito, montado a
  // partir dos args para acompanhar os controls.
  parameters: {
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: { variant?: string; dismissible?: boolean } }) => {
          const variant = ctx.args?.variant ?? 'default';
          const variantAttr = variant === 'default' ? '' : ` variant="${variant}"`;
          const dismissAttr = ctx.args?.dismissible ? ' dismissible onDismiss={() => console.log("fechado")}' : '';
          return `<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import Info from "@lucide/svelte/icons/info";
</script>

<Alert${variantAttr}${dismissAttr}>
  <Info class="nds-icon" aria-hidden="true" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
</Alert>`;
        },
      },
    },
  },
  render: (args) => ({
    Component: AlertStory,
    props: {
      variant: args.variant,
      title: 'Atenção',
      description: 'Suas alterações serão aplicadas na próxima sessão.',
      showIcon: true,
      dismissible: args.dismissible,
      onDismiss: args.onDismiss,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Elemento alert está presente no DOM', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toBeInTheDocument();
    });

    // waitFor nas asserções de visibilidade: com o control `dismissible`
    // ligado, o alert ENTRA animado (opacidade 0 → 1) e medir no primeiro
    // quadro falha. Sem o control ligado passa de primeira — o waitFor não
    // custa nada e cobre as duas configurações do Playground.
    await step('Alert está visível', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });

    await step('AlertTitle é renderizado corretamente', async () => {
      await waitFor(() => expect(canvas.getByText('Atenção')).toBeVisible());
    });

    await step('AlertTitle é H5 por padrão', async () => {
      const title = canvas.getByText('Atenção');
      await expect(title.tagName).toBe('H5');
    });

    await step('AlertDescription é renderizado corretamente', async () => {
      await waitFor(() =>
        expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible(),
      );
    });

    await step('Variante default aplica classes corretas', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toHaveClass('nds-alert');
    });
  },
};
