import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createDialog } from './dialog';
import { createButton } from './button';
import { createDialogDocs } from '@/components/docs/DialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  abrir,
  botaoFecharDoCanto,
  conferirFocusTrap,
  conferirNomeEDescricao,
  esperarFechado,
  fechar,
  gatilho,
  overlay,
  painel,
} from './dialog.fixtures';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  showCloseButton: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta: Meta<DialogArgs> = {
  title: 'UI/Dialog',
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(createDialogDocs) },
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
  },
  args: {
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Salvar alterações',
    showCloseButton: true,
    onOpenChange: fn(),
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
  });

  const fecharPeloOverlay = () => {
    document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')?.click();
  };
  cancel.addEventListener('click', fecharPeloOverlay);
  action.addEventListener('click', fecharPeloOverlay);

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
    const trigger = gatilho(canvasElement)!;
    const espiao = args.onOpenChange as unknown as ReturnType<typeof fn>;

    await step('O markup é o contrato que as outras stacks copiam', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="dialog"]')!;
      await expect(raiz.tagName).toBe('DIV');
      await expect(trigger.tagName).toBe('BUTTON');
      // `type="button"`: dentro de um `<form>`, o submit herdado faria abrir o
      // diálogo enviar o formulário.
      await expect(trigger).toHaveAttribute('type', 'button');
    });

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // `fechar()` e não uma leitura do estado de montagem: a story termina
      // ABERTA (último passo), então na segunda rodada do painel Interactions o
      // painel já estaria montado. Quem verifica o estado fechado NA MONTAGEM é
      // a story `Closed`, que não interage com nada.
      await fechar();
      await expect(painel()).toBeNull();
      await expect(overlay()).toBeNull();
    });

    await step('Clicar no gatilho abre o diálogo com overlay', async () => {
      const chamadasAntes = espiao.mock.calls.length;
      const p = await abrir(canvasElement);
      await expect(p).toBeVisible();
      await expect(overlay()).toBeInTheDocument();
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(overlay()).toHaveAttribute('data-state', 'open');
      await expect(espiao.mock.calls.length).toBe(chamadasAntes + 1);
    });

    await step('O painel se anuncia como diálogo modal, com nome e descrição', async () => {
      const p = painel()!;
      await expect(p).toHaveAttribute('role', 'dialog');
      await expect(p).toHaveAttribute('aria-modal', 'true');
      await conferirNomeEDescricao(p);
    });

    await step('O foco entra no painel ao abrir', async () => {
      const p = painel()!;
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab não sai do painel', async () => {
      await conferirFocusTrap(painel()!);
    });

    await step('Escape fecha, avisa o callback e devolve o foco ao gatilho', async () => {
      const chamadasAntes = espiao.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await esperarFechado();
      await expect(espiao.mock.calls.length).toBe(chamadasAntes + 1);
      // Sem `waitFor`: a factory devolve o foco de forma síncrona, e envolver a
      // asserção mascararia um bug de foco real.
      await expect(document.activeElement).toBe(trigger);
    });

    await step('Clique no overlay fecha e devolve o foco', async () => {
      await abrir(canvasElement);
      overlay()!.click();
      await esperarFechado();
      await expect(document.activeElement).toBe(trigger);
    });

    if (args.showCloseButton) {
      await step('O botão X fecha, tem nome acessível e devolve o foco', async () => {
        const p = await abrir(canvasElement);
        const x = botaoFecharDoCanto(p)!;
        await expect(x).toHaveAccessibleName();
        await userEvent.click(x);
        await esperarFechado();
        await expect(document.activeElement).toBe(trigger);
      });
    }

    await step('O Cancelar do rodapé fecha sem tocar na ação primária', async () => {
      const p = await abrir(canvasElement);
      const rodape = p.querySelector<HTMLElement>('[data-slot="dialog-footer"]')!;
      const botoes = rodape.querySelectorAll<HTMLElement>('button');
      // As ações são filhas DIRETAS do rodapé: é o que o CSS do sistema espera.
      await expect(botoes.length).toBe(2);
      await expect(botoes[0].parentElement).toBe(rodape);
      await userEvent.click(botoes[0]);
      await esperarFechado();
    });

    await step('A story termina aberta', async () => {
      // O Chromatic fotografa o ESTADO FINAL e o axe do test-runner roda depois
      // da play: terminar fechada faria a captura mostrar só o gatilho e a
      // varredura de acessibilidade medir uma página sem diálogo nenhum — o
      // conteúdo compartilhado declara os dois sobre o estado ABERTO
      // (`visual.item1`, `accessibility.item6`).
      const p = await abrir(canvasElement);
      await expect(p).toBeVisible();
      await expect(within(p).getAllByRole('button').length).toBeGreaterThan(0);
    });
  },
};
