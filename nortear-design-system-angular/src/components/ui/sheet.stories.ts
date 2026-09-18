import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_SHEET, sheetCloseReason, type SheetCloseReason } from './sheet';
import type { RdxDialogOpenChange } from '@radix-ng/primitives/dialog';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';
import { NdsSheetDocs } from '@/components/docs/SheetDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sheetPlaygroundSource, type SheetArgs } from './sheet.source';

import { figmaDesign } from '@shared/figma/design-links';
const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

const meta: Meta<SheetArgs> = {
  title: 'Components/Overlay/Sheet',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SHEET, NdsButton] })],
  parameters: {
    design: figmaDesign('sheet'),
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsSheetDocs) },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Borda de onde o painel desliza. Mora no conteúdo, não na raiz.',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Exibe o botão X no canto superior direito do painel.',
    },
    modal: {
      control: 'boolean',
      description:
        'Prende o foco, trava a rolagem da página e bloqueia o ponteiro fora do painel.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Verbo no infinitivo — nomeie a ação, nunca "Mais".',
    },
    // Espião de output. Sem entrada aqui o renderer Angular não repassa a função
    // em `props` e o `(openChange)` do template fica ligado a nada — sem erro
    // nenhum (armadilha 5 do CLAUDE.md deste stack).
    onOpenChange: {
      control: false,
      description: 'Emitido a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    side: 'right',
    showCloseButton: true,
    modal: true,
    defaultOpen: false,
    triggerLabel: t('demonstration.labels.trigger'),
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<SheetArgs>;

/**
 * Abre só se estiver fechado.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 * do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function open(trigger: HTMLElement): Promise<HTMLElement> {
  // O ponteiro volta DEPOIS do nó sair: enquanto o painel é modal a lib deixa
  // `pointer-events: none` no `body` e só o devolve depois de remover o painel.
  // Sem esta espera o clique de reabertura falha no intervalo — medido no stack
  // svelte, na mesma família de overlay.
  await waitFor(() => {
    if (getComputedStyle(document.body).pointerEvents === 'none') {
      throw new Error('o overlay ainda bloqueia o ponteiro');
    }
  });
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
  await waitForPortalVanish('dialog');
}

/**
 * Os motivos que o painel relatou, na ordem, gravados pelo render e lidos pela
 * play.
 *
 * O motivo é a única parte do fechamento que NÃO se vê no DOM: painel fechado
 * por Escape e painel fechado por código deixam exatamente a mesma tela. Sem
 * este registro, as quatro palavras da família — `escape`, `overlay`,
 * `close-button`, `api` — não tinham portão nenhum nesta stack, e uma troca no
 * mapeador passaria calada pelas doze stories.
 *
 * Fora do render porque o `(onOpenChange)` é ligado na MONTAGEM e a play só
 * recebe o `canvasElement`: sem um ponto combinado entre os dois, não há como
 * observar o output daqui. Os passos comparam o ANTES com o DEPOIS em vez de
 * zerar a lista — a play reexecuta no mesmo DOM, e uma lista zerada esconderia
 * um fechamento a mais.
 */
const closeReasons: SheetCloseReason[] = [];

function recordCloseReason(evento: RdxDialogOpenChange): void {
  if (!evento.open) closeReasons.push(sheetCloseReason(evento.reason));
}

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: sheetPlaygroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item3', 'accessibility.item4', 'accessibility.item5',
    ],
  },
  render: (args) => ({
    // Os rótulos do painel entram como props, não como args: são conteúdo
    // compartilhado (trilíngue), não parâmetro do componente — em `args`
    // virariam controls falsos na aba API Reference.
    props: {
      ...args,
      recordCloseReason,
      panelTitle: t('demonstration.labels.title'),
      panelDescription: t('demonstration.labels.description'),
      panelBody: t('demonstration.labels.body'),
      cancelLabel: t('demonstration.labels.cancel'),
      applyLabel: t('demonstration.labels.apply'),
    },
    template: `
      <nds-sheet
        #panel
        [defaultOpen]="defaultOpen"
        [modal]="modal"
        (openChange)="onOpenChange($event)"
        (onOpenChange)="recordCloseReason($event)"
      >
        <button ndsSheetTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsSheetContent [side]="side" [showCloseButton]="showCloseButton">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ panelTitle }}</h2>
            <p ndsSheetDescription>{{ panelDescription }}</p>
          </div>

          <div ndsSheetBody>
            <p class="nds-text-body nds-text-muted-foreground">{{ panelBody }}</p>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ cancelLabel }}</button>
            <!-- A primária CONFIRMA e sai, e sai pelo verbo público: close()
                 relata api, o motivo que separa no relatório o painel aplicado
                 do dispensado. Com ndsSheetClose ela fecharia pelo mesmo
                 caminho do X, e "aplicou" chegaria como "apertou fechar".
                 Sem crase aqui dentro: uma crase FECHA o template literal da
                 story, e o arquivo inteiro deixa de compilar. -->
            <button ndsButton (click)="panel.close()">{{ applyLabel }}</button>
          </div>
        </ng-template>
      </nds-sheet>
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
      // O nome acessível vem do aria-labelledby que o primitivo liga ao id REAL
      // do ndsSheetTitle — painel modal anônimo é o defeito silencioso aqui.
      await expect(panel).toHaveAccessibleName(t('demonstration.labels.title'));
      await expect(panel).toHaveAccessibleDescription(t('demonstration.labels.description'));
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'sheet-content');
      await expect(panel).toHaveAttribute('data-side', args.side);
      await expect(panel).toHaveAttribute('data-state', 'open');
      await expect(panel).toHaveClass(/nds-sheet-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step('O painel é portalizado para fora da story', async () => {
      // É o que faz `position: fixed` valer contra a viewport, e não contra
      // qualquer ancestral com transform.
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
      // Volta suficiente para dar a volta completa em qualquer um dos lados.
      for (let i = 0; i < 6; i++) await userEvent.tab();
      // A espera é o mecanismo, não folga: quem dá a volta é uma âncora de foco
      // da lib — um <span> IRMÃO do painel — e o retorno para dentro acontece no
      // tique seguinte. Sem a espera, a asserção reprova o transporte em vez do
      // destino; com ela, um foco que realmente escapasse continuaria
      // reprovando, porque nunca voltaria.
      // A asserção que existia aqui repetia a espera logo acima, palavra por
      // palavra: o `waitFor` já reprova por tempo se o foco não voltar, então
      // ela não podia falhar sozinha nunca.
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error('o foco saiu do painel e não voltou');
        }
      });
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
    });

    await step('Escape fecha, devolve o foco ao gatilho e reporta escape', async () => {
      const antes = closeReasons.length;
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
      await expect(closeReasons.length).toBe(antes + 1);
      await expect(closeReasons.at(-1)).toBe('escape');
    });

    // Os dois passos abaixo ficavam atrás de `if (args.modal)` e
    // `if (args.showCloseButton)`. Control desligado não é motivo para o portão
    // sumir: com o control no default — que é como a suíte roda —, o `if`
    // parecia proteger e só escondia a possibilidade de a story deixar de medir
    // se alguém trocasse o default. As outras três stacks sempre executam.
    await step('Clique no overlay fecha o painel e reporta overlay', async () => {
      await open(trigger);
      const antes = closeReasons.length;
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!);
      await waitForPortalVanish('dialog');
      await expect(closeReasons.length).toBe(antes + 1);
      // Clique no véu e foco que escapa são o mesmo gesto para quem usa: "saí
      // do painel sem decidir nada".
      await expect(closeReasons.at(-1)).toBe('overlay');
    });

    await step('O X do canto fecha o painel e reporta close-button', async () => {
      const panel = await open(trigger);
      const antes = closeReasons.length;
      const closeBtn = within(panel).getByRole('button', { name: /^Fechar$/i });
      await userEvent.click(closeBtn);
      await waitForPortalVanish('dialog');
      await expect(closeReasons.length).toBe(antes + 1);
      await expect(closeReasons.at(-1)).toBe('close-button');
    });

    await step('Cancelar no rodapé fecha e reporta close-button', async () => {
      const panel = await open(trigger);
      const antes = closeReasons.length;
      const cancelar = within(panel).getByRole('button', {
        name: t('demonstration.labels.cancel'),
      });
      await userEvent.click(cancelar);
      await waitForPortalVanish('dialog');
      await expect(closeReasons.length).toBe(antes + 1);
      // A saída do rodapé é um `ndsSheetClose`, o mesmo caminho do X: as duas
      // são "apertei a saída", e é isso que separa esta palavra de `api`.
      await expect(closeReasons.at(-1)).toBe('close-button');
    });

    await step('A ação primária fecha por decisão de dentro e reporta api', async () => {
      const panel = await open(trigger);
      const antes = closeReasons.length;
      await userEvent.click(
        within(panel).getByRole('button', { name: t('demonstration.labels.apply') }),
      );
      await waitForPortalVanish('dialog');
      await expect(closeReasons.length).toBe(antes + 1);
      // O defeito que este passo guarda: fechando por `ndsSheetClose`, a ação
      // que CONFIRMA chegaria ao relatório como "apertou o botão de fechar", e o
      // funil não saberia separar o painel aplicado do dispensado.
      await expect(closeReasons.at(-1)).toBe('api');
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa
    // do mesmo ponto de partida desta.
    await close();
  },
};
