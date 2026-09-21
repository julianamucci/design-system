import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, fn, waitFor } from 'storybook/test';
import { Info, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide';
import { createAlert, createAlertIcon, createAlertTitle, createAlertDescription, type AlertIconType, type AlertVariant, type AlertRole } from './alert';
import { alertSource } from './alert.source';
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
  title: 'Components/Feedback/Alert',
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('alert'),
    docs: {
      page: withAutoDocsTab(createAlertDocs),
      source: { transform: alertSource },
    },
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

/**
 * O ícone que acompanha cada variante — o MESMO mapa que o painel Code aplica
 * (`variantIcon`, em `alert.source.ts`).
 *
 * As duas pontas escolhem o ícone pela mesma regra de propósito: com o mapa só
 * de um lado, o painel prometia `createAlertIcon('success')` enquanto a tela
 * mostrava o informativo em toda variante que não fosse `destructive`.
 */
function variantIcon(variant: AlertVariant): AlertIconType {
  if (variant === 'destructive') return 'error';
  if (variant === 'default') return 'info';
  return variant;
}

type LucideNodes = [string, Record<string, string>][];

/**
 * O desenho de cada tipo de ícone, da MESMA fonte que `createAlertIcon` monta
 * (`lucide`).
 *
 * Sem ele não há o que afirmar: o ícone é um `<svg>` sem classe nem atributo
 * que diga qual é, então asserção de presença passa com o ícone ERRADO — e o
 * teste de texto de fonte também, porque ele casa a chamada e não o resultado.
 * Os quatro desenhos só se distinguem pelos nós, e é neles que se mede.
 */
const ICON_NODES: Record<AlertIconType, LucideNodes> = {
  info:    Info as unknown as LucideNodes,
  error:   AlertCircle as unknown as LucideNodes,
  success: CheckCircle2 as unknown as LucideNodes,
  warning: TriangleAlert as unknown as LucideNodes,
};

/** Assinatura do desenho esperado para um tipo de ícone. */
function expectedIconSignature(type: AlertIconType): string {
  return ICON_NODES[type]
    .map(([tag, attrs]) => [tag, ...Object.entries(attrs).map(([k, v]) => `${k}=${v}`)].join(' '))
    .join('|');
}

/** Assinatura do desenho que o DOM de fato tem. */
function renderedIconSignature(svg: SVGSVGElement): string {
  return [...svg.children]
    .map((node) => [node.tagName, ...[...node.attributes].map((a) => `${a.name}=${a.value}`)].join(' '))
    .join('|');
}

function buildAlert(args: AlertArgs): HTMLElement {
  const alert = createAlert({
    variant: args.variant,
    role: args.role,
    dismissible: args.dismissible,
    onDismiss: args.onDismiss,
    dismissLabel: args.dismissLabel,
  });
  alert.appendChild(createAlertIcon(variantIcon(args.variant)));
  // `as: 'h4'` explícito: o nível do título não passa por control, então render e
  // snippet o escrevem igual — o painel Code ensina o nível em vez de esconder o
  // default da fábrica.
  if (args.title) alert.appendChild(createAlertTitle({ text: args.title, as: 'h4' }));
  alert.appendChild(createAlertDescription({ text: args.description }));
  return alert;
}

export const Playground: Story = {
  // O renderer html monta o snippet a partir do outerHTML, que é um dump de DOM
  // e não o que o consumidor escreve. A chamada real da factory vem da transform
  // declarada no meta (`alertSource`), que lê estes controls — variante, papel,
  // título, descrição e o botão de fechar.
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
    // A story declara o PRÓPRIO transform em vez de herdar o do meta: herança
    // acerta por coincidência, e a coincidência não sobrevive à próxima edição
    // do render.
    docs: { source: { transform: alertSource } },
  },
  render: (args) => buildAlert(args),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    // O control `role` troca a semântica da raiz — TODAS as buscas seguem o arg,
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
      await step('AlertTitle é renderizado no nível que a story declara', async () => {
        await waitFor(() => expect(canvas.getByText(args.title)).toBeVisible());
        // Trava o `as: 'h4'` do render: é o mesmo nível que o painel Code mostra,
        // e é a asserção que reprova se uma das duas pontas mudar sozinha.
        const title = canvas.getByText(args.title);
        await expect(title.tagName).toBe('H4');
        await expect(title).toHaveClass('nds-alert-title');
      });
    }

    await step('AlertDescription é renderizado corretamente', async () => {
      await waitFor(() => expect(canvas.getByText(args.description)).toBeVisible());
    });

    await step('A variante aplica as classes do design system', async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toHaveAttribute('data-slot', 'alert');
      await expect(alert).toHaveClass('nds-alert');
      if (variant === 'default') {
        // Default é só a classe base: nenhum modificador de variante.
        for (const other of ['destructive', 'success', 'warning', 'info']) {
          await expect(alert).not.toHaveClass(`nds-alert-${other}`);
        }
      } else {
        await expect(alert).toHaveClass(`nds-alert-${variant}`);
      }
    });

    await step('O ícone é decorativo e filho direto do alert', async () => {
      // Filho DIRETO: é `.nds-alert > svg` que abre a coluna do ícone.
      const icon = canvas.getByRole(role).querySelector(':scope > svg');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon).not.toHaveClass('nds-icon');
    });

    await step('O ícone desenhado é o da variante escolhida', async () => {
      // `accessibility.item4` — "cada variante deve ter ícone e texto
      // correspondentes" — é declarado por ESTA story, e o mapa `variantIcon`
      // estava nas duas pontas (render e painel Code) sem nada que o medisse:
      // voltar a cravar um ícone fixo passava em tudo. A asserção segue o mapa,
      // então agora reprova aqui.
      const icon = canvas.getByRole(role).querySelector<SVGSVGElement>(':scope > svg')!;
      await expect(renderedIconSignature(icon)).toBe(expectedIconSignature(variantIcon(variant)));
    });
  },
};
