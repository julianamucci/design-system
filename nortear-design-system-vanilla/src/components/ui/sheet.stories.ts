import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSheet, type SheetSide } from './sheet';
import { createButton } from './button';
import { createSheetDocs } from '@/components/docs/SheetDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SheetArgs = {
  triggerLabel: string;
  side: SheetSide;
  title: string;
  description: string;
  cancelLabel: string;
  applyLabel: string;
  onOpenChange: (open: boolean) => void;
};

const meta: Meta<SheetArgs> = {
  title: 'UI/Sheet',
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createSheetDocs) },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo no infinitivo — nomeie a ação, nunca "Mais".',
      table: { type: { summary: 'string' } },
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Borda de onde o painel desliza.',
      table: { type: { summary: "'top' | 'right' | 'bottom' | 'left'" }, defaultValue: { summary: "'right'" } },
    },
    title: {
      control: 'text',
      description: 'Título do painel — é ele que dá o nome acessível ao diálogo.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Descrição sob o título, ligada ao painel por aria-describedby.',
      table: { type: { summary: 'string' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo da saída do rodapé.',
      table: { type: { summary: 'string' } },
    },
    applyLabel: {
      control: 'text',
      description: 'Rótulo da ação primária do rodapé.',
      table: { type: { summary: 'string' } },
    },
    onOpenChange: {
      control: false,
      description: 'Chamado a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    triggerLabel: 'Abrir filtros',
    side: 'right',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    cancelLabel: 'Cancelar',
    applyLabel: 'Aplicar filtros',
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<SheetArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayground(args: SheetArgs): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });

  const body = document.createElement('div');
  body.className = 'nds-text-body nds-text-muted-foreground';
  body.textContent = 'Conteúdo do painel (formulário, lista, mensagem).';

  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  const apply = createButton({ variant: 'default', label: args.applyLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'sm';
  footer.append(cancel, apply);

  // A factory não expõe SheetClose: quem fecha por fora é o overlay, e é ele
  // que os botões do rodapé acionam.
  const fecharPorAcao = () => {
    document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]')?.click();
  };
  cancel.addEventListener('click', fecharPorAcao);
  apply.addEventListener('click', fecharPorAcao);

  return createSheet({
    trigger,
    side: args.side,
    title: args.title,
    description: args.description,
    content: body,
    footer,
    onOpenChange: args.onOpenChange,
  });
}

/** Espera o `body` voltar a aceitar ponteiro depois de um fechamento. */
async function esperarPonteiroLiberado(): Promise<void> {
  await waitFor(() => {
    if (getComputedStyle(document.body).pointerEvents === 'none') {
      throw new Error('o overlay ainda bloqueia o ponteiro');
    }
  });
}

/**
 * Abre só se estiver fechado.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 * do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function abrir(trigger: HTMLElement): Promise<HTMLElement> {
  // O ponteiro volta DEPOIS do nó sair: enquanto o painel é modal a lib deixa
  // `pointer-events: none` no `body` e só o devolve depois de remover o painel.
  // Sem esta espera o clique de reabertura falha no intervalo — medido.
  await esperarPonteiroLiberado();
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal('dialog');
}

/** Fecha só se estiver aberto. */
async function fechar(): Promise<void> {
  if (within(document.body).queryAllByRole('dialog').length > 0) {
    await userEvent.keyboard('{Escape}');
  }
  await waitForPortalGone('dialog');
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => buildPlayground(args),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: args.triggerLabel });

    await fechar();

    await step('Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const chamadasAntes = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const painel = await abrir(trigger);

      await expect(painel).toBeVisible();
      // O nome acessível vem do aria-labelledby ligado ao id REAL do título —
      // painel modal anônimo é o defeito silencioso aqui.
      await expect(painel).toHaveAccessibleName(args.title);
      await expect(painel).toHaveAccessibleDescription(args.description);
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAttribute('data-slot', 'sheet-content');
      await expect(painel).toHaveAttribute('data-side', args.side);
      await expect(painel).toHaveClass(/nds-sheet-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(chamadasAntes + 1);
    });

    await step('O painel é portalizado para fora da story', async () => {
      // É o que faz `position: fixed` valer contra a viewport, e não contra um
      // ancestral com `contain`/`transform`.
      const painel = await waitForPortal('dialog');
      await expect(canvasElement.contains(painel)).toBe(false);
      await expect(document.body.contains(painel)).toBe(true);
    });

    await step('O foco entra no painel ao abrir', async () => {
      const painel = await waitForPortal('dialog');
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });

    await step('Tab mantém o foco preso dentro do painel', async () => {
      const painel = await waitForPortal('dialog');
      // Voltas suficientes para dar o ciclo completo em qualquer um dos lados.
      for (let i = 0; i < 6; i++) await userEvent.tab();
      // A espera é o mecanismo, não folga: quem dá a volta é uma âncora de foco
      // da lib — um <span> IRMÃO do painel — e o retorno para dentro acontece no
      // tique seguinte. Sem a espera, a asserção reprova o transporte em vez do
      // destino; com ela, um foco que realmente escapasse continuaria
      // reprovando, porque nunca voltaria.
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error('o foco saiu do painel e não voltou');
        }
      });
      await expect(painel.contains(document.activeElement)).toBe(true);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await fechar();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
    });

    await step('Clique no overlay fecha o painel', async () => {
      await abrir(trigger);
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!);
      await waitForPortalGone('dialog');
    });

    await step('O botão do canto fecha o painel', async () => {
      const painel = await abrir(trigger);
      const fecharBtn = within(painel).getByRole('button', { name: /fechar/i });
      await userEvent.click(fecharBtn);
      await waitForPortalGone('dialog');
    });

    await step('Cancelar no rodapé também fecha', async () => {
      const painel = await abrir(trigger);
      const cancelar = within(painel).getByRole('button', { name: args.cancelLabel });
      await userEvent.click(cancelar);
      await waitForPortalGone('dialog');
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa do
    // mesmo ponto de partida desta.
    await fechar();
  },
};
