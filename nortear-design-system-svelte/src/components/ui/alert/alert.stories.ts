import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertDocs from '@/components/docs/AlertDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { alertSource, type AlertVariantName } from './alert.source';

/** Ícones que o `AlertStory` conhece — o `icon` dele é deste conjunto. */
type AlertIconName = 'info' | 'error' | 'success' | 'warning';

/**
 * O ícone que acompanha cada variante — o MESMO mapa que o painel Code aplica
 * (`VARIANT_ICON`, em `alert.source.ts`).
 *
 * As duas pontas escolhem pela mesma regra de propósito: com o mapa só de um
 * lado, o painel prometia um ícone e a tela mostrava o informativo em toda
 * variante que não fosse `destructive`.
 */
function variantIcon(variant: AlertVariantName): AlertIconName {
  if (variant === 'destructive') return 'error';
  if (variant === 'default' || variant === 'info') return 'info';
  return variant;
}

/**
 * A classe que o `@lucide/svelte` carimba em cada ícone (`lucide-<nome>`). É por
 * ela que a play prova qual ícone chegou à tela — o SVG não traz outro sinal de
 * identidade.
 */
const LUCIDE_CLASS: Record<AlertIconName, string> = {
  info: 'lucide-info',
  error: 'lucide-circle-alert',
  success: 'lucide-circle-check-big',
  warning: 'lucide-triangle-alert',
};

const meta: Meta = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  tags: ['autodocs', 'feedback'],
  parameters: {
    design: figmaDesign('alert'),
    // Sem docgen, o gerador de source monta a tag a partir do nome interno da
    // função compilada. O snippet vai explícito, montado a partir dos args para
    // acompanhar os controls — e cascateia para as stories deste arquivo.
    docs: {
      page: withAutoDocsTab(AlertDocs),
      source: { transform: alertSource },
    },
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
    role: {
      control: 'select',
      options: ['alert', 'status', 'note'],
      description:
        'Semântica de anúncio para leitores de tela. alert (padrão) interrompe e anuncia na hora — use só para mensagem urgente que surge em tempo de execução. status anuncia sem interromper. note não anuncia: é o certo para conteúdo estático já presente ao carregar a página.',
      table: { type: { summary: "'alert' | 'status' | 'note'" }, defaultValue: { summary: "'alert'" } },
    },
    title: {
      control: 'text',
      description: 'Texto do título. Arg da story — o conteúdo entra pelo AlertTitle.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Texto da descrição. Arg da story — o conteúdo entra pelo AlertDescription.',
      table: { type: { summary: 'string' } },
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
    role: 'alert',
    title: 'Atenção',
    description: 'Suas alterações serão aplicadas na próxima sessão.',
    dismissible: false,
    onDismiss: fn(),
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
    // Própria, e não herdada do meta: herança acerta por coincidência, e a
    // coincidência não sobrevive à próxima edição do render.
    docs: { source: { transform: alertSource } },
  },
  render: (args) => ({
    Component: AlertStory,
    props: {
      variant: args.variant,
      role: args.role,
      title: args.title,
      description: args.description,
      showIcon: true,
      // O ícone acompanha a variante — mesma regra do painel Code.
      icon: variantIcon((args.variant ?? 'default') as AlertVariantName),
      dismissible: args.dismissible,
      onDismiss: args.onDismiss,
    },
  }),
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    // O control `role` troca a semântica da raiz — as buscas seguem o arg para
    // a story continuar verde em qualquer configuração do painel.
    const role = args.role ?? 'alert';
    const variant = (args.variant ?? 'default') as AlertVariantName;
    // Título e descrição também são controls: as buscas leem o arg, não um
    // texto cravado que o painel passaria a contradizer.
    const title = String(args.title ?? '');
    const description = String(args.description ?? '');

    await step('Elemento alert está presente no DOM', async () => {
      const alert = canvas.getByRole(role);
      await expect(alert).toBeInTheDocument();
    });

    // waitFor nas asserções de visibilidade: com o control `dismissible`
    // ligado, o alert ENTRA animado (opacidade 0 → 1) e medir no primeiro
    // quadro falha. Sem o control ligado passa de primeira — o waitFor não
    // custa nada e cobre as duas configurações do Playground.
    await step('Alert está visível', async () => {
      await waitFor(() => expect(canvas.getByRole(role)).toBeVisible());
    });

    // `title` é control e pode ser esvaziado no painel — sem a guarda, o
    // Playground reprovava justamente na configuração que o componente
    // documenta como válida (descrição autoexplicativa, sem título).
    if (title) {
      await step('AlertTitle é renderizado corretamente', async () => {
        await waitFor(() => expect(canvas.getByText(title)).toBeVisible());
      });

      // A story escreve `as="h4"` e o painel Code mostra o mesmo: o nível é
      // ENSINADO, não herdado do default `h5` do primitivo.
      await step('AlertTitle renderiza no nível que a story declara', async () => {
        const titleElement = canvas.getByText(title);
        await expect(titleElement.tagName).toBe('H4');
        await expect(titleElement).toHaveClass('nds-alert-title');
      });
    }

    await step('AlertDescription é renderizado corretamente', async () => {
      await waitFor(() => expect(canvas.getByText(description)).toBeVisible());
    });

    await step('A semântica de anúncio escolhida chega ao DOM', async () => {
      await expect(canvas.getByRole(role)).toHaveAttribute('role', role);
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
      // Filho DIRETO: é `.nds-alert > svg` que abre a coluna do ícone. Um
      // wrapper no meio deixaria o layout de uma coluna só.
      const icon = canvas.getByRole(role).querySelector(':scope > svg');
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      // A folha dimensiona o ícone pelo seletor de filho; a utilitária duplicaria a regra.
      await expect(icon).not.toHaveClass('nds-icon');
    });

    await step('O ícone acompanha a variante escolhida', async () => {
      // `accessibility.item4` — critério que esta story declara cobrir — pede
      // ícone e texto correspondentes por variante. Sem o vínculo, o Playground
      // exibia o informativo em TODA variante: a story que enuncia o critério
      // mostrava o contrário dele.
      const icon = canvas.getByRole(role).querySelector(':scope > svg');
      const expected = variantIcon(variant);
      await expect(icon).toHaveClass(LUCIDE_CLASS[expected]);
      // E nenhum dos outros três — senão a asserção acima passaria com um SVG
      // que acumulasse classes.
      for (const [name, className] of Object.entries(LUCIDE_CLASS)) {
        if (name === expected) continue;
        await expect(icon).not.toHaveClass(className);
      }
    });
  },
};
