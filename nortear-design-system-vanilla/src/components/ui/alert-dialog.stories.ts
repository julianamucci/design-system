import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createAlertDialog, createAlertDialogMedia } from './alert-dialog';
import { createAlertIcon } from './alert';
import { createButton } from './button';
import { createAlertDialogDocs } from '@/components/docs/AlertDialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AlertDialogArgs = {
  defaultOpen: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  showMedia: boolean;
  cancelLabel: string;
  actionLabel: string;
  tone: 'destructive' | 'default';
  class?: string;
  onOpenChange?: (open: boolean) => void;
};

// Args que montam a composição ficam na categoria "Demonstração" — mesmos nomes,
// ordem e valores nas 4 stacks, para o painel de controls ser o mesmo em
// qualquer Storybook do design system.
const DEMO = { table: { category: 'Demonstração' } } as const;

const meta: Meta<AlertDialogArgs> = {
  title: 'UI/AlertDialog',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    docs: { page: withAutoDocsTab(createAlertDialogDocs) },
  },
  // Esta stack não tem docgen (não há componente de framework para
  // introspectar): a aba "API Reference" sai só destes argTypes.
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não controlado. Útil para capturas visuais.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    class: {
      control: 'text',
      description: 'Classes extras aplicadas ao painel do diálogo — ex.: uma largura máxima diferente.',
      table: { type: { summary: 'string' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback disparado quando o diálogo abre ou fecha.',
      table: { type: { summary: '(open: boolean) => void' } },
    },

    tone: {
      control: 'select',
      options: ['destructive', 'default'],
      description: 'Severidade da confirmação — escolhe a variante do Button do trigger e da ação.',
      ...DEMO,
    },
    showMedia: {
      control: 'boolean',
      description:
        'Bloco de ícone no topo do header (createAlertDialogMedia). Quando presente, o CSS centraliza header e texto.',
      ...DEMO,
    },
    triggerLabel: { control: 'text', description: 'Rótulo do botão que abre o diálogo.', ...DEMO },
    title: {
      control: 'text',
      description: 'Título, associado por aria-labelledby. Opção title da factory.',
      ...DEMO,
    },
    description: {
      control: 'text',
      description: 'Descrição, associada por aria-describedby. Opção description da factory.',
      ...DEMO,
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo do botão que fecha sem executar a ação.',
      ...DEMO,
    },
    actionLabel: { control: 'text', description: 'Rótulo do botão que confirma.', ...DEMO },
  },
  // Conteúdo dos rótulos: docs/shared/content/alert-dialog/translations.json →
  // demonstration.labels. É o mesmo exemplo da seção Demonstração da docs page.
  args: {
    defaultOpen: false,
    class: '',
    // Popula a aba Actions e deixa a play verificar cada transição de abertura.
    onOpenChange: fn(),
    tone: 'destructive',
    showMedia: false,
    triggerLabel: 'Excluir conta',
    title: 'Excluir conta',
    description:
      'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Excluir',
  },
};

