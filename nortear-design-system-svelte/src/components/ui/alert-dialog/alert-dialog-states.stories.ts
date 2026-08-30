import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';
import AlertDialogControlledStory from './AlertDialogControlledStory.svelte';
import {
  alertDialogOpenSource,
  alertDialogCanceladoSource,
  alertDialogConfirmadoSource,
  alertDialogControlledSource,
  alertDialogSource,
} from './alert-dialog.source';

const meta: Meta = {
  title: 'Primitives/Overlay/AlertDialog/States',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      // Cascateia para todas as stories do arquivo; cada estado que muda a
      // marcação sobrescreve com a própria composição logo abaixo.
      source: { transform: alertDialogSource },
      description: {
        component:
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Enquanto o diálogo está aberto o bits-ui neutraliza o resto da página com
// `pointer-events: none`, e só devolve a interação depois da saída. Reabrir o
// diálogo no passo seguinte exige esperar essa liberação, senão o clique falha
// com "element has pointer-events: none".
async function waitForInteractive(el: HTMLElement) {
  await waitFor(() => {
    if (getComputedStyle(el).pointerEvents === 'none') {
      throw new Error('trigger ainda inerte (pointer-events: none)');
    }
  });
}

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: false,
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação não pode ser desfeita.',
      actionLabel: 'Excluir',
    },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Excluir item/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    // A story termina com o diálogo aberto: é sobre ela que o addon-a11y roda
    // a varredura axe (contraste incluído) do estado aberto.
    covers: ['functional.item6', 'accessibility.item6', 'accessibility.item7'],
    docs: {
      source: { transform: alertDialogOpenSource },
      description: {
        story: 'Diálogo aberto com `open`. Captura visual no Chromatic.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerLabel: 'Excluir item',
      title: 'Excluir item permanentemente?',
      description: 'O item será removido de forma definitiva e não poderá ser recuperado.',
      actionLabel: 'Excluir',
    },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Diálogo renderiza aberto com o conteúdo acessível', async () => {
      const dialog = await body.findByRole('alertdialog');
      // O painel entra animando (opacity 0 → 1): a asserção espera a animação
      // concluir, senão roda no primeiro quadro e reprova por opacity: 0.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveAccessibleName(/Excluir item permanentemente/i);
    });

    // O overlay do alertdialog é inerte por decisão de acessibilidade (WAI-ARIA
    // APG: a decisão precisa ser explícita), então clicar fora NÃO cancela.
    await step('Clique no overlay não fecha o diálogo', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]');
      await expect(overlay).toBeInTheDocument();
      await userEvent.click(overlay!);
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
    });
  },
};

// Spy no escopo do módulo: o `play` precisa asseverar o callback do consumidor,
// e o objeto de props montado em `render` não é visível dentro do `play`.
const onConfirmSpy = fn();

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: alertDialogConfirmadoSource },
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: false,
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      onConfirm: onConfirmSpy,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onConfirmSpy.mockClear();

    await step('Trigger abre o diálogo', async () => {
      // Só clica se ainda não houver diálogo: no replay do painel a rodada
      // anterior pode ter deixado um aberto, e o clique cego o fecharia.
      if (!document.querySelector('[role="alertdialog"]')) {
        await userEvent.click(canvas.getByRole('button', { name: /Excluir item/i }));
      }
      const dialog = await body.findByRole('alertdialog');
      // Entrada animada: espera a opacidade chegar em 1 antes de afirmar visível.
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Clique em Excluir dispara o handler do consumidor', async () => {
      const action = await body.findByRole('button', { name: /^Excluir$/i });
      await userEvent.click(action);
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(1));
    });

    await step('Confirmar fecha o diálogo e devolve o foco ao trigger', async () => {
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      const trigger = canvas.getByRole('button', { name: /Excluir item/i });
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('Enter com a ação focada também confirma', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir item/i });
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O foco inicial pousa no Cancelar — a saída segura, como o conteúdo
      // compartilhado promete. A asserção anterior esperava o PAINEL focado e
      // dava dois Tabs: era o defeito do FocusScope virando contrato (ver
      // alert-dialog-content.svelte). Um Tab basta a partir do Cancelar.
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.tab();
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await expect(action).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });
  },
};

const onCancelSpy = fn();
const onCancelledConfirmSpy = fn();

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      source: { transform: alertDialogCanceladoSource },
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      onCancel: onCancelSpy,
      onConfirm: onCancelledConfirmSpy,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onCancelSpy.mockClear();
    onCancelledConfirmSpy.mockClear();

    await step('Clique em Cancelar fecha o diálogo sem executar a ação', async () => {
      const cancel = await body.findByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await expect(onCancelledConfirmSpy).not.toHaveBeenCalled();
    });

    await step('Espaço com Cancelar focado também cancela', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir item/i });
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O foco inicial JÁ pousa no Cancelar — não é preciso Tab nenhum. A
      // asserção anterior esperava o painel focado e dava um Tab: era o defeito
      // do FocusScope virando contrato (ver alert-dialog-content.svelte).
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.keyboard(' ');
      await waitFor(() => expect(onCancelSpy).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onCancelledConfirmSpy).not.toHaveBeenCalled();
      // functional.item3: cancelar devolve o foco ao trigger que abriu.
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

const onOpenChangeSpy = fn();

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: { transform: alertDialogControlledSource },
      description: {
        story: 'Abertura controlada por estado externo via `bind:open`.',
      },
    },
  },
  // Gatilho FORA do diálogo, como no React e no Vue. Antes a story abria pelo
  // trigger do próprio componente, e assim não provava nada: abrir por dentro é
  // indistinguível de um diálogo não controlado.
  render: () => ({
    Component: AlertDialogControlledStory,
    props: { onOpenChange: onOpenChangeSpy },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onOpenChangeSpy.mockClear();

    await step('Clique no trigger externo abre o diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // Entrada animada: espera a opacidade chegar em 1 antes de afirmar visível.
      await waitFor(() => expect(dialog).toBeVisible());
      // Sem asserção de callback aqui, e isso é o contrato: o botão externo
      // escreve o estado direto, então o pai já sabe — foi ele que mandou.
      // `onOpenChange` é o componente PEDINDO a mudança, e só dispara na saída.
    });

    await step('Escape fecha o diálogo controlado e propaga o novo estado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onOpenChangeSpy).toHaveBeenCalledWith(false);
    });
  },
};
