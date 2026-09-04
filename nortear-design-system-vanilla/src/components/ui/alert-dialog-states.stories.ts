import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createAlertDialog } from './alert-dialog';
import { buildDemo } from './alert-dialog.fixtures';
import { alertDialogSource, alertDialogSourceWith } from './alert-dialog.source';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'Components/Overlay/AlertDialog/States',
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: alertDialogSource },
      description: {
        component:
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Spies ────────────────────────────────────────────────────────────────────
//
// No escopo do módulo (e não dentro do `render`) para que as play functions
// consigam verificar que o handler realmente disparou — dentro do render eles
// ficam presos ao closure e o teste só consegue observar o DOM.

const onConfirmSpy = fn();
const onCancelSpy = fn();
const onOpenChangeSpy = fn();

// ─── Stories ──────────────────────────────────────────────────────────────────
//
// O construtor da demonstração vem de `alert-dialog.fixtures.ts`. Aqui a
// variante do trigger acompanha o `tone` (o padrão do construtor), e cada story
// declara o seu `defaultOpen` — o que antes se chamava `openInitially`.

/**
 * Garante o diálogo aberto sem depender do estado de montagem.
 *
 * `defaultOpen` só vale na primeira montagem, e o painel Interactions
 * reexecuta a play no MESMO DOM: na segunda rodada o diálogo já foi fechado
 * pelos passos anteriores e o passo de abertura media o vazio.
 */
async function ensureOpen(canvas: ReturnType<typeof within>, rotuloTrigger: RegExp) {
  // querySelector e não queryByRole: numa rodada do arquivo inteiro sobra o
  // portal da story anterior por alguns quadros, e queryByRole estoura em
  // "multiple elements" antes de a limpeza acontecer.
  if (!document.querySelector('[role="alertdialog"]')) {
    await userEvent.click(canvas.getByRole('button', { name: rotuloTrigger }));
  }
  return waitForPortal('alertdialog');
}

export const Closed: Story = {
  parameters: {
    // Sem override: fechado é o estado inicial da fábrica, e a composição da
    // transform do meta é exatamente esta — só o texto de exemplo muda.
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Excluir item/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    // A story termina com o diálogo aberto: é sobre ela que o addon-a11y roda
    // a varredura axe (contraste incluído) do estado aberto.
    covers: ['accessibility.item6', 'accessibility.item7'],
    // Override de story: nascer aberto é o assunto, e `defaultOpen` não passa
    // por control neste arquivo.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          defaultOpen: true,
          triggerLabel: 'Excluir item',
          title: 'Excluir item permanentemente?',
          description:
            'O item será removido de forma definitiva e não poderá ser recuperado.',
          actionLabel: 'Excluir',
        }),
      },
      description: {
        story: 'Diálogo aberto programaticamente. Captura visual no Chromatic.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir item',
      title: 'Excluir item permanentemente?',
      description: 'O item será removido de forma definitiva e não poderá ser recuperado.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      defaultOpen: true,
    }),
  play: async ({ step }) => {

    await step('Conteúdo aberto traz título e descrição', async () => {
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível. waitFor passa no primeiro
      // tick quando não há animação, então serve aos dois ambientes.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveTextContent('Excluir item permanentemente?');
      await expect(dialog).toHaveTextContent(
        'O item será removido de forma definitiva e não poderá ser recuperado.',
      );
    });

    await step('Foco inicial no Cancelar', async () => {
      const dialog = await waitForPortal('alertdialog');
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toHaveFocus(),
      );
    });
  },
};

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    // Override de story: nasce aberto, e o botão de ação leva o handler que a
    // play verifica.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          defaultOpen: true,
          triggerLabel: 'Excluir',
          title: 'Confirmar exclusão',
          description: 'Esta ação é permanente.',
        }),
      },
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      onConfirm: onConfirmSpy,
      defaultOpen: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onConfirmSpy.mockClear();

    await step('Clique em Excluir dispara a ação e fecha o diálogo', async () => {
      // Trigger e action têm rótulo "Excluir" — desambigua via scope do dialog.
      const dialog = await ensureOpen(canvas, /^Excluir$/i);
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(action);
      await expect(onConfirmSpy).toHaveBeenCalledTimes(1);
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Enter no Action confirma pelo teclado e devolve o foco ao trigger', async () => {
      // Reabre pelo trigger (e não por click() programático) para que o foco
      // anterior exista e o retorno de foco possa ser verificado.
      const trigger = canvas.getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(trigger);

      const dialog = await waitForPortal('alertdialog');
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      // Foco entra em Cancelar; Tab leva ao Action.
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await expect(onConfirmSpy).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    // Override de story: nasce aberto, como a Confirmed ao lado.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          defaultOpen: true,
          triggerLabel: 'Excluir',
          title: 'Confirmar exclusão',
          description: 'Esta ação é permanente.',
        }),
      },
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      onCancel: onCancelSpy,
      defaultOpen: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onCancelSpy.mockClear();
    onConfirmSpy.mockClear();

    await step('Clique em Cancelar fecha sem executar a ação', async () => {
      await ensureOpen(canvas, /^Excluir$/i);
      const cancel = await body.findByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Space no Cancelar focado cancela pelo teclado', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(trigger);

      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());

      await userEvent.keyboard(' ');
      await expect(onCancelSpy).toHaveBeenCalledTimes(2);
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item4'],
    // createAlertDialog não recebe `open`: a factory é a dona do estado de
    // abertura e só o expõe por onOpenChange. `defaultOpen` cobre nascer
    // aberto, mas não há como o consumidor forçar o fechamento de fora.
    // Esta story é o equivalente possível: trigger externo + callback.
    coversNotApplicable: {
      'functional.item7':
        'createAlertDialog não expõe uma opção open — o estado de abertura vive na factory e só é observável por onOpenChange',
    },
    // Override de story: o callback de mudança é o assunto, e ele não passa por
    // control neste arquivo.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          triggerLabel: 'Abrir via estado externo',
          title: 'Controlado pelo pai',
          description: 'Este diálogo é comandado por estado externo.',
          cancelLabel: 'Fechar',
          actionLabel: 'Confirmar',
          onOpenChange: '(aberto) => sincronizarEstado(aberto)',
        }),
      },
      description: {
        story: 'Abertura comandada por estado externo — o trigger fica fora do diálogo e o callback de mudança reporta cada transição.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const externalTrigger = createButton({
      variant: 'destructive',
      label: 'Abrir via estado externo',
    });

    // Trigger vazio: quem comanda a abertura é o botão externo acima.
    const dialog = createAlertDialog({
      trigger: externalTrigger,
      title: 'Controlado pelo pai',
      description: 'Este diálogo é comandado por estado externo.',
      cancelButton: createButton({ variant: 'outline', label: 'Fechar' }),
      actionButton: createButton({ variant: 'destructive', label: 'Confirmar' }),
      onOpenChange: onOpenChangeSpy,
    });

    wrapper.append(dialog);
    return wrapper;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onOpenChangeSpy.mockClear();

    await step('Clique no trigger externo abre o diálogo e reporta a abertura', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(onOpenChangeSpy).toHaveBeenCalledWith(true);
    });

    await step('Escape fecha, reporta o fechamento e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await expect(onOpenChangeSpy).toHaveBeenLastCalledWith(false);
      await expect(
        canvas.getByRole('button', { name: /Abrir via estado externo/i }),
      ).toHaveFocus();
    });
  },
};

