import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription, type AlertVariant } from './alert';
import { createAlertDocs } from '@/components/docs/AlertDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AlertArgs = {
  variant: AlertVariant;
  title: string;
  description: string;
  /** Documentada na aba API Reference; o Playground não a encaminha. */
  className?: string;
};

const meta: Meta<AlertArgs> = {
  title: 'UI/Alert',
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(createAlertDocs) },
  },
  // Esta stack não tem docgen (não há componente de framework para
  // introspectar): a aba "API Reference" sai só destes argTypes.
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
      description: 'Variante semântica do alert.',
      table: { type: { summary: "'default' | 'destructive' | 'success' | 'warning' | 'info'" }, defaultValue: { summary: "'default'" } },
    },
    className: {
      control: false,
      description: 'Classes adicionais no elemento raiz.',
      table: { type: { summary: 'string' } },
    },
    title: {
      control: 'text',
      description: 'Texto do título. Arg da story — o conteúdo entra por createAlertTitle.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Texto da descrição. Arg da story — o conteúdo entra por createAlertDescription.',
      table: { type: { summary: 'string' } },
    },
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
  // O renderer html monta o snippet a partir do outerHTML, que é um dump de DOM
  // e não o que o consumidor escreve. Aqui vai a chamada real da factory,
  // montada a partir dos args para acompanhar os controls.
  parameters: {
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<AlertArgs> }) => {
          const { variant = 'default', title = '', description = '' } = ctx.args ?? {};
          const icon = variant === 'destructive' ? 'error' : variant === 'default' ? 'info' : variant;
          const variantArg = variant === 'default' ? '' : `{ variant: '${variant}' }`;
          const lines = [
            "import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription } from '@/components/ui/alert';",
            '',
            `const alert = createAlert(${variantArg});`,
            `alert.appendChild(createAlertIcon('${icon}'));`,
          ];
          if (title) lines.push(`alert.appendChild(createAlertTitle({ text: '${title}' }));`);
          lines.push(`alert.appendChild(createAlertDescription({ text: '${description}' }));`);
          return lines.join('\n');
        },
      },
    },
  },
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
