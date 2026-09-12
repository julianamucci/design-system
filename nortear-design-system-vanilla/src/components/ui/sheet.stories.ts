import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { createSheet, type SheetCloseReason, type SheetSide } from './sheet';
import { sheetSource } from './sheet.source';
import { createButton } from './button';
import { makeBody } from './sheet.fixtures';
import { createSheetDocs } from '@/components/docs/SheetDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

import { figmaDesign } from '@shared/figma/design-links';
// ─── Meta ─────────────────────────────────────────────────────────────────────

type SheetArgs = {
  triggerLabel: string;
  side: SheetSide;
  title: string;
  description: string;
  cancelLabel: string;
  applyLabel: string;
  onOpenChange: (open: boolean) => void;
  onClose: (reason: SheetCloseReason) => void;
};

const meta: Meta<SheetArgs> = {
  title: 'Components/Overlay/Sheet',
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    docs: { page: withAutoDocsTab(createSheetDocs), source: { transform: sheetSource } },
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
    onClose: {
      control: false,
      description:
        "Chamado no fechamento com o caminho que o causou: 'escape', 'overlay' (clique no véu), 'close-button' (o X do canto ou qualquer data-slot=\"sheet-close\" dentro do painel) e 'api' (a chamada de close()). Dispara antes do callback de mudança.",
      table: {
        type: { summary: "(reason: 'escape' | 'overlay' | 'close-button' | 'api') => void" },
      },
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
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<SheetArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayground(args: SheetArgs): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });

  // Mesmo texto que a Demonstração da docs page mostra
  // (`demonstration.labels.body`): o Playground e ela renderizam O MESMO
  // exemplo, e aqui a fixture é pt-BR porque a story não passa por i18n.
  // O parágrafo vem da fixture, que lê a mesma constante que o painel Code.
  const body = makeBody();

  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  const apply = createButton({ variant: 'default', label: args.applyLabel });
  const footer = document.createElement('div');
  footer.className = 'nds-cluster';
  footer.dataset.spacing = 'md';
  footer.append(cancel, apply);

  // Os DOIS caminhos de saída do rodapé, e eles são motivos diferentes.
  //
  // O Cancelar se MARCA: a fábrica delega o clique em `[data-slot="sheet-close"]`
  // dentro do painel e relata `close-button`. A ação primária fecha por DECISÃO
  // DE DENTRO — `close()` no que a fábrica devolve, relatado como `api`.
  //
  // Até 2026-09-11 nenhum dos dois existia, e os dois fingiam um clique no véu:
  // dois caminhos distintos chegavam ao analytics como `overlay`.
  cancel.dataset.slot = 'sheet-close';

  const sheet = createSheet({
    trigger,
    side: args.side,
    title: args.title,
    description: args.description,
    content: body,
    footer,
    onOpenChange: args.onOpenChange,
    onClose: args.onClose,
  });

  apply.addEventListener('click', () => sheet.close());

  return sheet;
}

