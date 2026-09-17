import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  createSheetCloseWatch,
  sheetCloseReason,
  type SheetCloseGesture,
  type SheetCloseReason,
} from './index';
import { Button } from '@/components/ui/button';
import SheetDocs from '@/components/docs/SheetDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { sheetPlaygroundSource } from './sheet.source';
import { waitForPointerRelease } from './sheet.fixtures';

import { figmaDesign } from '@shared/figma/design-links';
const LABELS = {
  trigger: 'Abrir filtros',
  title: 'Filtros avançados',
  description: 'Configure os filtros para refinar os resultados.',
  // Fixture em pt-BR: a story não consome o conteúdo compartilhado, mas diz a
  // mesma coisa que `demonstration.labels.body` na docs page.
  body: 'Conteúdo do painel: formulário, lista ou mensagem. É esta área que rola quando o conteúdo passa da altura da tela.',
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
  title: 'Components/Overlay/Sheet',
  component: Sheet,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('sheet'),
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

/**
 * O motivo que cada fechamento relatou, na ordem em que aconteceram.
 *
 * Mora no módulo, e não num `fn()` de args, porque o motivo NÃO é prop do Sheet:
 * pendurá-lo em `argTypes` o faria aparecer na tabela de propriedades da docs
 * page como se fosse parte da API. A `play` roda no mesmo módulo e lê daqui.
 */
const closeReasons: SheetCloseReason[] = [];

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
  await waitForPointerRelease();
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
  await waitForPointerRelease();
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
      SheetBody,
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
      // O caminho de saída que o painel viu por último. A anotação é do
      // primitivo; traduzi-la é do consumidor — aqui, da story.
      let gesture: SheetCloseGesture | null = null;
      const closeWatch = createSheetCloseWatch((seen) => { gesture = seen; });

      function handleOpenChange(open: boolean) {
        args.onOpenChange(open);
        if (open) {
          gesture = null;
          return;
        }
        closeReasons.push(sheetCloseReason(gesture));
        gesture = null;
      }

      return { args, rotulos: LABELS, closeWatch, handleOpenChange };
    },
    template: `
      <Sheet
        :key="String(args.defaultOpen) + String(args.modal)"
        :default-open="args.defaultOpen"
        :modal="args.modal"
        @update:open="handleOpenChange"
      >
        <SheetTrigger as-child>
          <Button variant="outline">{{ args.triggerLabel }}</Button>
        </SheetTrigger>
        <SheetContent v-bind="closeWatch" :side="args.side" :show-close-button="args.showCloseButton">
          <SheetHeader>
            <SheetTitle>{{ rotulos.title }}</SheetTitle>
            <SheetDescription>{{ rotulos.description }}</SheetDescription>
          </SheetHeader>
          <SheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{{ rotulos.body }}</p>
          </SheetBody>
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

    // Depois do fechamento de partida: a play REEXECUTA no mesmo DOM, e o
    // `close()` acima pode ter fechado o que a rodada anterior deixou aberto.
    closeReasons.length = 0;
    const lastCloseReason = () => closeReasons.at(-1);

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
      // A asserção que estava aqui repetia a espera palavra por palavra, e por
      // isso não podia reprovar nada que a espera já não tivesse reprovado. O
      // que a espera NÃO cobre: ela aceita o próprio painel, que tem
      // `tabindex="-1"` e recebe o foco na abertura — `panel.contains(panel)` é
      // verdadeiro. Estas duas medem que o Tab ANDOU até um controle de
      // verdade, em vez de o foco ter ficado parado na caixa.
      await expect(document.activeElement).not.toBe(panel);
      await expect(
        (document.activeElement as HTMLElement).matches(
          'a[href], button, input, select, textarea, [tabindex="0"]',
        ),
      ).toBe(true);
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
      // Mesmo conserto do sentido direto, e pelo mesmo motivo: a espera aceita
      // o painel parado, e o que interessa é que a volta parou num controle.
      await expect(document.activeElement).not.toBe(panel);
      await expect(
        (document.activeElement as HTMLElement).matches(
          'a[href], button, input, select, textarea, [tabindex="0"]',
        ),
      ).toBe(true);
    });

    await step('Escape fecha, devolve o foco ao gatilho e relata escape', async () => {
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(lastCloseReason()).toBe('escape');
    });

    await step('Clique no overlay fecha o painel e relata overlay', async () => {
      await open(trigger);
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      // `overlay.click()` NÃO serve, e era exatamente a falha desta story: a lib
      // dispensa a camada no `pointerdown`, que o `click()` sintético não emite
      // — o painel ficava aberto e a espera de fechamento estourava.
      await userEvent.click(overlay!);
      await waitForPortalGone('dialog');
      await expect(lastCloseReason()).toBe('overlay');
    });

    await step('O botão do canto fecha o painel e relata close-button', async () => {
      const panel = await open(trigger);
      const closeBtn = within(panel).getByRole('button', { name: /fechar/i });
      // O X é UM controle de fechar entre os possíveis, e se nomeia como tal —
      // é por este atributo que a delegação do painel o reconhece.
      await expect(closeBtn.closest('[data-slot="sheet-close"]')).not.toBeNull();
      await userEvent.click(closeBtn);
      await waitForPortalGone('dialog');
      await expect(lastCloseReason()).toBe('close-button');
    });

    await step('Cancelar no rodapé também fecha, e pelo mesmo motivo', async () => {
      const panel = await open(trigger);
      const cancelar = within(panel).getByRole('button', { name: LABELS.cancel });
      // O rodapé é de quem compõe: sem a delegação do painel, este caminho seria
      // invisível e o relatório diria "api" para um clique que é de botão.
      await expect(cancelar.closest('[data-slot="sheet-close"]')).not.toBeNull();
      await userEvent.click(cancelar);
      await waitForPortalGone('dialog');
      await expect(lastCloseReason()).toBe('close-button');
    });

    await step('Nenhum caminho de saída foi relatado como close-button por omissão', async () => {
      // O defeito que este passo guarda: até 2026-09-11 o motivo que sobrava era
      // `close-button`, então Escape e véu chegariam ao GA4 como "apertou o X".
      await expect(closeReasons).toEqual([
        'escape',
        'overlay',
        'close-button',
        'close-button',
      ]);
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa do
    // mesmo ponto de partida desta.
    await close();
  },
};
