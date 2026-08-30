import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import SheetDocs from '@/components/docs/SheetDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { sheetPlaygroundSource } from './sheet.source';

const LABELS = {
  trigger: 'Abrir filtros',
  title: 'Filtros avançados',
  description: 'Configure os filtros para refinar os resultados.',
  cancel: 'Cancelar',
  apply: 'Aplicar filtros',
};

type SheetArgs = {
  side: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (open: boolean) => void;
};

const meta = {
  title: 'Primitives/Disclosure/Sheet',
  component: Sheet,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(SheetDocs), source: { transform: sheetPlaygroundSource } },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Borda de onde o painel desliza. Mora no conteúdo, não na raiz.',
      table: { type: { summary: "'top' | 'right' | 'bottom' | 'left'" }, defaultValue: { summary: "'right'" } },
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Exibe o botão de fechar no canto superior direito do painel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    modal: {
      control: 'boolean',
      description:
        'Prende o foco, trava a rolagem da página e bloqueia o ponteiro fora do painel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo no infinitivo — nomeie a ação, nunca "Mais".',
      table: { type: { summary: 'string' } },
    },
    onOpenChange: {
      control: false,
      description: 'Chamado a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    side: 'right',
    showCloseButton: true,
    modal: true,
    defaultOpen: false,
    triggerLabel: LABELS.trigger,
    onOpenChange: fn(),
  },
} satisfies Meta<SheetArgs>;

export default meta;
type Story = StoryObj<SheetArgs>;

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

/**
 * Fecha e espera a interação voltar.
 *
 * O painel sumir do DOM não basta: enquanto ele é modal a lib deixa
 * `pointer-events: none` no `body` e só devolve DEPOIS de remover o nó. O
 * clique seguinte falharia nesse intervalo.
 */
async function close(): Promise<void> {
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
  render: (args) => ({
    components: {
      Sheet,
      SheetClose,
      SheetContent,
      SheetDescription,
      SheetFooter,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      Button,
    },
    setup() {
      return { args, rotulos: LABELS };
    },
    template: `
      <Sheet
        :key="String(args.defaultOpen) + String(args.modal)"
        :default-open="args.defaultOpen"
        :modal="args.modal"
        @update:open="args.onOpenChange"
      >
        <SheetTrigger as-child>
          <Button variant="outline">{{ args.triggerLabel }}</Button>
        </SheetTrigger>
        <SheetContent :side="args.side" :show-close-button="args.showCloseButton">
          <SheetHeader>
            <SheetTitle>{{ rotulos.title }}</SheetTitle>
            <SheetDescription>{{ rotulos.description }}</SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">{{ rotulos.cancel }}</Button>
            </SheetClose>
            <Button>{{ rotulos.apply }}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: args.triggerLabel });

    await close();

    await step('Clicar no gatilho abre o painel, com nome e descrição acessíveis', async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const panel = await open(trigger);

      await expect(panel).toBeVisible();
      // O nome acessível vem do aria-labelledby ligado ao id REAL do SheetTitle
      // — painel modal anônimo é o defeito silencioso aqui.
      await expect(panel).toHaveAccessibleName(LABELS.title);
      await expect(panel).toHaveAccessibleDescription(LABELS.description);
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
      await expect(panel).toHaveAttribute('data-side', args.side);
      await expect(panel).toHaveClass(/nds-sheet-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('O painel é portalizado para fora da story', async () => {
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

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
    });

    await step('Clique no overlay fecha o painel', async () => {
      await open(trigger);
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      // `overlay.click()` NÃO serve, e era exatamente a falha desta story: a lib
      // dispensa a camada no `pointerdown`, que o `click()` sintético não emite
      // — o painel ficava aberto e a espera de fechamento estourava.
      await userEvent.click(overlay!);
      await waitForPortalGone('dialog');
    });

    await step('O botão do canto fecha o painel', async () => {
      const panel = await open(trigger);
      const closeBtn = within(panel).getByRole('button', { name: /fechar/i });
      await userEvent.click(closeBtn);
      await waitForPortalGone('dialog');
    });

    await step('Cancelar no rodapé também fecha', async () => {
      const panel = await open(trigger);
      const cancelar = within(panel).getByRole('button', { name: LABELS.cancel });
      await userEvent.click(cancelar);
      await waitForPortalGone('dialog');
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa do
    // mesmo ponto de partida desta.
    await close();
  },
};
