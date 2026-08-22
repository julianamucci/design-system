import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import SheetDocs from '@/components/docs/SheetDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sheetSource } from './sheet.source';

const meta: Meta = {
  title: 'UI/Sheet',
  component: SheetStory,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SheetDocs),
      source: { transform: sheetSource },
      description: {
        component:
          'Painel deslizante com quatro direções, foco preso enquanto está aberto, ' +
          'Escape para fechar e clique no overlay como saída.',
      },
    },
  },
  // O docgen está desligado neste stack: `argTypes` é a ÚNICA fonte da aba API
  // Reference. Todo arg precisa de entrada aqui, senão some da tabela.
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Borda de onde o painel desliza. Mora no conteúdo, não na raiz.',
      table: { type: { summary: "'top' | 'right' | 'bottom' | 'left'" }, defaultValue: { summary: "'right'" } },
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Exibe o botão de fechar no canto superior direito do painel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo no infinitivo — nomeie a ação, nunca "Mais".',
      table: { type: { summary: 'string' } },
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
    actionLabel: {
      control: 'text',
      description: 'Rótulo da ação primária do rodapé.',
      table: { type: { summary: 'string' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo da saída do rodapé.',
      table: { type: { summary: 'string' } },
    },
    onAction: {
      control: false,
      description: 'Chamado ao acionar a ação primária do rodapé.',
      table: { type: { summary: '() => void' } },
    },
    onCancel: {
      control: false,
      description: 'Chamado ao acionar a saída do rodapé.',
      table: { type: { summary: '() => void' } },
    },
  },
  args: {
    side: 'right',
    showCloseButton: true,
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
};

export default meta;
type Story = StoryObj;

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
async function abrir(trigger: HTMLElement): Promise<HTMLElement> {
  // O ponteiro volta DEPOIS do nó sair: enquanto o painel é modal a lib deixa
  // `pointer-events: none` no `body` e só o devolve depois de remover o painel.
  // Sem esta espera o clique de reabertura falha no intervalo — medido.
  await waitForPointerLiberado();
  if (within(document.body).queryAllByRole('dialog').length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal('dialog');
}

/**
 * Fecha e espera a interação voltar.
 *
 * O painel sumir do DOM não basta: enquanto ele é modal a lib deixa
 * `pointer-events: none` no `body` e só devolve DEPOIS de remover o nó. O
 * clique seguinte falharia nesse intervalo.
 */
async function fechar(): Promise<void> {
  if (within(document.body).queryAllByRole('dialog').length > 0) {
    await userEvent.keyboard('{Escape}');
  }
  await waitForPortalGone('dialog');
  await waitForPointerLiberado();
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: args.triggerLabel as string });

    await fechar();

    await step('Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const painel = await abrir(trigger);

      await expect(painel).toBeVisible();
      // O nome acessível vem do aria-labelledby ligado ao id REAL do SheetTitle
      // — painel modal anônimo é o defeito silencioso aqui.
      await expect(painel).toHaveAccessibleName(args.title as string);
      await expect(painel).toHaveAccessibleDescription(args.description as string);
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      await expect(painel).toHaveAttribute('data-slot', 'sheet-content');
      await expect(painel).toHaveAttribute('data-side', args.side as string);
      await expect(painel).toHaveClass(/nds-sheet-content/);
    });

    await step('O painel é portalizado para fora da story', async () => {
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
      // `overlay.click()` NÃO serve: a lib dispensa a camada no `pointerdown`,
      // que o `click()` sintético não emite.
      await userEvent.click(overlay!);
      await waitForPortalGone('dialog');
    });

    await step('O botão do canto fecha o painel', async () => {
      const painel = await abrir(trigger);
      const closeBtn = within(painel).getByRole('button', { name: /fechar/i });
      await userEvent.click(closeBtn);
      await waitForPortalGone('dialog');
    });

    await step('Cancelar no rodapé fecha e avisa quem escuta', async () => {
      const painel = await abrir(trigger);
      const antes = (args.onCancel as ReturnType<typeof fn>).mock.calls.length;
      await userEvent.click(
        within(painel).getByRole('button', { name: args.cancelLabel as string }),
      );
      await waitForPortalGone('dialog');
      await expect((args.onCancel as ReturnType<typeof fn>).mock.calls.length).toBe(antes + 1);
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa do
    // mesmo ponto de partida desta.
    await fechar();
  },
};
