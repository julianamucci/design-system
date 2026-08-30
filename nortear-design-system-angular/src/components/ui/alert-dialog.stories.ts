import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsButton } from './button';
import { NdsAlertDialogDocs } from '@/components/docs/AlertDialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

type AlertDialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancel: string;
  action: string;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<AlertDialogArgs> }): string {
  const {
    triggerLabel = 'Excluir conta',
    title = 'Excluir conta',
    description = '',
    cancel = 'Cancelar',
    action = 'Excluir',
  } = ctx.args ?? {};

  return `import { NDS_ALERT_DIALOG } from '@/components/ui/alert-dialog';
import { NdsButton } from '@/components/ui/button';

@Component({
  imports: [NDS_ALERT_DIALOG, NdsButton],
  template: \`
    <nds-alert-dialog>
      <button ndsAlertDialogTrigger ndsButton variant="destructive">
        ${triggerLabel}
      </button>

      <ng-template ndsAlertDialogContent>
        <div ndsAlertDialogHeader>
          <h2 ndsAlertDialogTitle>${title}</h2>
          <p ndsAlertDialogDescription>${description}</p>
        </div>

        <div ndsAlertDialogFooter>
          <button ndsAlertDialogCancel ndsButton variant="outline">${cancel}</button>
          <button ndsAlertDialogAction ndsButton variant="destructive" (click)="excluir()">
            ${action}
          </button>
        </div>
      </ng-template>
    </nds-alert-dialog>
  \`,
})
export class Exemplo {
  excluir(): void {
    // A ação roda aqui; o fechamento é do primitivo.
  }
}`;
}

const meta: Meta<AlertDialogArgs> = {
  title: 'Primitives/Overlay/AlertDialog',
  tags: ['autodocs', 'overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsAlertDialogDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do gatilho.' },
    title: { control: 'text', description: 'Título — obrigatório, é o nome acessível.' },
    description: { control: 'text', description: 'Descrição — obrigatória, diz o que a ação custa.' },
    cancel: { control: 'text', description: 'Rótulo da saída segura.' },
    action: { control: 'text', description: 'Rótulo da confirmação.' },
    // Sem entrada em argTypes o renderer Angular não repassa a função ao
    // template — ver armadilha 5 no CLAUDE.md deste stack.
    onOpenChange: { control: false, table: { disable: true } },
    onConfirm: { control: false, table: { disable: true } },
  },
  args: {
    triggerLabel: 'Excluir conta',
    title: 'Excluir conta',
    description:
      'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancel: 'Cancelar',
    action: 'Excluir',
    onOpenChange: fn(),
    onConfirm: fn(),
  },
};

export default meta;
type Story = StoryObj<AlertDialogArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'functional.item5', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5', 'accessibility.item6',
      'accessibility.item7',
      'visual.item1', 'visual.item2',
    ],
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <nds-alert-dialog (openChange)="onOpenChange($event)">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">{{ triggerLabel }}</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>{{ title }}</h2>
            <p ndsAlertDialogDescription>{{ description }}</p>
          </div>

          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">{{ cancel }}</button>
            <button ndsAlertDialogAction ndsButton variant="destructive" (click)="onConfirm()">
              {{ action }}
            </button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole('button', { name: args.triggerLabel });

    await step('O gatilho abre, e o painel é um alertdialog — não um dialog', async () => {
      // `role="alertdialog"` não é enfeite: é ele que faz o leitor de tela ler a
      // descrição junto do título, em vez de esperar a pessoa navegar até ela.
      await userEvent.click(trigger());
      const panel = await waitForPortal('alertdialog');
      await expect(panel.getAttribute('aria-modal')).toBe('true');
    });

    await step('Título e descrição são o nome e a explicação do painel', async () => {
      const panel = await waitForPortal('alertdialog');
      const labelledBy = panel.getAttribute('aria-labelledby');
      const describedBy = panel.getAttribute('aria-describedby');
      await expect(document.getElementById(labelledBy!)?.textContent?.trim()).toBe(args.title);
      await expect(document.getElementById(describedBy!)?.textContent?.trim()).toBe(
        args.description,
      );
    });

    await step('O foco pousa na saída segura, não na destruição', async () => {
      // Enter apertado por reflexo tem que cancelar, não excluir.
      await waitFor(() =>
        expect((document.activeElement as HTMLElement)?.textContent?.trim()).toBe(args.cancel),
      );
    });

    await step('O Tab não sai do painel', async () => {
      const panel = await waitForPortal('alertdialog');
      for (let i = 0; i < 4; i++) {
        await userEvent.tab();
        await expect(panel.contains(document.activeElement)).toBe(true);
      }
    });

    await step('Clique fora NÃO fecha: a escolha precisa ser explícita', async () => {
      // É a diferença que justifica o componente existir. Um diálogo comum se
      // dispensa por engano sem consequência; aqui a dispensa esconde a
      // pergunta e deixa a pessoa sem saber se a ação aconteceu.
      const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]')!;
      await userEvent.click(overlay);
      await expect(document.querySelector('[data-slot="alert-dialog-content"]')).not.toBeNull();
    });

    await step('Escape fecha, equivale a cancelar, e devolve o foco', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('alertdialog');
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
      await expect(args.onConfirm).not.toHaveBeenCalled();
    });

    await step('Cancelar fecha sem executar a ação', async () => {
      await userEvent.click(trigger());
      await waitForPortal('alertdialog');
      await userEvent.click(within(document.body).getByRole('button', { name: args.cancel }));
      await waitForPortalVanish('alertdialog');
      await expect(args.onConfirm).not.toHaveBeenCalled();
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });

    await step('Confirmar executa a ação, fecha, e devolve o foco', async () => {
      await userEvent.click(trigger());
      await waitForPortal('alertdialog');
      await userEvent.click(within(document.body).getByRole('button', { name: args.action }));
      await waitForPortalVanish('alertdialog');
      await expect(args.onConfirm).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });
  },
};