// ─── Limpeza de ouvintes ──────────────────────────────────────────────────────
//
// A fábrica registra ouvinte em `document`. Quem tira o nó da página com o
// componente nesse estado não passa por caminho de fechamento nenhum, e antes
// não havia o que chamar. A prova aqui NÃO é "`destroy()` rodou" — isso passaria
// com um `destroy()` vazio. É a contagem de ouvintes do livro-caixa fechando em
// zero, confirmada por uma bateria de eventos disparada no documento depois da
// saída. Ver `leak-probe.ts` para o que cada prova cobre e como pode falhar.

export const ListenerCleanup: Story = {
  parameters: {
    controls: { disable: true },
    // A story existe para o que acontece DEPOIS da saída do nó: a foto seria
    // sempre a mesma legenda.
    chromatic: { disable: true },
  },
  render: () => probeHost(
    'Sonda de limpeza: o diálogo é montado, aberto e removido da página pela play.',
  ),
  play: async ({ canvasElement, step }) => {
    const host = canvasElement.querySelector<HTMLElement>('[data-testid="cleanup-host"]');
    await expect(host).not.toBeNull();

    let probe!: ProbeResult;

    await step('Monta, leva ao estado que vaza e tira da página', async () => {
      probe = await sondarOuvintes({
        host: host as HTMLElement,
        montar: () => {
          const trigger = createButton({ variant: 'outline', label: 'Excluir' });
          return createAlertDialog({
            trigger,
            title: 'Excluir registro?',
            description: 'A ação não pode ser desfeita.',
            cancelButton: createButton({ variant: 'outline', label: 'Cancelar' }),
            actionButton: createButton({ variant: 'destructive', label: 'Excluir' }),
          });
        },
        exercitar: (no) => no.querySelector<HTMLElement>('button')?.click(),
        seletorDePortal: '[data-slot="alert-dialog-content"], [data-slot="alert-dialog-overlay"]',
      });
    });

    await step('Nada sobrou preso ao documento, e destroy() repete sem explodir', async () => {
      await checkLimpeza(probe);
    });
  },
};
