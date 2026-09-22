import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';
import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { AlertDialog, type AlertDialogCloseReason } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';
import AlertDialogControlledStory from './AlertDialogControlledStory.svelte';
import {
  alertDialogCancelledSource,
  alertDialogConfirmedSource,
  alertDialogControlledSource,
  alertDialogSource,
} from './alert-dialog.source';

const meta: Meta = {
  title: 'Components/Overlay/AlertDialog/States',
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

// Todo estado usa o MESMO exemplo: o conjunto destrutivo de
// `demonstration.labels`, o da seção Demonstração da docs page. Um exemplo por
// estado ("Excluir item", título em pergunta, "Fechar" no lugar de Cancelar)
// fazia o leitor comparar textos em vez de comparar comportamento.
//
// Lido do bloco pt-BR DIRETO, e não por `useTranslation`: a story é fixture, e
// as plays comparam com o texto que ela renderiza. Pelo idioma corrente, trocar
// o idioma da página faria a story renderizar um texto e a play procurar outro.
const LABELS = alertDialogTranslations['pt-BR'].demonstration.labels;
const DESTRUCTIVE = {
  triggerLabel: LABELS.triggerLabel,
  title: LABELS.title,
  description: LABELS.description,
  cancelLabel: LABELS.cancel,
  actionLabel: LABELS.action,
};
const TRIGGER_NAME = new RegExp(`^${LABELS.triggerLabel}$`, 'i');
const TITLE_NAME = new RegExp(`^${LABELS.title}$`, 'i');
const CANCEL_NAME = new RegExp(`^${LABELS.cancel}$`, 'i');
const ACTION_NAME = new RegExp(`^${LABELS.action}$`, 'i');

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
    props: { open: false, ...DESTRUCTIVE },
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: TRIGGER_NAME });
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
      // Sem transform própria: o painel Code publica a forma canônica, com o
      // diálogo comandado pelo gatilho. O `open: true` do render é andaime da
      // captura, não o que quem copia escreve.
      description: {
        story: 'Diálogo aberto com `open`. Captura visual no Chromatic.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, ...DESTRUCTIVE },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Diálogo renderiza aberto com o conteúdo acessível', async () => {
      const dialog = await body.findByRole('alertdialog');
      // O painel entra animando (opacity 0 → 1): a asserção espera a animação
      // concluir, senão roda no primeiro quadro e reprova por opacity: 0.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveAccessibleName(TITLE_NAME);
    });

    // A abertura SEM clique é o caminho que o `focusSafeExit` do Content
    // corrige: deixado à lib, o foco caía no painel porque o rodapé ainda não
    // existia quando ela procurou o primeiro focável. Nenhum gatilho foi
    // clicado aqui, então o que se mede é só a escolha explícita (D3).
    await step('Foco inicial no Cancelar, sem clique no gatilho', async () => {
      const dialog = await body.findByRole('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: CANCEL_NAME });
      await waitFor(() => expect(cancel).toHaveFocus());
      await expect(within(dialog).getByRole('button', { name: ACTION_NAME })).not.toHaveFocus();
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
      source: { transform: alertDialogConfirmedSource },
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  // Nasce aberto, como as outras stacks: é o painel que a captura e a primeira
  // confirmação precisam na tela.
  render: () => ({
    Component: AlertDialogStory,
    props: { open: true, ...DESTRUCTIVE, onConfirm: onConfirmSpy },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onConfirmSpy.mockClear();

    await step('O diálogo está aberto', async () => {
      // No replay do painel a rodada anterior fechou o diálogo, e aí o gatilho
      // o reabre. Com o diálogo na tela o gatilho está inerte: não se clica.
      if (!document.querySelector('[role="alertdialog"]')) {
        await userEvent.click(canvas.getByRole('button', { name: TRIGGER_NAME }));
      }
      const dialog = await body.findByRole('alertdialog');
      // Entrada animada: espera a opacidade chegar em 1 antes de afirmar visível.
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Clique em Excluir dispara o handler do consumidor e fecha', async () => {
      const dialog = await body.findByRole('alertdialog');
      await userEvent.click(within(dialog).getByRole('button', { name: ACTION_NAME }));
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Enter com a ação focada confirma e devolve o foco ao gatilho', async () => {
      // O painel que nasceu aberto não tinha gatilho para onde voltar; este é
      // aberto PELO gatilho, e é nele que o retorno de foco se mede.
      const trigger = canvas.getByRole('button', { name: TRIGGER_NAME });
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O foco inicial pousa no Cancelar — a saída segura (D3, ver
      // alert-dialog-content.svelte). Um Tab basta a partir dele.
      const cancel = within(dialog).getByRole('button', { name: CANCEL_NAME });
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.tab();
      const action = within(dialog).getByRole('button', { name: ACTION_NAME });
      await expect(action).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

const onCancelSpy = fn();
const onCancelledConfirmSpy = fn();

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      source: { transform: alertDialogCancelledSource },
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      ...DESTRUCTIVE,
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
      const cancel = await body.findByRole('button', { name: CANCEL_NAME });
      await userEvent.click(cancel);
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await expect(onCancelledConfirmSpy).not.toHaveBeenCalled();
    });

    await step('Espaço com Cancelar focado também cancela', async () => {
      const trigger = canvas.getByRole('button', { name: TRIGGER_NAME });
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O foco inicial JÁ pousa no Cancelar — não é preciso Tab nenhum (D3, ver
      // alert-dialog-content.svelte).
      const cancel = within(dialog).getByRole('button', { name: CANCEL_NAME });
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
// Por onde cada fechamento saiu, na ordem. É a palavra que a docs page põe no
// `reason` do `dialog_close`: a lib avisa QUE o diálogo fechou e nunca POR QUÊ,
// e quem traduz o gesto é o `close-reason.ts` do primitivo.
const controlledCloseReasons: AlertDialogCloseReason[] = [];

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
  // Gatilho FORA do diálogo. Antes a story abria pelo trigger do próprio
  // componente, e assim não provava nada: abrir por dentro é indistinguível de
  // um diálogo não controlado.
  render: () => ({
    Component: AlertDialogControlledStory,
    props: {
      ...DESTRUCTIVE,
      onOpenChange: onOpenChangeSpy,
      onClose: (reason: AlertDialogCloseReason) => controlledCloseReasons.push(reason),
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onOpenChangeSpy.mockClear();
    // A play REEXECUTA no mesmo DOM, e o que a rodada anterior empilhou não é
    // desta medição.
    controlledCloseReasons.length = 0;
    const trigger = canvas.getByRole('button', { name: TRIGGER_NAME });
    // Quantas vezes o componente pediu para FECHAR — é o que o pai precisa
    // saber, por qualquer uma das saídas.
    const closeRequests = () => onOpenChangeSpy.mock.calls.filter(([value]) => value === false).length;

    await step('Clique no trigger externo abre o diálogo', async () => {
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
      await expect(closeRequests()).toBe(1);
      // É este motivo que vira `dialog_close { reason: 'escape' }` na docs page.
      // O Escape é o único caminho de saída que o bits-ui anuncia por evento
      // próprio; os outros dois precisam da marca de quem consome.
      await expect(controlledCloseReasons.at(-1)).toBe('escape');
      // C4: o foco volta a quem abriu — aqui, o botão externo.
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('O Cancelar se chama close-button, e não "o que sobrou"', async () => {
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
      await userEvent.click(within(dialog).getByRole('button', { name: CANCEL_NAME }));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(closeRequests()).toBe(2);
      await expect(controlledCloseReasons.at(-1)).toBe('close-button');
    });

    // A ação fecha pelo caminho da lib, e é isso que avisa o pai. Se ela
    // escrevesse `open = false` antes, a lib acharia o diálogo já fechado e
    // sairia sem chamar o callback — a confirmação sumia para quem controla.
    await step('A confirmação também propaga o fechamento ao pai', async () => {
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
      await userEvent.click(within(dialog).getByRole('button', { name: ACTION_NAME }));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(closeRequests()).toBe(3);
      await expect(onOpenChangeSpy).toHaveBeenLastCalledWith(false);
      // A marca da confirmação chega ANTES do fechamento, e por isso o motivo
      // sai `api`. Sem ela sobraria `close-button`, e confirmar a exclusão
      // chegaria ao relatório como "apertou o Cancelar".
      await expect(controlledCloseReasons.at(-1)).toBe('api');
    });

    await step('Os três caminhos relataram motivos DIFERENTES', async () => {
      await expect(controlledCloseReasons).toEqual(['escape', 'close-button', 'api']);
    });
  },
};
