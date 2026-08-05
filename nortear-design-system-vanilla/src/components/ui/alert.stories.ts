import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, waitFor } from 'storybook/test';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription, type AlertVariant, type AlertRole } from './alert';
import { createAlertDocs } from '@/components/docs/AlertDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AlertArgs = {
  variant: AlertVariant;
  role: AlertRole;
  title: string;
  description: string;
  /** Documentada na aba API Reference; o Playground não a encaminha. */
  className?: string;
  dismissible: boolean;
  onDismiss: () => void;
  /** Documentada na aba API Reference; o Playground usa o default da factory. */
  dismissLabel?: string;
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
    role: {
      control: 'select',
      options: ['alert', 'status', 'note'],
      description:
        'Semântica de anúncio para leitores de tela. "alert" interrompe e anuncia na hora — só para mensagem urgente que surge em tempo de execução. "status" anuncia sem interromper. "note" não anuncia: é o certo para conteúdo estático já presente ao carregar a página.',
      table: { type: { summary: "'alert' | 'status' | 'note'" }, defaultValue: { summary: "'alert'" } },
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
    dismissible: {
      control: 'boolean',
      description: 'Exibe o botão de fechar no canto superior direito. Fechar remove o alert da tela.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onDismiss: {
      control: false,
      description: 'Callback de fechamento — disparado uma única vez ao acionar o botão de fechar.',
      table: { type: { summary: '() => void' } },
    },
    dismissLabel: {
      control: false,
      description: 'Rótulo acessível (aria-label) do botão de fechar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Fechar alerta'" } },
    },
  },
  args: {
    variant:     'default',
    role:        'alert',
    title:       'Atenção',
    description: 'Suas alterações serão aplicadas na próxima sessão.',
    dismissible: false,
    onDismiss:   fn(),
  },
};

export default meta;
type Story = StoryObj<AlertArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildAlert(args: AlertArgs): HTMLElement {
  const alert = createAlert({
    variant: args.variant,
    role: args.role,
    dismissible: args.dismissible,
    onDismiss: args.onDismiss,
    dismissLabel: args.dismissLabel,
  });
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
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<AlertArgs> }) => {
          const { variant = 'default', role = 'alert', title = '', description = '', dismissible = false } = ctx.args ?? {};
          const icon = variant === 'destructive' ? 'error' : variant === 'default' ? 'info' : variant;
          const opts = [
            variant === 'default' ? '' : `variant: '${variant}'`,
            role === 'alert' ? '' : `role: '${role}'`,
            dismissible ? `dismissible: true, onDismiss: () => console.log('fechado')` : '',
          ].filter(Boolean).join(', ');
          const variantArg = opts ? `{ ${opts} }` : '';
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

    await step('AlertTitle é H5 por default', async () => {
      // Trava o default da factory: sem `as`, createAlertTitle rende <h5>.
      await expect(canvas.getByText('Atenção').tagName).toBe('H5');
    });

    await step('AlertDescription é renderizado corretamente', async () => {
      await waitFor(() =>
        expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible(),
      );
    });
  },
};
