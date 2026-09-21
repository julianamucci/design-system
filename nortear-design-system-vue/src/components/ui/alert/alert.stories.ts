import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { within, expect, fn, waitFor } from 'storybook/test';
import { Alert, AlertTitle, AlertDescription } from './index';
import AlertDocs from '@/components/docs/AlertDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-vue-next';
import { alertSource, type AlertArgs, type AlertVariant } from './alert.source';

/**
 * Args da story: as do painel Code (`AlertArgs`) mais o slot default, que não é
 * prop e existe aqui só para a aba API Reference documentá-lo.
 */
type AlertStoryArgs = AlertArgs & { default?: unknown };

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
    title: {
      control: 'text',
      description: 'Texto do título. Arg da story — o conteúdo entra pelo slot, em AlertTitle.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description:
        'Texto da descrição. Arg da story — o conteúdo entra pelo slot, em AlertDescription.',
      table: { type: { summary: 'string' } },
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
    title: 'Atenção',
    description: 'Suas alterações serão aplicadas na próxima sessão.',
    onDismiss: fn(),
  },
} satisfies Meta<AlertStoryArgs>;

export default meta;
type Story = StoryObj<AlertStoryArgs>;

const MODIFIERS = [
  'nds-alert-destructive',
  'nds-alert-success',
  'nds-alert-warning',
  'nds-alert-info',
];

/**
 * O ícone que acompanha cada variante — o MESMO mapa que o painel Code aplica
 * (`VARIANT_ICON`, em `alert.source.ts`).
 *
 * As duas pontas escolhem o ícone pela mesma regra de propósito: com o mapa só
 * de um lado, o painel prometia `CheckCircle2` enquanto a tela mostrava o
 * informativo em toda variante que não fosse `destructive`.
 */
const VARIANT_ICON: Record<AlertVariant, unknown> = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: TriangleAlert,
  info: Info,
};

/**
 * Expectativa INDEPENDENTE do mapa acima: a classe que o lucide escreve no
 * `<svg>` a partir do nome do ícone (`lucide-${kebab}`). Derivar a asserção do
 * próprio `VARIANT_ICON` a tornaria verdade trivial — ela precisa saber, por
 * fora, qual ícone cada variante deve mostrar.
 */
const VARIANT_ICON_CLASS: Record<AlertVariant, string> = {
  default: 'lucide-info',
  destructive: 'lucide-circle-alert',
  success: 'lucide-circle-check',
  warning: 'lucide-triangle-alert',
  info: 'lucide-info',
};

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
    // Própria, e não herdada do meta: herança acerta por coincidência, e a
    // coincidência não sobrevive à próxima edição do render.
    docs: { source: { transform: alertSource } },
  },
  // As props entram UMA A UMA, e não por `v-bind="args"`: `title` e `description`
  // são args de CONTEÚDO, e o fallthrough os escreveria como atributos na raiz —
  // um `title="…"` nativo viraria tooltip e entraria no nome acessível do alerta.
  render: (args) => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() {
      const icon = computed(() => VARIANT_ICON[args.variant ?? 'default']);
      return { args, icon };
    },
    template: `
      <Alert
        :variant="args.variant"
        :role="args.role"
        :dismissible="args.dismissible"
        :dismiss-label="args.dismissLabel"
        @dismiss="args.onDismiss"
      >
        <component :is="icon" aria-hidden="true" />
        <AlertTitle v-if="args.title" as="h4">{{ args.title }}</AlertTitle>
        <AlertDescription>{{ args.description }}</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    // O control `role` troca a semântica da raiz — TODAS as buscas seguem o arg
    // para a story continuar verde em qualquer configuração do painel.
    const role = args.role ?? 'alert';
    const variant = args.variant ?? 'default';

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

    if (args.title) {
      await step('AlertTitle é renderizado corretamente', async () => {
        await waitFor(() => expect(canvas.getByText(args.title)).toBeVisible());
      });

      // O nível é ESCOLHA de quem compõe a página, e a story escolhe `h4` — o
      // default `h5` do componente segue provado no teste unitário do primitivo.
      // Aqui o que se mede é que o `as` chega ao DOM: sem ele o título voltaria a
      // ser H5 e o painel Code estaria ensinando o que a story não faz.
      await step('O nível pedido em `as` é o que chega ao DOM', async () => {
        const heading = canvas.getByText(args.title);
        await expect(heading.tagName).toBe('H4');
        await expect(heading).toHaveClass('nds-alert-title');
      });
    }

    await step('AlertDescription é renderizado corretamente', async () => {
      await waitFor(() => expect(canvas.getByText(args.description)).toBeVisible());
    });

    await step('A variante escolhida aplica as classes corretas', async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toHaveAttribute('data-slot', 'alert');
      await expect(alert).toHaveClass('nds-alert');
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

    // `accessibility.item4` — "cada variante deve ter ícone e texto
    // correspondentes" — só é declarado por ESTA story, e até 2026-09-21 ela
    // exibia o informativo em toda variante: a página afirmava o critério e o
    // Playground mostrava o contrário dele.
    await step('O ícone acompanha a variante escolhida', async () => {
      const icon = canvas.getByRole(role).querySelector(':scope > svg');
      const expected = VARIANT_ICON_CLASS[variant];
      await expect(icon).toHaveClass(expected);
      // E nenhum dos outros. Sem o braço negativo, um `<svg>` que ACUMULASSE as
      // classes passaria por "mostra o ícone da variante" sem tê-lo trocado —
      // a mesma armadilha que o comentário do mapa acima descreve, resolvida lá
      // e não aqui.
      for (const other of Object.values(VARIANT_ICON_CLASS)) {
        if (other !== expected) await expect(icon).not.toHaveClass(other);
      }
    });
  },
};
