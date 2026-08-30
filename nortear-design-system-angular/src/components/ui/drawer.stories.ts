import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor, fn } from 'storybook/test';
import { NDS_DRAWER, type DrawerDirection } from './drawer';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish } from '@/lib/wait-for-portal';
import { useTranslation } from '@/lib/i18n';
import drawerTranslations from '@shared/content/drawer/translations.json';
import { NdsDrawerDocs } from '@/components/docs/DrawerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const { t } = useTranslation(drawerTranslations as Record<string, unknown>);

// O conteúdo compartilhado do Drawer não tem um bloco de rótulos de demonstração
// (o do Sheet tem). Os textos do painel saem da tabela de UX writing, que é
// justamente onde o conteúdo diz como cada elemento deve ser escrito — o
// exemplo "bom" de cada linha É o rótulo canônico, nos três idiomas.
const LABEL = {
  trigger: () => t('usage.uxWriting.table.trigger.good'),
  title: () => t('usage.uxWriting.table.title.good'),
  descricao: () => t('usage.uxWriting.table.description.good'),
  close: () => t('usage.uxWriting.table.close.good'),
};

type DrawerArgs = {
  direction: DrawerDirection;
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
function playgroundSource(_gerado: string, ctx: { args?: Partial<DrawerArgs> }): string {
  const {
    direction = 'bottom',
    modal = true,
    defaultOpen = false,
    triggerLabel = LABEL.trigger(),
  } = ctx.args ?? {};

  // Só o que difere do default entra no snippet: documentação que repete valor
  // padrão ensina ruído.
  const root = [
    '<nds-drawer',
    direction === 'bottom' ? '' : `direction="${direction}"`,
    defaultOpen ? '[defaultOpen]="true"' : '',
    modal ? '' : '[modal]="false"',
  ].filter(Boolean).join(' ');

  // Crase escapada: este texto vive dentro de um template literal, e uma crase
  // crua fecharia a string no meio do snippet.
  return `import { NDS_DRAWER } from '@/components/ui/drawer';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [...NDS_DRAWER, NdsButton],
  template: \`
    ${root}>
      <button ndsDrawerTrigger ndsButton variant="outline">${triggerLabel}</button>

      <ng-template ndsDrawerContent>
        <div ndsDrawerHeader>
          <h2 ndsDrawerTitle>${LABEL.title()}</h2>
          <p ndsDrawerDescription>${LABEL.descricao()}</p>
        </div>

        <div ndsDrawerFooter>
          <button ndsDrawerClose ndsButton variant="outline">${LABEL.close()}</button>
        </div>
      </ng-template>
    </nds-drawer>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<DrawerArgs> = {
  title: 'Primitives/Disclosure/Drawer',
  tags: ['autodocs', 'disclosure'],
  decorators: [moduleMetadata({ imports: [...NDS_DRAWER, NdsButton] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsDrawerDocs) },
  },
  argTypes: {
    direction: {
      control: 'select',
      options: ['bottom', 'top', 'left', 'right'],
      description:
        'Borda por onde o painel entra. É dela que saem posição, borda e cantos arredondados.',
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
      description: 'Texto do gatilho. Verbo + objeto — nomeie a ação, nunca "Clique".',
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
    direction: 'bottom',
    modal: true,
    defaultOpen: false,
    triggerLabel: LABEL.trigger(),
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<DrawerArgs>;

/**
 * Abre só se estiver fechado.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM: um clique cego partiria
 * do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function open(trigger: HTMLElement): Promise<HTMLElement> {
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
    // Os textos do painel entram como props, não como args: são conteúdo
    // compartilhado (trilíngue), não parâmetro do componente — em `args`
    // virariam controls falsos na aba API Reference.
    props: {
      ...args,
      tituloPainel: LABEL.title(),
      descricaoPainel: LABEL.descricao(),
      rotuloFechar: LABEL.close(),
    },
    template: `
      <nds-drawer
        [direction]="direction"
        [defaultOpen]="defaultOpen"
        [modal]="modal"
        (openChange)="onOpenChange($event)"
      >
        <button ndsDrawerTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDrawerContent>
          <div ndsDrawerHeader>
            <h2 ndsDrawerTitle>{{ tituloPainel }}</h2>
            <p ndsDrawerDescription>{{ descricaoPainel }}</p>
          </div>

          <div ndsDrawerFooter>
            <button ndsDrawerClose ndsButton variant="outline">{{ rotuloFechar }}</button>
          </div>
        </ng-template>
      </nds-drawer>
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
      // do ndsDrawerTitle — painel modal anônimo é o defeito silencioso aqui.
      await expect(panel).toHaveAccessibleName(LABEL.title());
      await expect(panel).toHaveAccessibleDescription(LABEL.descricao());
      await expect(panel).toHaveAttribute('aria-modal', 'true');
      await expect(panel).toHaveAttribute('data-slot', 'drawer-content');
      await expect(panel).toHaveAttribute('data-state', 'open');
      // O atributo que o CSS compartilhado lê para posicionar o painel. Sob JIT
      // o input `direction` seria ignorado e viria sempre o default (armadilha 1).
      await expect(panel).toHaveAttribute('data-vaul-drawer-direction', args.direction);
      await expect(panel).toHaveClass(/nds-drawer-content/);
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

    await step('A alça é decorativa, não um caminho de interação', async () => {
      const panel = await waitForPortal('dialog');
      const thumb = panel.querySelector<HTMLElement>('.nds-drawer-handle');
      await expect(thumb).not.toBeNull();
      // Sem gesto atrás dela, anunciar a alça só somaria ruído ao leitor de
      // tela — e é o que garante que nenhuma ação dependa de arrastar (WCAG 2.5.7).
      await expect(thumb).toHaveAttribute('aria-hidden', 'true');
      await expect(thumb!.hasAttribute('tabindex')).toBe(false);
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
      // Volta suficiente para dar a volta completa em qualquer direção.
      for (let i = 0; i < 6; i++) await userEvent.tab();
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
        const overlay = document.querySelector<HTMLElement>('[data-slot="drawer-overlay"]');
        await expect(overlay).not.toBeNull();
        await userEvent.click(overlay!);
        await waitForPortalVanish('dialog');
      });
    }

    await step('O botão de fechar do rodapé fecha e devolve o foco ao gatilho', async () => {
      const panel = await open(trigger);
      // Procura pelo NOME, não pelo `data-slot`: o botão é também um ndsButton,
      // e duas diretivas ligando o mesmo atributo não têm vencedor definido
      // (armadilha 11) — por isso o NdsDrawerClose não liga `data-slot`.
      const closeBtn = within(panel).getByRole('button', { name: LABEL.close() });
      await userEvent.click(closeBtn);
      await waitForPortalVanish('dialog');
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error('o foco não voltou ao gatilho');
        }
      });
    });

    // Termina fechado: a próxima rodada da play (painel Interactions) precisa
    // do mesmo ponto de partida desta.
    await close();
  },
};
