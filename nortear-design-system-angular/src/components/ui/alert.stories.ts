import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor } from 'storybook/test';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide';
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertIcon,
  type AlertIconKind,
  type AlertVariant,
} from './alert';
import { alertPlaygroundSource, type AlertArgs } from './alert.source';
import { NdsAlertDocs } from '@/components/docs/AlertDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<AlertArgs> = {
  title: 'Components/Feedback/Alert',
  tags: ['autodocs', 'feedback'],
  decorators: [
    moduleMetadata({
      imports: [NdsAlert, NdsAlertTitle, NdsAlertDescription, NdsAlertIcon],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: figmaDesign('alert'),
    docs: { page: withAutoDocsTab(NdsAlertDocs) },
  },
  // Sem compodoc neste stack (ver CLAUDE.md): a aba API Reference sai daqui.
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'success', 'warning', 'info'],
      description: 'Variante semântica do Alert.',
      table: {
        type: { summary: "'default' | 'destructive' | 'success' | 'warning' | 'info'" },
        defaultValue: { summary: "'default'" },
      },
    },
    role: {
      control: 'select',
      options: ['alert', 'status', 'note'],
      description:
        'Semântica de anúncio para leitores de tela. "alert" e "status" são live regions; "note" não é — use-o para conteúdo estático já presente no carregamento da página.',
      table: {
        type: { summary: "'alert' | 'status' | 'note'" },
        defaultValue: { summary: "'alert'" },
      },
    },
    dismissible: {
      control: 'boolean',
      description: 'Exibe o botão de fechar no canto superior direito.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dismissLabel: {
      // Sem control, como nas outras quatro: o default do componente já cobre o
      // Playground, e o rótulo é conteúdo de acessibilidade, não configuração.
      control: false,
      description: 'Rótulo acessível (aria-label) do botão de fechar.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Fechar alerta'" } },
    },
    title: { control: 'text', description: 'Texto do AlertTitle.' },
    description: { control: 'text', description: 'Texto do AlertDescription.' },
    onDismiss: {
      // Sem entrada aqui a função não chega ao template: o renderer Angular só
      // repassa em `props` o que tem argType, e o `(dismiss)` ficaria ligado a
      // nada — sem erro nenhum.
      control: false,
      description: 'Handler do output (dismiss) — disparado uma vez, ao fechar.',
      table: { type: { summary: '() => void' } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    variant: 'default',
    role: 'alert',
    dismissible: false,
    dismissLabel: 'Fechar alerta',
    title: 'Atenção',
    description: 'Suas alterações serão aplicadas na próxima sessão.',
    onDismiss: fn(),
  },
};

export default meta;
type Story = StoryObj<AlertArgs>;

/**
 * O ícone que acompanha cada variante — o MESMO mapa que o painel Code aplica
 * (`variantIcon`, em `alert.source.ts`).
 *
 * As duas pontas escolhem o ícone pela mesma regra de propósito: com o mapa só
 * de um lado, o painel prometia `kind="success"` enquanto a tela mostrava o
 * informativo em toda variante que não fosse `destructive`.
 */
function variantIcon(variant: AlertVariant): AlertIconKind {
  if (variant === 'destructive') return 'error';
  if (variant === 'default') return 'info';
  return variant;
}

/**
 * O desenho de cada `kind`, da MESMA fonte que o `NdsAlertIcon` monta (`lucide`).
 *
 * Sem ele não há o que afirmar: o ícone é um `<svg>` sem atributo que diga qual
 * é, então uma asserção de presença passa com o `kind` cravado no template — que
 * foi exatamente o defeito. Comparar o desenho rendido com o desenho esperado
 * para a variante ESCOLHIDA no control é o que dá dentes ao vínculo.
 */
const ICON_NODES: Record<AlertIconKind, [string, Record<string, string>][]> = {
  info: Info as unknown as [string, Record<string, string>][],
  error: AlertCircle as unknown as [string, Record<string, string>][],
  success: CheckCircle2 as unknown as [string, Record<string, string>][],
  warning: TriangleAlert as unknown as [string, Record<string, string>][],
};

/** Assinatura do desenho esperado para um `kind`. */
function expectedIconSignature(kind: AlertIconKind): string {
  return ICON_NODES[kind]
    .map(([tag, attrs]) =>
      [tag, ...Object.entries(attrs).map(([k, v]) => `${k}=${v}`)].join(' '),
    )
    .join('|');
}

