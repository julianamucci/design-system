import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_SHEET, type SheetSide } from './sheet';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import sheetTranslations from '@shared/content/sheet/translations.json';
import { NdsSheetDocs } from '@/components/docs/SheetDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const { t } = useTranslation(sheetTranslations as Record<string, unknown>);

type SheetArgs = {
  side: SheetSide;
  showCloseButton: boolean;
  modal: boolean;
  defaultOpen: boolean;
  triggerLabel: string;
  onOpenChange: (isOpen: boolean) => void;
};

/**
 * O painel Code imprime o `template` da story literalmente — com os bindings
 * ligados aos args. `transform` devolve o uso real, com os valores atuais dos
 * controls (armadilha 3 do CLAUDE.md deste stack).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SheetArgs> }): string {
  const {
    side = 'right',
    showCloseButton = true,
    modal = true,
    defaultOpen = false,
    triggerLabel = t('demonstration.labels.trigger'),
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet: documentação que repete valor
  // padrão ensina ruído.
  const root = ['<nds-sheet', defaultOpen ? '[defaultOpen]="true"' : '', modal ? '' : '[modal]="false"']
    .filter(Boolean)
    .join(' ');
  const content = [
    '<ng-template ndsSheetContent',
    side === 'right' ? '' : `side="${side}"`,
    showCloseButton ? '' : '[showCloseButton]="false"',
  ].filter(Boolean).join(' ');

  return `import { NDS_SHEET } from '@/components/ui/sheet';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_SHEET, NdsButton],
  template: \`
    ${root}>
      <button ndsSheetTrigger ndsButton variant="outline">${triggerLabel}</button>

      ${content}>
        <div ndsSheetHeader>
          <h2 ndsSheetTitle>${t('demonstration.labels.title')}</h2>
          <p ndsSheetDescription>${t('demonstration.labels.description')}</p>
        </div>

        <div ndsSheetFooter>
          <button ndsSheetClose ndsButton variant="outline">${t('demonstration.labels.cancel')}</button>
          <button ndsButton>${t('demonstration.labels.apply')}</button>
        </div>
      </ng-template>
    </nds-sheet>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<SheetArgs> = {
  title: 'Primitives/Overlay/Sheet',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_SHEET, NdsButton] })],
  parameters: {
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

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
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
      tituloPainel: t('demonstration.labels.title'),
      descricaoPainel: t('demonstration.labels.description'),
      rotuloCancelar: t('demonstration.labels.cancel'),
      rotuloAplicar: t('demonstration.labels.apply'),
    },
    template: `
      <nds-sheet
        [defaultOpen]="defaultOpen"
        [modal]="modal"
        (openChange)="onOpenChange($event)"
      >
        <button ndsSheetTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsSheetContent [side]="side" [showCloseButton]="showCloseButton">
          <div ndsSheetHeader>
            <h2 ndsSheetTitle>{{ tituloPainel }}</h2>
            <p ndsSheetDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsSheetFooter>
            <button ndsSheetClose ndsButton variant="outline">{{ rotuloCancelar }}</button>
            <button ndsButton>{{ rotuloAplicar }}</button>
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

    if (args.modal) {
      await step('Clique no overlay fecha o painel', async () => {
        await open(trigger);
        const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
        await expect(overlay).not.toBeNull();
        await userEvent.click(overlay!);
        await waitForPortalVanish('dialog');
      });
    }

    if (args.showCloseButton) {
      await step('O X do canto fecha o painel', async () => {
        const panel = await open(trigger);
        const closeBtn = within(panel).getByRole('button', { name: /fechar/i });
        await userEvent.click(closeBtn);
        await waitForPortalVanish('dialog');
      });
    }

    await step('Cancelar no rodapé também fecha', async () => {
      const panel = await open(trigger);
      const cancelar = within(panel).getByRole('button', {
        name: t('demonstration.labels.cancel'),
      });
      await userEvent.click(cancelar);
      await waitForPortalVanish('dialog');
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa
    // do mesmo ponto de partida desta.
    await close();
  },
};
