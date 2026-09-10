import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NDS_ALERT_DIALOG } from './alert-dialog';
import { NdsButton } from './button';
import { destructiveLabels } from './alert-dialog.fixtures';
import { alertDialogControlledSource, alertDialogDestructiveSource } from './alert-dialog.source';
import { waitForPortal, waitForPortalVanish, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

import { figmaDesign } from '@shared/figma/design-links';
// Os estados canônicos do AlertDialog: fechado, aberto, confirmado, cancelado
// e controlado — as linhas de `states.*` do conteúdo compartilhado.
//
// Os rótulos das cinco são o conjunto destrutivo de `demonstration.labels`,
// igual nas cinco stacks. Vêm de `alert-dialog.fixtures.ts`, que é de onde o
// painel Code também lê — o snippet publica o texto que o preview mostra.
//
// Sem argTypes: o painel Controls fica desligado, senão apareceria vazio.

const meta: Meta = {
  title: 'Components/Overlay/AlertDialog/States',
  tags: ['overlay'],
  decorators: [moduleMetadata({ imports: [...NDS_ALERT_DIALOG, NdsButton] })],
  parameters: {
    design: figmaDesign('alertDialog'),
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    // Cada story declara a sua; esta é a queda, e é a composição canônica.
    docs: { source: { transform: alertDialogDestructiveSource } },
  },
};

export default meta;
type Story = StoryObj;

/** Espiões de módulo: a play precisa inspecionar o mesmo mock que o render usa. */
const onConfirmSpy = fn();
const onCancelSpy = fn();
const onControlledOpenChange = fn();

/**
 * O template da confirmação destrutiva, com os ganchos que cada story liga.
 *
 * Uma cópia só para as stories que mostram a MESMA composição: o que muda
 * entre elas é o que acontece na tela, não o markup.
 */
function destructiveTemplate(o: { defaultOpen?: boolean; confirm?: string; cancel?: string } = {}) {
  return `
    <nds-alert-dialog${o.defaultOpen ? ' [defaultOpen]="true"' : ''}>
      <button ndsAlertDialogTrigger ndsButton variant="destructive">{{ labels.triggerLabel }}</button>

      <ng-template ndsAlertDialogContent>
        <div ndsAlertDialogHeader>
          <h2 ndsAlertDialogTitle>{{ labels.title }}</h2>
          <p ndsAlertDialogDescription>{{ labels.description }}</p>
        </div>
        <div ndsAlertDialogFooter>
          <button ndsAlertDialogCancel ndsButton variant="outline"${o.cancel ? ` (click)="${o.cancel}"` : ''}>
            {{ labels.cancelLabel }}
          </button>
          <button ndsAlertDialogAction ndsButton variant="destructive"${o.confirm ? ` (click)="${o.confirm}"` : ''}>
            {{ labels.actionLabel }}
          </button>
        </div>
      </ng-template>
    </nds-alert-dialog>
  `;
}

/**
 * Garante o diálogo aberto sem depender do estado de montagem.
 *
 * `defaultOpen` só vale na primeira montagem, e o painel Interactions
 * reexecuta a play no MESMO DOM: na segunda rodada o diálogo já foi fechado
 * pelos passos anteriores e o passo de abertura mediria o vazio.
 */
async function ensureOpen(canvas: ReturnType<typeof within>, triggerLabel: string) {
  if (!document.querySelector('[role="alertdialog"]')) {
    await userEvent.click(canvas.getByRole('button', { name: triggerLabel }));
  }
  return waitForPortal('alertdialog');
}

/**
 * Abre pelo gatilho como um TOQUE.
 *
 * O gerenciador de foco do primitivo lê o tipo de ponteiro da abertura e, na
 * de toque, foca o PAINEL em vez do primeiro botão — para o teclado virtual não
 * subir por cima dele. É por isso que a D3 do PRD exige o foco no Cancelar
 * escolhido pelo componente, e este é o caminho que a prova: sem a escolha
 * explícita, o toque cairia no painel. Os eventos são disparados à mão porque o
 * tipo do ponteiro é o assunto, e ele precisa chegar ao `pointerdown` e ao
 * `click` exatamente como `touch`.
 */
function openByTouch(trigger: HTMLElement): void {
  const init: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerType: 'touch',
    isPrimary: true,
    detail: 1,
  };
  trigger.dispatchEvent(new PointerEvent('pointerdown', init));
  trigger.dispatchEvent(new PointerEvent('pointerup', init));
  trigger.dispatchEvent(new PointerEvent('click', init));
}