/** Assinatura do desenho que o DOM de fato tem. */
function renderedIconSignature(svg: SVGSVGElement): string {
  return [...svg.children]
    .map((node) =>
      [
        node.tagName,
        ...[...node.attributes].map((a) => `${a.name}=${a.value}`),
      ].join(' '),
    )
    .join('|');
}

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: alertPlaygroundSource } },
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: (args) => ({
    // `iconKind` é derivado aqui, e não cravado no template: o critério de
    // acessibilidade que esta story declara (`accessibility.item4`) diz que cada
    // variante tem ícone correspondente, e era a story que o contrariava.
    props: { ...args, iconKind: variantIcon(args.variant) },
    template: `
      <div
        ndsAlert
        [variant]="variant"
        [role]="role"
        [dismissible]="dismissible"
        [dismissLabel]="dismissLabel"
        (dismiss)="onDismiss()"
      >
        <svg ndsAlertIcon [kind]="iconKind"></svg>
        <h4 ndsAlertTitle>{{ title }}</h4>
        <section ndsAlertDescription>{{ description }}</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A semântica de anúncio escolhida chega ao DOM', async () => {
      // O `role` é input E atributo: sem AOT o input cairia no default em
      // silêncio, e a story continuaria verde por acaso (o default é 'alert').
      const alerta = canvasElement.querySelector<HTMLElement>('[data-slot="alert"]')!;
      await expect(alerta).toHaveAttribute('role', args.role);
    });

    // waitFor nas asserções de visibilidade: com o control `dismissible`
    // ligado, o alert ENTRA animado (opacidade 0 → 1) e medir no primeiro
    // quadro é racy. Sem o control ligado passa de primeira — o waitFor não
    // custa nada e cobre as duas configurações do Playground.
    // Todos os passos consultam pelo papel ESCOLHIDO no control: com `note` ou
    // `status`, um `getByRole('alert')` fixo reprovaria por não achar nada.
    await step('Alert está visível', async () => {
      await waitFor(() => expect(canvas.getByRole(args.role)).toBeVisible());
    });

    await step('Título e descrição são renderizados', async () => {
      await waitFor(() => expect(canvas.getByText(args.title)).toBeVisible());
      await waitFor(() => expect(canvas.getByText(args.description)).toBeVisible());
    });

    await step('O título é o heading que quem escreve escolheu', async () => {
      // Aqui o nível é do ELEMENTO, não de uma prop: `<h4 ndsAlertTitle>`. A
      // story abre num card `h3`, então o título do alerta desce um degrau — e
      // o snippet do painel Code escreve exatamente esta tag.
      const title = canvas.getByText(args.title);
      await expect(title.tagName).toBe('H4');
      await expect(title).toHaveClass('nds-alert-title');
    });

    await step('A variante aplica as classes do design system', async () => {
      const alerta = canvas.getByRole(args.role);
      await expect(alerta).toHaveAttribute('data-slot', 'alert');
      await expect(alerta).toHaveClass('nds-alert');
      if (args.variant === 'default') {
        // Default é só a classe base: nenhum modificador de variante.
        for (const other of ['destructive', 'success', 'warning', 'info']) {
          await expect(alerta).not.toHaveClass(`nds-alert-${other}`);
        }
      } else {
        await expect(alerta).toHaveClass(`nds-alert-${args.variant}`);
      }
    });

    await step('O ícone é decorativo e filho direto do alert', async () => {
      // Filho DIRETO: é o seletor `.nds-alert:has(> svg)` que abre a coluna do
      // ícone. Um wrapper no meio deixaria o layout de uma coluna só.
      const alerta = canvas.getByRole(args.role);
      const icon = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      // Sem `.nds-icon`: é `.nds-alert > svg` que dimensiona o ícone.
      await expect(icon).not.toHaveClass('nds-icon');
    });

    await step('O ícone desenhado é o da variante escolhida', async () => {
      // O vínculo é o mesmo que o painel Code aplica: `variantIcon`. Sem esta
      // asserção, um `kind` cravado no template passa — os quatro desenhos do
      // lucide são distinguíveis só pelos nós, e é neles que se mede.
      const alerta = canvas.getByRole(args.role);
      const icon = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      await expect(renderedIconSignature(icon)).toBe(
        expectedIconSignature(variantIcon(args.variant)),
      );
    });
  },
};
