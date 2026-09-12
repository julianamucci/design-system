import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createDialog, type DialogCloseReason } from './dialog';
import { dialogSource } from './dialog.source';
import { createButton } from './button';
import { createDialogDocs } from '@/components/docs/DialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  t,
  open,
  cantoButtonClose,
  checkFocusTrap,
  checkNameAndDescription,
  waitForClosed,
  close,
  trigger,
  overlay,
  panel,
} from './dialog.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

type DialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  showCloseButton: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: (reason: DialogCloseReason) => void;
};

const meta: Meta<DialogArgs> = {
  title: 'Components/Overlay/Dialog',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('dialog'),
    docs: { page: withAutoDocsTab(createDialogDocs), source: { transform: dialogSource } },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do botão que abre o diálogo.' },
    title:        { control: 'text', description: 'Título exibido no header (aria-labelledby).' },
    description:  { control: 'text', description: 'Descrição (aria-describedby).' },
    cancelLabel:  { control: 'text', description: 'Texto do botão de cancelar.' },
    actionLabel:  { control: 'text', description: 'Texto do botão de ação primária.' },
    showCloseButton: {
      control: 'boolean',
      description: 'Exibe o botão X no canto superior direito.',
    },
    onOpenChange: {
      control: false,
      description: 'Chamado a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
    onClose: {
      control: false,
      description:
        "Chamado no fechamento com o caminho que o causou: 'escape', 'overlay' (clique no véu), 'close-button' (o X do canto ou qualquer data-slot=\"dialog-close\" dentro do painel) e 'api' (a chamada de close()). Dispara antes do callback de mudança.",
      table: {
        type: { summary: "(reason: 'escape' | 'overlay' | 'close-button' | 'api') => void" },
      },
    },
  },
  // Os rótulos saem do conteúdo compartilhado: cravados aqui, o Playground
  // abria em português para quem lê a página em inglês ou espanhol. Continuam
  // sendo `args` — quem troca o texto pelo painel Controls segue trocando.
  args: {
    triggerLabel: t('demonstration.labels.triggerLabel'),
    title: t('demonstration.labels.title'),
    description: t('demonstration.labels.description'),
    cancelLabel: t('demonstration.labels.cancel'),
    actionLabel: t('demonstration.labels.action'),
    showCloseButton: true,
    onOpenChange: fn(),
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<DialogArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayground(args: DialogArgs): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  const action = createButton({ variant: 'default', label: args.actionLabel });

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do corpo do diálogo (formulário, mensagem, mídia).';

  // Os DOIS caminhos de saída do rodapé, e eles são motivos diferentes.
  //
  // O Cancelar se MARCA: a fábrica delega o clique em `[data-slot="dialog-close"]`
  // dentro do painel e relata `close-button`. A ação primária fecha por DECISÃO
  // DE DENTRO — `close()` no que a fábrica devolve, relatado como `api`.
  //
  // Até 2026-09-11 a fábrica não expunha nem um nem outro (só `destroy()`, que
  // encerra a instância), e os dois botões fingiam um clique no véu: dois
  // caminhos distintos chegavam ao analytics como `overlay`.
  cancel.dataset.slot = 'dialog-close';

  const dialog = createDialog({
    trigger,
    title: args.title,
    description: args.description,
    content,
    // Lista, e não um `<div>` de embrulho: as ações precisam ser filhas diretas
    // de `.nds-dialog-footer` para o arranjo do CSS valer.
    footer: [cancel, action],
    showCloseButton: args.showCloseButton,
    onOpenChange: args.onOpenChange,
    onClose: args.onClose,
  });

  action.addEventListener('click', () => dialog.close());

  return dialog;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => buildPlayground(args),
  play: async ({ canvasElement, step, args }) => {
    const triggerEl = trigger(canvasElement)!;
    const spy = args.onOpenChange as unknown as ReturnType<typeof fn>;

    // O MOTIVO que chegou ao `onClose` na última vez.
    //
    // Cada caminho de saída tem o seu, e é esse valor que vira o `reason` do
    // `dialog_close` no GA4: sem uma asserção por caminho, uma troca de fiação
    // faz quatro séries virarem uma sem nada ficar vermelho.
    const onClose = args.onClose as unknown as ReturnType<typeof fn>;
    const lastReason = (): unknown => onClose.mock.calls.at(-1)?.[0];

    await step('O markup é o contrato que as outras stacks copiam', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="dialog"]')!;
      await expect(root.tagName).toBe('DIV');
      await expect(triggerEl.tagName).toBe('BUTTON');
      // `type="button"`: dentro de um `<form>`, o submit herdado faria abrir o
      // diálogo enviar o formulário.
      await expect(triggerEl).toHaveAttribute('type', 'button');
    });

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // `fechar()` e não uma leitura do estado de montagem: a story termina
      // ABERTA (último passo), então na segunda rodada do painel Interactions o
      // painel já estaria montado. Quem verifica o estado fechado NA MONTAGEM é
      // a story `Closed`, que não interage com nada.
      await close();
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
    });

    // Lido com o diálogo JÁ FECHADO, e não presumido vazio: outro painel da
    // mesma página pode estar segurando a trava, e é este valor — não `''` — o
    // que o fechamento tem de devolver.
    const overflowWhenClosed = document.body.style.overflow;

    await step('O gatilho anuncia o que ele abre, antes de qualquer clique', async () => {
      // Quem navega por leitor de tela decide se vale ativar ANTES de ativar:
      // sem isto o botão se anuncia como um botão qualquer, e a pessoa só
      // descobre que caiu num modal depois de estar dentro dele.
      await expect(triggerEl).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no gatilho abre o diálogo com overlay', async () => {
      const callsBefore = spy.mock.calls.length;
      const p = await open(canvasElement);
      await expect(p).toBeVisible();
      await expect(overlay()).toBeInTheDocument();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(overlay()).toHaveAttribute('data-state', 'open');
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
    });

    await step('Aberto, o gatilho diz que está aberto e a página atrás não rola', async () => {
      // `aria-modal="true"` promete que o resto da página está fora de alcance.
      // Sem a trava a promessa é falsa: o leitor de tela não alcança o que está
      // atrás, mas a roda do mouse alcança — e o texto compartilhado prometia
      // por escrito uma trava que a fábrica não tinha.
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'true');
      await expect(document.body.style.overflow).toBe('hidden');
    });

    await step('O painel se anuncia como diálogo modal, com nome e descrição', async () => {
      const p = panel()!;
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(p).toHaveAttribute('aria-modal', 'true');
      await checkNameAndDescription(p);
    });

    await step('O foco entra no painel ao abrir', async () => {
      const p = panel()!;
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab não sai do painel', async () => {
      await checkFocusTrap(panel()!);
    });

    await step('Escape fecha, avisa o callback e devolve o foco ao gatilho', async () => {
      const callsBefore = spy.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      await expect(lastReason()).toBe('escape');
      // Sem `waitFor`: a factory devolve o foco de forma síncrona, e envolver a
      // asserção mascararia um bug de foco real.
      await expect(document.activeElement).toBe(triggerEl);
      // O par da trava: contada, ela só devolve a rolagem quando a última sai.
      // Um painel que trava e não solta deixa a página inteira parada sem erro
      // nenhum — é o defeito que o contador de `@/lib/scroll-lock` existe para
      // evitar, e é aqui que ele se prova pelo lado de fora.
      await expect(triggerEl).toHaveAttribute('aria-expanded', 'false');
      await expect(document.body.style.overflow).toBe(overflowWhenClosed);
    });

    await step('Clique no overlay fecha, devolve o foco e relata overlay', async () => {
      await open(canvasElement);
      overlay()!.click();
      await waitForClosed();
      await expect(document.activeElement).toBe(triggerEl);
      await expect(lastReason()).toBe('overlay');
    });

    if (args.showCloseButton) {
      await step('O botão X fecha, tem nome acessível e relata close-button', async () => {
        const p = await open(canvasElement);
        const x = cantoButtonClose(p)!;
        await expect(x).toHaveAccessibleName();
        const chamadasAntes = onClose.mock.calls.length;
        await userEvent.click(x);
        await waitForClosed();
        await expect(document.activeElement).toBe(triggerEl);
        await expect(lastReason()).toBe('close-button');
        // UMA vez: o X carrega o slot e a fábrica delega no painel — somar um
        // ouvinte próprio à delegação fecharia duas vezes, e o GA4 contaria dois.
        await expect(onClose.mock.calls.length).toBe(chamadasAntes + 1);
      });
    }

    await step('O Cancelar do rodapé fecha pelo slot e relata close-button', async () => {
      const p = await open(canvasElement);
      const footer = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const buttons = footer.querySelectorAll<HTMLElement>('button');
      // As ações são filhas DIRETAS do rodapé: é o que o CSS do sistema espera.
      await expect(buttons.length).toBe(2);
      await expect(buttons[0].parentElement).toBe(footer);
      // Um botão do CONSUMIDOR, montado fora da fábrica: quem o faz fechar é a
      // delegação do painel. A docs page ENSINAVA esta marca desde sempre, e
      // até 2026-09-11 nada a escutava — o Cancelar documentado era inerte.
      await expect(buttons[0]).toHaveAttribute('data-slot', 'dialog-close');
      await userEvent.click(buttons[0]);
      await waitForClosed();
      await expect(lastReason()).toBe('close-button');
    });

    await step('A ação primária fecha por close() e relata api', async () => {
      const p = await open(canvasElement);
      const buttons = p.querySelectorAll<HTMLElement>('[data-slot="dialog-footer"] button');
      await userEvent.click(buttons[1]);
      await waitForClosed();
      // `api` é o quarto motivo do vocabulário da família, e o que separa no
      // analytics o painel que a pessoa dispensou do que o programa recolheu.
      await expect(lastReason()).toBe('api');
    });

    await step('close() sobre painel já fechado não inventa fechamento', async () => {
      // A guarda do lado de fora: sem ela, `close()` com o painel desmontado
      // devolveria o foco a um alvo velho e mandaria um `dialog_close` que
      // ninguém provocou — fechamento falso no GA4.
      const chamadasAntes = onClose.mock.calls.length;
      (canvasElement.querySelector('[data-slot="dialog"]') as { close?: () => void } | null)?.close?.();
      await expect(onClose.mock.calls.length).toBe(chamadasAntes);
    });

    await step('A story termina aberta', async () => {
      // O Chromatic fotografa o ESTADO FINAL e o axe do test-runner roda depois
      // da play: terminar fechada faria a captura mostrar só o gatilho e a
      // varredura de acessibilidade medir uma página sem diálogo nenhum — o
      // conteúdo compartilhado declara os dois sobre o estado ABERTO
      // (`visual.item1`, `accessibility.item6`).
      const p = await open(canvasElement);
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};
