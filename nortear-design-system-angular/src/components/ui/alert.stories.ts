import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor } from 'storybook/test';
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertIcon,
} from './alert';
import { alertPlaygroundSource, type AlertArgs } from './alert.source';
import { NdsAlertDocs } from '@/components/docs/AlertDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<AlertArgs> = {
  title: 'Primitives/Feedback/Alert',
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
      control: 'text',
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

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: alertPlaygroundSource } },
    covers: ['accessibility.item1', 'accessibility.item4', 'visual.item1'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div
        ndsAlert
        [variant]="variant"
        [role]="role"
        [dismissible]="dismissible"
        [dismissLabel]="dismissLabel"
        (dismiss)="onDismiss()"
      >
        <svg ndsAlertIcon kind="info"></svg>
        <h5 ndsAlertTitle>{{ title }}</h5>
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
    await step('Alert está visível', async () => {
      await waitFor(() => expect(canvas.getByRole('alert')).toBeVisible());
    });

    await step('Título e descrição são renderizados', async () => {
      await waitFor(() => expect(canvas.getByText(args.title)).toBeVisible());
      await waitFor(() => expect(canvas.getByText(args.description)).toBeVisible());
    });

    await step('O título é o heading que quem escreve escolheu', async () => {
      // Aqui o nível é do ELEMENTO, não de uma prop: `<h5 ndsAlertTitle>`.
      const title = canvas.getByText(args.title);
      await expect(title.tagName).toBe('H5');
      await expect(title).toHaveClass('nds-alert-title');
    });

    await step('A variante default aplica só a classe base', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(alerta).toHaveAttribute('data-slot', 'alert');
      await expect(alerta).toHaveClass('nds-alert');
      await expect(alerta).not.toHaveClass('nds-alert-destructive');
    });

    await step('O ícone é decorativo e filho direto do alert', async () => {
      // Filho DIRETO: é o seletor `.nds-alert:has(> svg)` que abre a coluna do
      // ícone. Um wrapper no meio deixaria o layout de uma coluna só.
      const alerta = canvas.getByRole('alert');
      const icone = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      await expect(icone).toHaveAttribute('aria-hidden', 'true');
    });
  },
};
