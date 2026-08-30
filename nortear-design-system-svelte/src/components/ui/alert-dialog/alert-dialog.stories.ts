import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';
import AlertDialogDocs from '@/components/docs/AlertDialogDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { alertDialogSource } from './alert-dialog.source';

// Args que montam a composição ficam na categoria "Demonstração" — mesmos nomes,
// ordem e valores nas 4 stacks, para o painel de controls ser o mesmo em
// qualquer Storybook do design system.
const DEMO = { table: { category: 'Demonstração' } } as const;

const meta: Meta = {
  title: 'Primitives/Overlay/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    // Sem docgen, o gerador de source monta a tag a partir do nome interno da
    // função compilada. O snippet vai explícito, montado a partir dos args para
    // acompanhar os controls — e cascateia para as stories deste arquivo.
    docs: {
      page: withAutoDocsTab(AlertDialogDocs),
      source: { transform: alertDialogSource },
    },
  },
  // O docgen do Svelte está desligado no .storybook/main.ts: a aba
  // "API Reference" sai só destes argTypes. Props que o wrapper da story não
  // encaminha ficam como documentação (control: false).
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Estado de abertura. Bindable com bind:open — define também o estado inicial.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback disparado quando o diálogo abre ou fecha.',
      table: { type: { summary: '(open: boolean) => void' }, defaultValue: { summary: '—' } },
    },
    onOpenChangeComplete: {
      control: false,
      description: 'Callback disparado quando a transição de abertura ou fechamento termina.',
      table: { type: { summary: '(open: boolean) => void' }, defaultValue: { summary: '—' } },
    },
    children: {
      control: false,
      description: 'Snippet de composição: Trigger, Content, Header, Footer, Cancel e Action.',
      table: { type: { summary: 'Snippet' }, defaultValue: { summary: '—' } },
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
        'Bloco de ícone no topo do header (AlertDialogMedia). Quando presente, o CSS centraliza header e texto.',
      ...DEMO,
    },
    triggerLabel: { control: 'text', description: 'Rótulo do botão que abre o diálogo.', ...DEMO },
    title: { control: 'text', description: 'Título, associado por aria-labelledby.', ...DEMO },
    description: {
      control: 'text',
      description: 'Descrição, associada por aria-describedby.',
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
    open: false,
    // Único callback da raiz que o wrapper da story encaminha — popula a aba
    // Actions e permite asseverar a notificação de mudança no play.
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
type Story = StoryObj;

// Handlers do wrapper (não são props da raiz, logo ficam fora de `args`/`argTypes`
// para não poluir a aba API Reference). No escopo do módulo para não recriar
// spies a cada re-render disparado pelos controls.
const playgroundConfirm = fn();
const playgroundCancel = fn();

export const Playground: Story = {
  parameters: {
    // Contrato de teste (docs/shared/content/alert-dialog/translations.json →
    // testes.*). Só entra aqui o que os steps abaixo realmente asseveram.
    covers: [
      'functional.item1',
      'functional.item4',
      'functional.item5',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    Component: AlertDialogStory,
    props: {
      open: args.open,
      onOpenChange: args.onOpenChange,
      tone: args.tone,
      triggerVariant: args.tone,
      showMedia: args.showMedia,
      triggerLabel: args.triggerLabel,
      title: args.title,
      description: args.description,
      cancelLabel: args.cancelLabel,
      actionLabel: args.actionLabel,
      onConfirm: playgroundConfirm,
      onCancel: playgroundCancel,
    },
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Diálogo abre ao clicar no trigger e notifica a mudança', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O painel entra animando (opacity 0 → 1). Sem waitFor a asserção roda no
      // primeiro quadro, quando toBeVisible() ainda reprova por opacity: 0.
      await waitFor(() => expect(dialog).toBeVisible());
      // O backdrop faz parte do contrato de abertura (functional.item1): sem ele
      // o fundo continua clicável e a modalidade é só visual.
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    });

    await step('Content expõe role alertdialog e aria-modal', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('aria-labelledby e aria-describedby apontam para Title e Description', async () => {
      const dialog = await body.findByRole('alertdialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      const describedBy = dialog.getAttribute('aria-describedby');
      await expect(labelledBy).toBeTruthy();
      await expect(describedBy).toBeTruthy();
      await expect(document.getElementById(labelledBy!)).toHaveTextContent(/^Excluir conta$/i);
      await expect(document.getElementById(describedBy!)).toHaveTextContent(
        /removidos permanentemente/i
      );
      await expect(dialog).toHaveAccessibleName(/Excluir conta/i);
    });

    await step('Bloco de mídia segue o control showMedia', async () => {
      const dialog = await body.findByRole('alertdialog');
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
      // O conteúdo compartilhado promete isto em accessibility.item3 e
      // functional.item1. A asserção anterior dizia "o foco fica no painel" —
      // era o defeito virando contrato: o FocusScope do bits procurava o
      // primeiro tabbable antes de o rodapé existir, desistia e focava o
      // container. Ver alert-dialog-content.svelte.
      const dialog = await body.findByRole('alertdialog');
      const scope = within(dialog);
      await waitFor(() =>
        expect(scope.getByRole('button', { name: /Cancelar/i })).toHaveFocus(),
      );
      await expect(scope.getByRole('button', { name: /^Excluir$/i })).not.toHaveFocus();
    });

    await step('Tab leva do Cancelar à ação de confirmação', async () => {
      const dialog = await body.findByRole('alertdialog');
      const scope = within(dialog);
      // Estabelece a própria precondição: o replay reexecuta no mesmo DOM, onde
      // o foco pode ter parado em qualquer um dos dois.
      scope.getByRole('button', { name: /Cancelar/i }).focus();
      await userEvent.tab();
      await expect(scope.getByRole('button', { name: /^Excluir$/i })).toHaveFocus();
    });

    await step('Shift+Tab devolve o foco ao Cancelar', async () => {
      const dialog = await body.findByRole('alertdialog');
      await userEvent.tab({ shift: true });
      await expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toHaveFocus();
    });

    await step('Focus trap: Tab repetido nunca sai do diálogo', async () => {
      const dialog = await body.findByRole('alertdialog');
      for (let i = 0; i < 4; i += 1) {
        await userEvent.tab();
        await expect(dialog.contains(document.activeElement)).toBe(true);
      }
    });

    await step('Escape fecha o diálogo e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(args.onOpenChange).toHaveBeenCalledWith(false);
      const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};