/** Espera o `body` voltar a aceitar ponteiro depois de um fechamento. */
async function waitForPointerLiberado(): Promise<void> {
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
async function open(trigger: HTMLElement): Promise<HTMLElement> {
  // O ponteiro volta DEPOIS do nó sair: enquanto o painel é modal a lib deixa
  // `pointer-events: none` no `body` e só o devolve depois de remover o painel.
  // Sem esta espera o clique de reabertura falha no intervalo — medido.
  await waitForPointerLiberado();
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal('dialog');
}

/** Fecha só se estiver aberto. */
async function close(): Promise<void> {
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

    await close();

    await step('Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const panel = await open(trigger);

      await expect(panel).toBeVisible();
      // O nome acessível vem do aria-labelledby ligado ao id REAL do título —
      // painel modal anônimo é o defeito silencioso aqui.
      await expect(panel).toHaveAccessibleName(args.title);
      await expect(panel).toHaveAccessibleDescription(args.description);
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
      await expect(panel).toHaveAttribute('data-side', args.side);
      await expect(panel).toHaveClass(/nds-sheet-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('O painel é portalizado para fora da story', async () => {
      // É o que faz `position: fixed` valer contra a viewport, e não contra um
      // ancestral com `contain`/`transform`.
      const panel = await waitForPortal('dialog');
      await expect(canvasElement.contains(panel)).toBe(false);
      await expect(document.body.contains(panel)).toBe(true);
    });

    await step('O foco entra no painel ao abrir', async () => {
      const panel = await waitForPortal('dialog');
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco não entrou no painel');
        }
      });
    });

    await step('Tab mantém o foco preso dentro do painel', async () => {
      const panel = await waitForPortal('dialog');
      // Voltas suficientes para dar o ciclo completo em qualquer um dos lados.
      for (let i = 0; i < 6; i++) await userEvent.tab();
      // A espera é o mecanismo, não folga: quem dá a volta é uma âncora de foco
      // da lib — um <span> IRMÃO do painel — e o retorno para dentro acontece no
      // tique seguinte. Sem a espera, a asserção reprova o transporte em vez do
      // destino; com ela, um foco que realmente escapasse continuaria
      // reprovando, porque nunca voltaria.
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco saiu do painel e não voltou');
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    await step('Shift+Tab dá a volta para o outro lado, sem sair do painel', async () => {
      const panel = await waitForPortal('dialog');
      // O par negativo do passo acima: `accessibility.keyboard` documenta as
      // duas direções e só a direta tinha asserção. No sentido inverso o laço
      // passa por um ramo próprio — no Vanilla é literalmente o `if
      // (e.shiftKey)`, que nenhuma story percorria.
      for (let i = 0; i < 6; i++) await userEvent.tab({ shift: true });
      // Mesma espera do sentido direto, e pelo mesmo motivo: a volta passa
      // por uma âncora de foco irmã do painel e o retorno cai no tique
      // seguinte. Foco que escapasse de verdade nunca voltaria, e reprovaria.
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco saiu do painel para trás e não voltou');
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    // O MOTIVO que chegou ao `onClose` na última vez.
    //
    // Cada caminho de saída tem o seu, e é esse valor que vira o `reason` do
    // `dialog_close` no GA4: sem uma asserção por caminho, uma troca de fiação
    // faz quatro séries virarem uma sem nada ficar vermelho — que é como a docs
    // page desta stack passou a sintetizar `api` por fora, fingindo um clique
    // no véu e sobrescrevendo o motivo relatado.
    const onClose = args.onClose as unknown as ReturnType<typeof fn>;
    const lastReason = (): unknown => onClose.mock.calls.at(-1)?.[0];

    await step('Escape fecha, devolve o foco ao gatilho e relata escape', async () => {
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(lastReason()).toBe('escape');
    });

    await step('Clique no overlay fecha o painel e relata overlay', async () => {
      await open(trigger);
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!);
      await waitForPortalGone('dialog');
      await expect(lastReason()).toBe('overlay');
    });

    await step('O botão do canto fecha o painel e relata close-button', async () => {
      const panel = await open(trigger);
      const closeBtn = within(panel).getByRole('button', { name: /fechar/i });
      // O X se nomeia pelo mesmo slot que qualquer saída componível — é o
      // contrato que React e Angular já escreviam e que esta stack não tinha.
      await expect(closeBtn).toHaveAttribute('data-slot', 'sheet-close');
      await userEvent.click(closeBtn);
      await waitForPortalGone('dialog');
      await expect(lastReason()).toBe('close-button');
    });

    await step('Cancelar no rodapé fecha pelo slot, e também relata close-button', async () => {
      const panel = await open(trigger);
      const cancelar = within(panel).getByRole('button', { name: args.cancelLabel });
      // Um botão do CONSUMIDOR, montado fora da fábrica: quem o faz fechar é a
      // delegação do painel, e é isso que este passo prova. Antes o rodapé
      // fingia um clique no véu, e o motivo saía `overlay`.
      await expect(cancelar).toHaveAttribute('data-slot', 'sheet-close');
      const chamadasAntes = onClose.mock.calls.length;
      await userEvent.click(cancelar);
      await waitForPortalGone('dialog');
      await expect(lastReason()).toBe('close-button');
      // UMA vez: o X tem o slot e a fábrica delega no painel — um ouvinte
      // próprio somado à delegação fecharia duas vezes, e o GA4 contaria dois.
      await expect(onClose.mock.calls.length).toBe(chamadasAntes + 1);
    });

    await step('A ação primária fecha por close() e relata api', async () => {
      const panel = await open(trigger);
      const aplicar = within(panel).getByRole('button', { name: args.applyLabel });
      await userEvent.click(aplicar);
      await waitForPortalGone('dialog');
      // `api` é o quarto motivo do vocabulário da família, e o que separa no
      // analytics o painel que a pessoa dispensou do que o programa recolheu.
      await expect(lastReason()).toBe('api');
    });

    await step('close() sobre painel já fechado não inventa fechamento', async () => {
      // A guarda do lado de fora: sem ela, `close()` com o painel desmontado
      // devolveria o foco a um alvo velho e mandaria um `dialog_close` que
      // ninguém provocou — fechamento falso no GA4.
      const chamadasAntes = onClose.mock.calls.length;
      (canvasElement.querySelector('[data-slot="sheet"]') as { close?: () => void } | null)?.close?.();
      await expect(onClose.mock.calls.length).toBe(chamadasAntes);
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa do
    // mesmo ponto de partida desta.
    await close();
  },
};
