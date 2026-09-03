import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within, fn } from 'storybook/test';
import { NDS_DIALOG } from './dialog';
import { NdsButton } from './button';
import {
  LABELS,
  open as abrirDialogo,
  close as fecharDialogo,
  panel,
  overlay,
  waitForClosed,
  checkNameAndDescription,
} from './dialog.fixtures';
import { dialogPlaygroundSource, type DialogArgs } from './dialog.source';
import { NdsDialogDocs } from '@/components/docs/DialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<DialogArgs> = {
  title: 'Primitives/Overlay/Dialog',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_DIALOG, NdsButton] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsDialogDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado. Útil para captura visual.',
    },
    modal: {
      control: 'boolean',
      description:
        'Trava a rolagem da página e torna o resto do documento inerte enquanto aberto.',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Botão X no canto superior direito do painel.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto do gatilho. Deve nomear a ação e o objeto, nunca "Abrir".',
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
    defaultOpen: false,
    modal: true,
    showCloseButton: true,
    triggerLabel: LABELS.trigger,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<DialogArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: dialogPlaygroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3',
      'functional.item4', 'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args, labels: LABELS },
    template: `
      <div
        ndsDialog
        [defaultOpen]="defaultOpen"
        [modal]="modal"
        (openChange)="onOpenChange($event)"
      >
        <button ndsDialogTrigger ndsButton variant="outline">{{ triggerLabel }}</button>

        <ng-template ndsDialogPortal>
          <div ndsDialogOverlay></div>

          <div ndsDialogContent [showCloseButton]="showCloseButton" [closeLabel]="labels.close">
            <div ndsDialogHeader>
              <h2 ndsDialogTitle>{{ labels.title }}</h2>
              <p ndsDialogDescription>{{ labels.description }}</p>
            </div>

            <div ndsDialogFooter>
              <button ndsDialogClose ndsButton variant="outline">{{ labels.cancel }}</button>
              <button ndsButton>{{ labels.action }}</button>
            </div>
          </div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    // O gatilho é buscado por `data-slot`, não por papel: enquanto o diálogo
    // está aberto o resto da página fica inerte, e uma consulta por papel
    // depende de como a biblioteca de teste trata `inert`.
    const trigger = canvasElement.querySelector<HTMLElement>('[data-slot="dialog-trigger"]')!;
    const spy = args.onOpenChange as unknown as ReturnType<typeof fn>;

    // Abrir só se estiver fechado: o painel Interactions REEXECUTA a play no
    // mesmo DOM, e um clique absoluto partiria do estado que a rodada anterior
    // deixou, invertendo o resultado.
    const open = () => abrirDialogo(canvasElement);

    await step('O markup é o mesmo das outras stacks', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="dialog"]')!;
      // A raiz é um `<div>` sem visual próprio, como no Vanilla — não um
      // elemento `<nds-dialog>`, que não casaria com nenhuma regra do CSS.
      await expect(root.tagName).toBe('DIV');
      await expect(trigger.tagName).toBe('BUTTON');
      // `type="button"`: dentro de um `<form>`, o `submit` herdado faria abrir o
      // diálogo enviar o formulário.
      await expect(trigger).toHaveAttribute('type', 'button');
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    await step('Fechado, nada do conteúdo existe no DOM', async () => {
      // `fechar()` e não uma leitura do estado de montagem: a story termina
      // ABERTA (ver o último passo), então na segunda rodada do painel
      // Interactions o painel já estaria montado. O passo estabelece a própria
      // precondição; quem verifica o estado fechado NA MONTAGEM é a story
      // `Closed`, que não interage com nada.
      await fecharDialogo();
      await expect(panel()).toBeNull();
      await expect(overlay()).toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no gatilho abre o diálogo com overlay', async () => {
      const p = await open();
      await expect(p).toBeVisible();
      await expect(overlay()).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // `data-state` é o contrato de markup do Vanilla, que este componente
      // emite de propósito — o primitivo só entrega data-open/data-closed.
      await expect(p).toHaveAttribute('data-state', 'open');
      await expect(overlay()).toHaveAttribute('data-state', 'open');
    });

    await step('O painel se anuncia como diálogo modal, com nome e descrição', async () => {
      const p = panel()!;
      await expect(p).toHaveAttribute('role', 'dialog');
      if (args.modal) await expect(p).toHaveAttribute('aria-modal', 'true');
      await checkNameAndDescription(p);
      await expect(p).toHaveAccessibleName(LABELS.title);
      await expect(p).toHaveAccessibleDescription(LABELS.description);
    });

    await step('O foco entra no painel ao abrir', async () => {
      const p = panel()!;
      await waitFor(async () => {
        await expect(p.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Tab não sai do painel', async () => {
      const p = panel()!;
      const focaveis = p.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])',
      );
      // Do último focável, Tab volta para dentro em vez de escapar para a
      // página — é a armadilha de teclado que a WCAG 2.1.2 proíbe.
      focaveis[focaveis.length - 1].focus();
      await userEvent.tab();
      await expect(p.contains(document.activeElement)).toBe(true);
      await userEvent.tab({ shift: true });
      await expect(p.contains(document.activeElement)).toBe(true);
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      const callsBefore = spy.mock.calls.length;
      await userEvent.keyboard('{Escape}');
      await waitForClosed();
      await expect(spy.mock.calls.length).toBe(callsBefore + 1);
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('Clique no overlay fecha', async () => {
      await open();
      await userEvent.click(overlay()!);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    if (args.showCloseButton) {
      await step('O botão X fecha, tem nome acessível e devolve o foco', async () => {
        const p = await open();
        const x = p.querySelector<HTMLElement>('[data-slot="dialog-close"]')!;
        await expect(x).toHaveAccessibleName(LABELS.close);
        await userEvent.click(x);
        await waitForClosed();
        // A devolução do foco faz parte do item de contrato do botão X, não só
        // do Escape: sem ela quem navega por teclado volta para o começo da
        // página depois de fechar.
        await waitFor(async () => {
          await expect(document.activeElement).toBe(trigger);
        });
      });
    }

    await step('O Cancelar do rodapé fecha sem tocar na ação primária', async () => {
      const p = await open();
      // Pelo nome acessível, e não por `data-slot`: o Cancelar é um `ndsButton`
      // e o slot dele é `button` — ver a nota em NdsDialogClose sobre a disputa
      // de host binding no mesmo atributo.
      const cancelar = within(p).getByRole('button', { name: LABELS.cancel });
      await userEvent.click(cancelar);
      await waitForClosed();
      await waitFor(async () => {
        await expect(document.activeElement).toBe(trigger);
      });
    });

    await step('A story termina aberta', async () => {
      // O Chromatic fotografa o ESTADO FINAL e o axe do test-runner roda depois
      // da play: terminar fechada faria a captura mostrar só o gatilho e a
      // varredura de acessibilidade medir uma página sem diálogo nenhum — o
      // conteúdo compartilhado declara os dois sobre o estado ABERTO
      // (`visual.item1`, `accessibility.item6`).
      const p = await open();
      await expect(p).toBeVisible();
      await expect(p).toHaveAttribute('data-state', 'open');
    });
  },
};