export const Closed: Story = {
  parameters: {
    docs: {
      // Fechado é o estado inicial: a composição canônica, sem nada a mais.
      source: { transform: alertDialogDestructiveSource },
      description: {
        story: 'Estado inicial — só o gatilho está na tela; nada do painel foi montado.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: destructiveTemplate(),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = destructiveLabels();

    await step('Apenas o gatilho está visível', async () => {
      await expect(canvas.getByRole('button', { name: labels.triggerLabel })).toBeVisible();
    });

    await step('Nada do painel foi renderizado', async () => {
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
      await expect(document.querySelector('.nds-alert-dialog-overlay')).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    // A story termina ABERTA de propósito: é sobre ela que o axe roda a
    // varredura do estado aberto, contraste incluído.
    covers: ['accessibility.item6', 'accessibility.item7'],
    docs: {
      // O `[defaultOpen]` da story é a captura do Chromatic; o snippet publica
      // a composição comandada pelo gatilho.
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Painel aberto na montagem — é a captura visual do estado aberto. O foco inicial vai ao Cancelar por escolha do componente, também quando a abertura vem de toque.',
      },
    },
  },
  render: () => ({
    props: { labels: destructiveLabels() },
    template: destructiveTemplate({ defaultOpen: true }),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = destructiveLabels();

    await step('Nasce aberto, com véu', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(document.querySelector('.nds-alert-dialog-overlay')).not.toBeNull();
    });

    await step('Nome e descrição acessíveis saem do título e da descrição', async () => {
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toHaveAccessibleName(labels.title);
      await expect(panel).toHaveAccessibleDescription(labels.description);
    });

    await step('O foco inicial pousa no Cancelar, também na abertura sem clique', async () => {
      // Nascer aberto não passa pelo gatilho: é a abertura em que o foco NÃO
      // tem interação de onde herdar. A escolha do Cancelar vale igual (D3).
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: labels.cancelLabel });
      await waitFor(() => expect(cancel).toHaveFocus());
    });

    await step('Aberto por toque, o foco inicial continua no Cancelar', async () => {
      // Fecha pelo Escape para reabrir pelo gatilho: nascer aberto não tem tipo
      // de interação, e o que se mede aqui é justamente o toque. A story
      // termina aberta de novo, que é o estado que o axe varre.
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('alertdialog');
      openByTouch(canvas.getByRole('button', { name: labels.triggerLabel }));
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: labels.cancelLabel });
      await waitFor(() => expect(cancel).toHaveFocus());
      // O painel é o que o primitivo focaria por padrão no toque — medido
      // contra ele.
      await expect(panel).not.toHaveFocus();
    });
  },
};

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Confirmar dispara o callback de quem consome, fecha o painel e devolve o foco ao gatilho.',
      },
    },
  },
  beforeEach: () => {
    onConfirmSpy.mockClear();
  },
  render: () => ({
    props: { labels: destructiveLabels(), onConfirmSpy },
    template: destructiveTemplate({ defaultOpen: true, confirm: 'onConfirmSpy()' }),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = destructiveLabels();
    // O replay do painel Interactions reexecuta só a play, sem o beforeEach.
    onConfirmSpy.mockClear();

    await step('Confirmar dispara o callback de quem consome e fecha o painel', async () => {
      // Cada passo estabelece a própria precondição: o replay do painel
      // Interactions reexecuta no mesmo DOM, e lá o `defaultOpen` já passou.
      const panel = await ensureOpen(canvas, labels.triggerLabel);
      await userEvent.click(within(panel).getByRole('button', { name: labels.actionLabel }));
      await expect(onConfirmSpy).toHaveBeenCalledTimes(1);
      await waitForPortalVanish('alertdialog');
    });

    await step('Enter com a ação focada confirma, e o foco volta ao gatilho', async () => {
      // Reabre pelo gatilho, e não por `defaultOpen`, para que exista o foco
      // anterior que o fechamento devolve.
      const trigger = canvas.getByRole('button', { name: labels.triggerLabel });
      await userEvent.click(trigger);
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: labels.cancelLabel });
      const action = within(panel).getByRole('button', { name: labels.actionLabel });
      // O foco entra no Cancelar; é o Tab que leva à ação — o caminho de quem
      // confirma pelo teclado.
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.tab();
      await expect(action).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await expect(onConfirmSpy).toHaveBeenCalledTimes(2);
      await waitForPortalVanish('alertdialog');
      // Fecha o ciclo: sem o retorno de foco o teclado volta ao topo do
      // documento e a pessoa perde o lugar. O waitFor não é decoração: nesta
      // stack o foco só volta quando o portal destrói as diretivas, o que cai
      // num ciclo de detecção posterior.
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      // O Cancelar do snippet não escreve `(click)`: fechar sem executar é o
      // que ele já faz. O espião da story existe só para a `play` provar isso.
      source: { transform: alertDialogDestructiveSource },
      description: {
        story:
          'Cancelar fecha sem executar a ação destrutiva e devolve o foco ao gatilho. Espaço com o Cancelar focado faz o mesmo.',
      },
    },
  },
  beforeEach: () => {
    onCancelSpy.mockClear();
    onConfirmSpy.mockClear();
  },
  render: () => ({
    props: { labels: destructiveLabels(), onCancelSpy, onConfirmSpy },
    template: destructiveTemplate({
      defaultOpen: true,
      cancel: 'onCancelSpy()',
      confirm: 'onConfirmSpy()',
    }),
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = destructiveLabels();
    // O replay do painel Interactions reexecuta só a play, sem o beforeEach.
    onCancelSpy.mockClear();
    onConfirmSpy.mockClear();

    await step('Cancelar fecha e NÃO executa a ação destrutiva', async () => {
      const panel = await ensureOpen(canvas, labels.triggerLabel);
      await userEvent.click(within(panel).getByRole('button', { name: labels.cancelLabel }));
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await waitForPortalVanish('alertdialog');
      // O ponto do cancelamento: é isto que não pode acontecer.
      await expect(onConfirmSpy).not.toHaveBeenCalled();
    });

    await step('Espaço no Cancelar focado cancela, e o foco volta ao gatilho', async () => {
      const trigger = canvas.getByRole('button', { name: labels.triggerLabel });
      await userEvent.click(trigger);
      const panel = await waitForPortal('alertdialog');
      const cancel = within(panel).getByRole('button', { name: labels.cancelLabel });
      // Sem `.focus()` à mão: quem põe o foco no Cancelar é o componente.
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.keyboard(' ');
      await expect(onCancelSpy).toHaveBeenCalledTimes(2);
      await waitForPortalVanish('alertdialog');
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      // Ver a nota do Confirmed: o retorno de foco vem com a destruição do
      // portal, um ciclo de detecção depois do desmonte.
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

// Modo controlado: o estado mora na página, e o diálogo só reflete. Quem abre
// é um botão comum FORA da raiz — sem gatilho interno, é o par `[open]` +
// `(openChange)` que manda, nos dois sentidos.
export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      source: { transform: alertDialogControlledSource },
      description: {
        story:
          'Abertura comandada por estado externo — o botão que abre fica fora do diálogo, e o callback de mudança devolve cada fechamento ao pai.',
      },
    },
  },
  beforeEach: () => {
    onControlledOpenChange.mockClear();
  },
  render: () => ({
    props: { labels: destructiveLabels(), isOpen: false, onControlledOpenChange },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <button ndsButton variant="destructive" (click)="isOpen = true">
          {{ labels.triggerLabel }}
        </button>

        <nds-alert-dialog
          [open]="isOpen"
          (openChange)="isOpen = $event; onControlledOpenChange($event)"
        >
          <ng-template ndsAlertDialogContent>
            <div ndsAlertDialogHeader>
              <h2 ndsAlertDialogTitle>{{ labels.title }}</h2>
              <p ndsAlertDialogDescription>{{ labels.description }}</p>
            </div>
            <div ndsAlertDialogFooter>
              <button ndsAlertDialogCancel ndsButton variant="outline">{{ labels.cancelLabel }}</button>
              <button ndsAlertDialogAction ndsButton variant="destructive">{{ labels.actionLabel }}</button>
            </div>
          </ng-template>
        </nds-alert-dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = destructiveLabels();
    const opener = () => canvas.getByRole('button', { name: labels.triggerLabel });
    onControlledOpenChange.mockClear();

    await step('Quem controla o estado é a página, não um gatilho interno', async () => {
      await expect(document.querySelector('.nds-alert-dialog-content')).toBeNull();
      await userEvent.click(opener());
      const panel = await waitForPortal('alertdialog');
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName(labels.title);
    });

    await step('O Escape devolve o estado ao pai, que fecha o diálogo, e o foco volta ao botão de fora', async () => {
      // O ciclo do modo controlado só fecha quando a saída volta pelo binding:
      // se `openChange` não propagasse, o painel continuaria na tela com o pai
      // achando que está fechado.
      await userEvent.keyboard('{Escape}');
      await waitForPortalVanish('alertdialog');
      await expect(onControlledOpenChange).toHaveBeenLastCalledWith(false);
      await waitFor(() => expect(opener()).toHaveFocus());
    });

    await step('O botão de fora volta a abrir pelo mesmo caminho controlado', async () => {
      // Estabelece a própria precondição: o passo anterior deixou fechado, e é
      // desse estado que este parte — o replay do painel Interactions reexecuta
      // no mesmo DOM.
      await userEvent.click(opener());
      await expect(await waitForPortal('alertdialog')).toBeVisible();
    });
  },
};
