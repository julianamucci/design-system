import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
import { createAlertDialog } from './alert-dialog';
import { buildDemo } from './alert-dialog.fixtures';
import { alertDialogSource, alertDialogSourceWith } from './alert-dialog.source';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';
import { createButton } from './button';
import { sondarOuvintes, probeHost, checkLimpeza, type ProbeResult } from './leak-probe';

/**
 * O conjunto destrutivo de `demonstration.labels` — o mesmo exemplo da seção
 * Demonstração da docs page, e o mesmo nas cinco stacks.
 *
 * Preso a pt-BR de propósito: a story não passa por i18n, e uma play que
 * dependesse do seletor de idioma procuraria um nome diferente a cada rodada.
 * Até 2026-09-10 cada story deste arquivo tinha o seu texto — título em
 * pergunta, "Fechar" no lugar de Cancelar, gatilho "Excluir" colidindo com a
 * ação —, e nenhum era o que o conteúdo compartilhado ensina.
 */
const LABELS = alertDialogTranslations['pt-BR'].demonstration.labels;

const DESTRUCTIVE = {
  triggerLabel: LABELS.triggerLabel,
  title: LABELS.title,
  description: LABELS.description,
  cancelLabel: LABELS.cancel,
  actionLabel: LABELS.action,
  tone: 'destructive',
} as const;

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
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.',
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
const onCloseSpy = fn();

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
async function ensureOpen(canvas: ReturnType<typeof within>, rotuloTrigger: string | RegExp) {
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
    // Sem override: fechado é o estado inicial da fábrica, e a transform do
    // meta imprime exatamente esta composição — o conjunto destrutivo de
    // `demonstration.labels`, que é o padrão do snippet. Até 2026-09-10 a story
    // dizia "Excluir item" e o painel Code mostrava outro texto.
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () => buildDemo(DESTRUCTIVE),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: LABELS.triggerLabel });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    // A story termina com o diálogo aberto: é sobre ela que o addon-a11y roda
    // a varredura axe (contraste incluído) do estado aberto.
    covers: ['accessibility.item6', 'accessibility.item7'],
    // Sem override: o trecho é a confirmação destrutiva do meta. O
    // `defaultOpen` do render é andaime da captura — quem copia quer o diálogo
    // comandado pelo gatilho, não nascendo aberto.
    docs: {
      description: {
        story: 'Diálogo aberto na montagem. Captura visual no Chromatic.',
      },
    },
  },
  render: () => buildDemo({ ...DESTRUCTIVE, defaultOpen: true }),
  play: async ({ step }) => {

    await step('Conteúdo aberto traz título e descrição', async () => {
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível. waitFor passa no primeiro
      // tick quando não há animação, então serve aos dois ambientes.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveTextContent(LABELS.title);
      await expect(dialog).toHaveTextContent(LABELS.description);
    });

    await step('Foco inicial no Cancelar', async () => {
      const dialog = await waitForPortal('alertdialog');
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: LABELS.cancel })).toHaveFocus(),
      );
    });
  },
};

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    // Sem override: o trecho é a confirmação destrutiva do meta, sem o
    // `defaultOpen` que a story usa só para a captura.
    docs: {
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  render: () =>
    buildDemo({
      ...DESTRUCTIVE,
      onConfirm: onConfirmSpy,
      onClose: onCloseSpy,
      defaultOpen: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onConfirmSpy.mockClear();
    onCloseSpy.mockClear();

    await step('Clique na ação dispara a confirmação e fecha o diálogo', async () => {
      const dialog = await ensureOpen(canvas, LABELS.triggerLabel);
      const action = within(dialog).getByRole('button', { name: LABELS.action });
      await userEvent.click(action);
      await expect(onConfirmSpy).toHaveBeenCalledTimes(1);
      // A ação que confirma fecha com motivo `api` — nunca `close-button`, que
      // é o do Cancelar. É o que separa, no GA4, "confirmou" de "desistiu".
      await expect(onCloseSpy).toHaveBeenCalledTimes(1);
      await expect(onCloseSpy).toHaveBeenLastCalledWith('api');
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Enter na ação confirma pelo teclado e devolve o foco ao trigger', async () => {
      // Reabre pelo trigger (e não por click() programático) para que o foco
      // anterior exista e o retorno de foco possa ser verificado.
      const trigger = canvas.getByRole('button', { name: LABELS.triggerLabel });
      await userEvent.click(trigger);

      const dialog = await waitForPortal('alertdialog');
      const action = within(dialog).getByRole('button', { name: LABELS.action });
      // Foco entra em Cancelar; Tab leva à ação.
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await expect(onConfirmSpy).toHaveBeenCalledTimes(2);
      await expect(onCloseSpy).toHaveBeenLastCalledWith('api');
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    // Sem override, como a Confirmed ao lado.
    docs: {
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () =>
    buildDemo({
      ...DESTRUCTIVE,
      onCancel: onCancelSpy,
      onConfirm: onConfirmSpy,
      onClose: onCloseSpy,
      defaultOpen: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onCancelSpy.mockClear();
    onConfirmSpy.mockClear();
    onCloseSpy.mockClear();

    await step('Clique em Cancelar fecha sem executar a ação', async () => {
      await ensureOpen(canvas, LABELS.triggerLabel);
      const cancel = await body.findByRole('button', { name: LABELS.cancel });
      await userEvent.click(cancel);
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      await expect(onCloseSpy).toHaveBeenCalledTimes(1);
      await expect(onCloseSpy).toHaveBeenLastCalledWith('close-button');
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Space no Cancelar focado cancela pelo teclado', async () => {
      const trigger = canvas.getByRole('button', { name: LABELS.triggerLabel });
      await userEvent.click(trigger);

      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: LABELS.cancel });
      await waitFor(() => expect(cancel).toHaveFocus());

      await userEvent.keyboard(' ');
      await expect(onCancelSpy).toHaveBeenCalledTimes(2);
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      await expect(onCloseSpy).toHaveBeenLastCalledWith('close-button');
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
    // Esta story é o equivalente possível: o callback de mudança reportando
    // cada transição, que é o que quem consome sincroniza com o próprio estado.
    coversNotApplicable: {
      'functional.item7':
        'createAlertDialog não expõe uma opção open — o estado de abertura vive na factory e só é observável por onOpenChange',
    },
    // Override de story: o callback de mudança é o assunto, e ele não passa por
    // control neste arquivo.
    docs: {
      source: {
        transform: alertDialogSourceWith({
          onOpenChange: '(aberto) => sincronizarEstado(aberto)',
        }),
      },
      description: {
        story: 'A fábrica não recebe open: o estado de abertura vive nela e sai pelo callback de mudança, que reporta cada transição para quem consome sincronizar o próprio estado. Nascer aberto é o defaultOpen.',
      },
    },
  },
  render: () =>
    buildDemo({
      ...DESTRUCTIVE,
      onOpenChange: onOpenChangeSpy,
      onClose: onCloseSpy,
    }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onOpenChangeSpy.mockClear();
    onCloseSpy.mockClear();

    await step('Clique no trigger abre o diálogo e reporta a abertura', async () => {
      const trigger = canvas.getByRole('button', { name: LABELS.triggerLabel });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(onOpenChangeSpy).toHaveBeenCalledWith(true);
    });

    await step('Escape fecha, reporta o fechamento com o motivo e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await expect(onOpenChangeSpy).toHaveBeenLastCalledWith(false);
      // É este motivo que vira `dialog_close { reason: 'escape' }` na docs page.
      await expect(onCloseSpy).toHaveBeenCalledTimes(1);
      await expect(onCloseSpy).toHaveBeenLastCalledWith('escape');
      await expect(
        canvas.getByRole('button', { name: LABELS.triggerLabel }),
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
