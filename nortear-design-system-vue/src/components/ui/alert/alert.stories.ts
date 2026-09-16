import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, fn, waitFor } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import AlertDocs from '@/components/docs/AlertDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { Info } from 'lucide-vue-next';
import { alertSource } from './alert.source';

const meta = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('alert'),
    docs: { page: withAutoDocsTab(AlertDocs), source: { transform: alertSource } },
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
    role: {
      control: 'select',
      options: ['alert', 'status', 'note'],
      description:
        'Semântica de anúncio para leitores de tela. alert (padrão) interrompe e anuncia na hora — só para mensagem urgente que surge em tempo de execução. status anuncia sem interromper. note não é live region: use em conteúdo estático já presente ao carregar a página.',
      table: { type: { summary: "'alert' | 'status' | 'note'" }, defaultValue: { summary: "'alert'" } },
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
    role: 'alert',
    dismissible: false,
    onDismiss: fn(),
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

const MODIFIERS = [
  'nds-alert-destructive',
  'nds-alert-success',
  'nds-alert-warning',
  'nds-alert-info',
];

export const Playground: Story = {
  parameters: { covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'] },
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return { args }; },
    template: `
      <Alert v-bind="args">
        <Info aria-hidden="true" />
        <AlertTitle as="h4">Atenção</AlertTitle>
        <AlertDescription>Suas alterações serão aplicadas na próxima sessão.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    // O control `role` troca a semântica da raiz — TODAS as buscas seguem o arg
    // para a story continuar verde em qualquer configuração do painel.
    const role = args.role ?? 'alert';

    await step('A semântica de anúncio escolhida chega ao DOM', async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toBeInTheDocument();
      await expect(alert).toHaveAttribute('role', role);
    });

    // waitFor nas asserções de visibilidade: com o control `dismissible`
    // ligado, o alert ENTRA animado (opacidade 0 → 1) e medir no primeiro
    // quadro falha. Sem o control ligado passa de primeira — o waitFor não
    // custa nada e cobre as duas configurações do Playground.
    await step('Alert está visível', async () => {
      await waitFor(() => expect(canvas.getByRole(role)).toBeVisible());
    });

    await step('AlertTitle é renderizado corretamente', async () => {
      await waitFor(() => expect(canvas.getByText('Atenção')).toBeVisible());
    });

    // O nível é ESCOLHA de quem compõe a página, e a story escolhe `h4` — o
    // default `h5` do componente segue provado no teste unitário do primitivo.
    // Aqui o que se mede é que o `as` chega ao DOM: sem ele o título voltaria a
    // ser H5 e o painel Code estaria ensinando o que a story não faz.
    await step('O nível pedido em `as` é o que chega ao DOM', async () => {
      await expect(canvas.getByText('Atenção').tagName).toBe('H4');
    });

    await step('AlertDescription é renderizado corretamente', async () => {
      await waitFor(() =>
        expect(canvas.getByText(/Suas alterações serão aplicadas/)).toBeVisible(),
      );
    });

    await step('A variante escolhida aplica as classes corretas', async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toHaveClass('nds-alert');
      const variant = args.variant ?? 'default';
      for (const modifier of MODIFIERS) {
        if (modifier === `nds-alert-${variant}`) {
          await expect(alert).toHaveClass(modifier);
        } else {
          await expect(alert).not.toHaveClass(modifier);
        }
      }
    });

    await step('O ícone é decorativo e filho direto do alert', async () => {
      // Filho DIRETO: é `.nds-alert > svg` que abre a coluna do ícone.
      const icon = canvas.getByRole(role).querySelector(':scope > svg');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).not.toHaveClass('nds-icon');
    });
  },
};