export default meta;
type Story = StoryObj<AlertDialogArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDemo(args: AlertDialogArgs, onConfirm?: () => void, onCancel?: () => void): HTMLElement {
  const trigger = createButton({
    variant: args.tone === 'destructive' ? 'destructive' : 'default',
    label: args.triggerLabel,
  });
  const cancelButton = createButton({
    variant: 'outline',
    label: args.cancelLabel,
    onClick: onCancel,
  });
  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionButton = createButton({
    variant: args.tone === 'destructive' ? 'destructive' : 'default',
    label: args.actionLabel,
    onClick: onConfirm,
  });

  // createAlertIcon já devolve o svg com aria-hidden; o CSS do media dimensiona
  // qualquer svg filho em 24px.
  let media: HTMLElement | undefined;
  if (args.showMedia) {
    media = createAlertDialogMedia();
    media.appendChild(createAlertIcon('warning'));
  }

  return createAlertDialog({
    trigger,
    title: args.title,
    description: args.description,
    media,
    cancelButton,
    actionButton,
    defaultOpen: args.defaultOpen,
    class: args.class,
    onOpenChange: args.onOpenChange,
  });
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  // O renderer html monta o snippet a partir do outerHTML, que é um dump de DOM
  // e não o que o consumidor escreve. Aqui vai a composição real das factories,
  // montada a partir dos args para acompanhar os controls.
  parameters: {
    // Contrato de teste (docs/shared/content/alert-dialog/translations.json →
    // testes.*). Só entra aqui o que os steps abaixo realmente asseveram.
    covers: [
      'functional.item1',
      'functional.item5',
      'functional.item6',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
      'visual.item1',
    ],
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<AlertDialogArgs> }) => {
          const a = ctx.args ?? {};
          const actionVariant = a.tone === 'destructive' ? 'destructive' : 'default';
          return [
            a.showMedia
              ? "import { createAlertDialog, createAlertDialogMedia } from '@/components/ui/alert-dialog';"
              : "import { createAlertDialog } from '@/components/ui/alert-dialog';",
            ...(a.showMedia ? ["import { createAlertIcon } from '@/components/ui/alert';"] : []),
            "import { createButton } from '@/components/ui/button';",
            '',
            `const trigger = createButton({ variant: '${actionVariant}', label: '${a.triggerLabel ?? ''}' });`,
            `const cancelButton = createButton({ variant: 'outline', label: '${a.cancelLabel ?? ''}' });`,
            `const actionButton = createButton({ variant: '${actionVariant}', label: '${a.actionLabel ?? ''}' });`,
            ...(a.showMedia
              ? [
                  '',
                  'const media = createAlertDialogMedia();',
                  "media.appendChild(createAlertIcon('warning'));",
                ]
              : []),
            '',
            'const dialog = createAlertDialog({',
            '  trigger,',
            `  title: '${a.title ?? ''}',`,
            `  description: '${a.description ?? ''}',`,
            ...(a.showMedia ? ['  media,'] : []),
            '  cancelButton,',
            '  actionButton,',
            ...(a.defaultOpen ? ['  defaultOpen: true,'] : []),
            ...(a.class ? [`  class: '${a.class}',`] : []),
            '});',
            '',
            "document.querySelector('#app')?.append(dialog);",
          ].join('\n');
        },
      },
    },
  },
  render: (args) => buildDemo(args, fn(), fn()),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const onOpenChange = args.onOpenChange as unknown as ReturnType<typeof fn>;
    onOpenChange.mockClear();

    await step('Trigger está presente e anuncia que abre um diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    await step('A raiz identifica a instância do diálogo', async () => {
      const root = canvasElement.querySelector('[data-slot="alert-dialog"]');
      await expect(root).toHaveAttribute('data-dialog-id');
    });

    await step('Diálogo abre ao clicar no trigger e reporta a abertura', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível. waitFor passa no primeiro
      // tick quando não há animação, então serve aos dois ambientes.
      await waitFor(() => expect(dialog).toBeVisible());
      // O backdrop faz parte do contrato de abertura (functional.item1): sem ele
      // o fundo continua clicável e a modalidade é só visual.
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
      await expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    await step('Diálogo tem role alertdialog e aria-modal', async () => {
      const dialog = await waitForPortal('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('aria-labelledby aponta o título e aria-describedby a descrição', async () => {
      const dialog = await waitForPortal('alertdialog');
      const titleId = dialog.getAttribute('aria-labelledby');
      const descId = dialog.getAttribute('aria-describedby');
      await expect(document.getElementById(titleId ?? '')).toHaveTextContent(args.title);
      await expect(document.getElementById(descId ?? '')).toHaveTextContent(args.description);
      await expect(dialog).toHaveAccessibleName(args.title);
      await expect(dialog).toHaveAccessibleDescription(args.description);
    });

    await step('Clique repetido no trigger não monta um segundo painel', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
      trigger.click();
      // Sem a guarda de open(), o segundo clique montaria outro painel e
      // perderia a referência do primeiro, que ficaria órfão no body.
      await expect(document.querySelectorAll('[role="alertdialog"]')).toHaveLength(1);
      await expect(
        document.querySelectorAll('[data-slot="alert-dialog-overlay"]'),
      ).toHaveLength(1);
    });

    await step('Bloco de mídia segue o control showMedia', async () => {
      const dialog = await waitForPortal('alertdialog');
      const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
      if (!args.showMedia) {
        await expect(media).toBeNull();
        return;
      }
      // A mídia é o PRIMEIRO filho do header: é dessa ordem que dependem o
      // :has() do CSS e a ordem de leitura ícone → título → descrição.
      const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
      await expect(header!.firstElementChild).toBe(media);
      await expect(media!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Foco inicial em Cancelar, não na ação destrutiva', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());
    });

    await step('Tab e Shift+Tab ficam presos entre Cancelar e a ação', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });

      await userEvent.tab();
      await expect(action).toHaveFocus();
      // Último elemento: Tab volta ao primeiro em vez de sair do diálogo.
      await userEvent.tab();
      await expect(cancel).toHaveFocus();
      // Primeiro elemento: Shift+Tab volta ao último, também sem sair.
      await userEvent.tab({ shift: true });
      await expect(action).toHaveFocus();
    });

    await step('Clique no overlay não fecha — a decisão é obrigatória', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]');
      await expect(overlay).toBeInTheDocument();
      await userEvent.click(overlay as HTMLElement);
      // Padrão alertdialog: só Cancel, Action ou Escape encerram o diálogo.
      await expect(body.queryByRole('alertdialog')).toBeInTheDocument();
    });

    await step('Clique em Cancelar fecha e devolve o foco ao trigger', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(canvas.getByRole('button', { name: /^Excluir conta$/i })).toHaveFocus();
      await expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  },
};
