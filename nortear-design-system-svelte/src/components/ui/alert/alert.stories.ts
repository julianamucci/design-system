import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
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
        transform: (_generated: string, ctx: { args?: { variant?: string } }) => {
          const variant = ctx.args?.variant ?? 'default';
          const variantAttr = variant === 'default' ? '' : ` variant="${variant}"`;
          return `<script lang="ts">
  import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
  import Info from "@lucide/svelte/icons/info";
<\/script>

<Alert${variantAttr}>
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
    },
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
      await expect(alert).toHaveClass('nds-alert');
    });
  },
};
