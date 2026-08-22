import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsButton } from './button';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// Os estados canônicos do AlertDialog: fechado, aberto, confirmado e cancelado.
//
// Existiam nas outras quatro stacks e não aqui — e não é detalhe de árvore de
// stories: são as quatro capturas que o Chromatic usa para provar que o painel
// não mudou de forma, mais os dois caminhos de saída (confirmar e cancelar) com
// o retorno de foco ao gatilho, que só o Playground exercitava.
//
// Sem argTypes: o painel Controls fica desligado, senão apareceria vazio.

const meta: Meta = {
  title: 'UI/AlertDialog/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton] })],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
  },
};

export default meta;
type Story = StoryObj;

/** Espiões de módulo: a play precisa inspecionar o mesmo mock que o render usa. */
const aoConfirmar = fn();
const aoCancelar = fn();
const actionDestructive = fn();

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Estado inicial — só o gatilho está na tela; nada do painel foi montado.',
      },
    },
  },
  render: () => ({
    template: `
      <nds-alert-dialog>
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir item</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Confirmar exclusão</h2>
            <p ndsAlertDialogDescription>Esta ação não pode ser desfeita.</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Excluir</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Apenas o gatilho está visível', async () => {
      await expect(canvas.getByRole('button', { name: /Excluir item/i })).toBeVisible();
    });

    await step('Nada do painel foi renderizado', async () => {
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    // A story termina ABERTA de propósito: é sobre ela que o axe roda a
    // varredura do estado aberto, contraste incluído.
    covers: ['accessibility.item6', 'accessibility.item7'],
    docs: {
      description: {
        story: 'Painel aberto por `defaultOpen` — é a captura visual do estado aberto.',
      },
    },
  },
  render: () => ({
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir item</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Excluir item permanentemente?</h2>
            <p ndsAlertDialogDescription>
              O item será removido de forma definitiva e não poderá ser recuperado.
            </p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button ndsAlertDialogAction ndsButton variant="destructive">Excluir</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ step }) => {
    await step('Nasce aberto, com backdrop', async () => {
      const painel = await waitForPortal('alertdialog');
      await expect(painel).toBeVisible();
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
    });

    await step('Nome e descrição acessíveis saem do título e da descrição', async () => {
      const painel = await waitForPortal('alertdialog');
      await expect(painel).toHaveAccessibleName(/Excluir item/i);
      await expect(painel).toHaveAccessibleDescription(/removido de forma definitiva/i);
    });
  },
};

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      description: {
        story:
          'Confirmar dispara o callback de quem consome, fecha o painel e devolve o foco ao gatilho.',
      },
    },
  },
  beforeEach: () => {
    aoConfirmar.mockClear();
  },
  render: () => ({
    props: { aoConfirmar },
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Confirmar exclusão</h2>
            <p ndsAlertDialogDescription>Esta ação é permanente e não poderá ser desfeita.</p>
          </div>
          <div ndsAlertDialogFooter>
            <button ndsAlertDialogCancel ndsButton variant="outline">Cancelar</button>
            <button
              ndsAlertDialogAction
              ndsButton
              variant="destructive"
              data-testid="confirmar"
              (click)="aoConfirmar()"
            >Excluir</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Cada passo estabelece a própria precondição: o replay do painel
    // Interactions reexecuta no mesmo DOM, e lá o `defaultOpen` já passou.
    const ensureOpen = async () => {
      if (!document.querySelector('[role="alertdialog"]')) {
        await userEvent.click(canvas.getByRole('button', { name: /^Excluir$/i }));
      }
      return waitForPortal('alertdialog');
    };

    await step('Confirmar dispara o callback de quem consome', async () => {
      await ensureOpen();
      await userEvent.click(within(document.body).getByTestId('confirmar'));
      await expect(aoConfirmar).toHaveBeenCalled();
    });

    await step('Confirmar também fecha o painel', async () => {
      await waitForPortalVanish('alertdialog');
    });

    await step('Enter com a ação focada confirma, e o foco volta ao gatilho', async () => {
      const gatilho = canvas.getByRole('button', { name: /^Excluir$/i });
      const antes = aoConfirmar.mock.calls.length;
      await userEvent.click(gatilho);
      await waitForPortal('alertdialog');
      const acao = within(document.body).getByTestId('confirmar');
      acao.focus();
      await expect(acao).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(aoConfirmar.mock.calls.length).toBeGreaterThan(antes);
      await waitForPortalVanish('alertdialog');
      // Fecha o ciclo: sem o retorno de foco o teclado volta ao topo do
      // documento e a pessoa perde o lugar. O waitFor não é decoração: nesta
      // stack o foco só volta quando o portal destrói as diretivas, o que cai
      // num ciclo de detecção posterior — o Playground já esperava assim.
      await waitFor(() => expect(gatilho).toHaveFocus());
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Cancelar fecha sem executar a ação destrutiva e devolve o foco ao gatilho. Space com o Cancel focado faz o mesmo.',
      },
    },
  },
  beforeEach: () => {
    aoCancelar.mockClear();
    actionDestructive.mockClear();
  },
  render: () => ({
    props: { aoCancelar, actionDestructive },
    template: `
      <nds-alert-dialog [defaultOpen]="true">
        <button ndsAlertDialogTrigger ndsButton variant="destructive">Excluir</button>

        <ng-template ndsAlertDialogContent>
          <div ndsAlertDialogHeader>
            <h2 ndsAlertDialogTitle>Confirmar exclusão</h2>
            <p ndsAlertDialogDescription>Esta ação é permanente e não poderá ser desfeita.</p>
          </div>
          <div ndsAlertDialogFooter>
            <button
              ndsAlertDialogCancel
              ndsButton
              variant="outline"
              data-testid="cancelar"
              (click)="aoCancelar()"
            >Cancelar</button>
            <button
              ndsAlertDialogAction
              ndsButton
              variant="destructive"
              (click)="actionDestructive()"
            >Excluir</button>
          </div>
        </ng-template>
      </nds-alert-dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const ensureOpen = async () => {
      if (!document.querySelector('[role="alertdialog"]')) {
        await userEvent.click(canvas.getByRole('button', { name: /^Excluir$/i }));
      }
      return waitForPortal('alertdialog');
    };

    await step('Cancelar fecha e NÃO executa a ação destrutiva', async () => {
      await ensureOpen();
      await userEvent.click(within(document.body).getByTestId('cancelar'));
      await expect(aoCancelar).toHaveBeenCalled();
      await waitForPortalVanish('alertdialog');
      // O ponto do cancelamento: é isto que não pode acontecer.
      await expect(actionDestructive).not.toHaveBeenCalled();
    });

    await step('Space com o Cancel focado cancela, e o foco volta ao gatilho', async () => {
      const gatilho = canvas.getByRole('button', { name: /^Excluir$/i });
      const antes = aoCancelar.mock.calls.length;
      await userEvent.click(gatilho);
      await waitForPortal('alertdialog');
      const cancelar = within(document.body).getByTestId('cancelar');
      cancelar.focus();
      await expect(cancelar).toHaveFocus();
      await userEvent.keyboard(' ');
      await expect(aoCancelar.mock.calls.length).toBeGreaterThan(antes);
      await waitForPortalVanish('alertdialog');
      await expect(actionDestructive).not.toHaveBeenCalled();
      // Ver a nota do Confirmed: o retorno de foco vem com a destruição do
      // portal, um ciclo de detecção depois do desmonte.
      await waitFor(() => expect(gatilho).toHaveFocus());
    });
  },
};
