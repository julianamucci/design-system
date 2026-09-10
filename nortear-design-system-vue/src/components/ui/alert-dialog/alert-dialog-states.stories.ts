import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';
import {
  alertDialogOpenSource,
  alertDialogCanceladoSource,
  alertDialogConfirmadoSource,
  alertDialogControlledSource,
  alertDialogClosedSource,
} from './alert-dialog.source';
import alertDialogTranslations from '@shared/content/alert-dialog/translations.json';

/**
 * Rótulos das stories de estado (as cinco, Closed incluída): o
 * conjunto destrutivo de `demonstration.labels`, o MESMO que a docs page lê. A
 * story é fixture e fica presa a pt-BR de propósito — quem resolve o idioma de
 * quem lê é a docs page, e uma play que dependesse do seletor procuraria um
 * nome diferente a cada rodada.
 *
 * O gatilho e o título dizem o mesmo ("Excluir conta"), e a ação diz só o verbo
 * ("Excluir"): as queries por botão desambiguam por nome exato.
 */
const L = alertDialogTranslations['pt-BR'].demonstration.labels;
const TRIGGER_NAME = new RegExp(`^${L.triggerLabel}$`, 'i');
const ACTION_NAME = new RegExp(`^${L.action}$`, 'i');
const CANCEL_NAME = new RegExp(`^${L.cancel}$`, 'i');

const meta = {
  title: 'Components/Overlay/AlertDialog/States',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: alertDialogClosedSource },
      description: {
        component:
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Garante o diálogo aberto sem depender do estado de montagem.
 *
 * `defaultOpen` só vale na primeira montagem, e o painel Interactions
 * reexecuta a play no MESMO DOM: na segunda rodada o diálogo já foi fechado
 * pelos passos anteriores e o passo de abertura media o vazio.
 */
async function ensureOpen(trigger: HTMLElement) {
  // querySelector e não queryByRole: numa rodada do arquivo inteiro sobra o
  // portal da story anterior por alguns quadros, e queryByRole estoura em
  // "multiple elements" antes de a limpeza acontecer.
  if (!document.querySelector('[role="alertdialog"]')) {
    await userEvent.click(trigger);
  }
  return waitForPortal('alertdialog');
}

const sharedComponents = {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
};

// Spies em escopo de módulo: o `setup()` da story só devolve bindings para o
// template, e a play function precisa da mesma referência para asseverar que o
// handler do consumidor disparou. `mockClear()` no setup zera a cada render.
const onConfirmSpy = fn();
const onCancelSpy = fn();
const onCancelActionSpy = fn();
const onOpenChangeSpy = fn();
const onControlledActionSpy = fn();

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
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
    // a varredura axe (contraste incluído) do estado aberto. Teclado, véu e
    // retorno de foco são das outras stories deste arquivo e do Playground.
    covers: ['accessibility.item6', 'accessibility.item7'],
    docs: {
      // Sai igual ao da do meta (o fechado): o `default-open` que abre esta
      // story é andaime de captura e não entra no trecho. Declarado por nome
      // para que a igualdade seja uma asserção do teste de unidade, e não sorte.
      source: { transform: alertDialogOpenSource },
      description: {
        story: 'Diálogo aberto: o painel com o par Cancelar + Ação e o foco inicial no Cancelar. Captura visual no Chromatic.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive">${L.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ step }) => {
    await step('Conteúdo aberto traz título e descrição', async () => {
      const dialog = await waitForPortal('alertdialog');
      // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
      // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveTextContent(L.title);
      await expect(dialog).toHaveTextContent(L.description);
    });

    await step('Foco inicial no Cancelar', async () => {
      const dialog = await waitForPortal('alertdialog');
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: CANCEL_NAME })).toHaveFocus(),
      );
    });
  },
};

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      // O handler do consumidor na ação é o assunto, e ele não existe na do meta.
      source: { transform: alertDialogConfirmadoSource },
      description: {
        story: 'A ação, por clique ou por Enter, dispara o handler, fecha o diálogo e devolve o foco ao gatilho.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      onConfirmSpy.mockClear();
      return { onConfirm: onConfirmSpy };
    },
    // O trigger existe para que o retorno de foco ao fechar tenha destino —
    // parte de functional.item2, não só o callback e o fechamento.
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              @click="onConfirm"
            >
              ${L.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    // `hidden: true`: a story nasce aberta, então o trigger já está sob
    // aria-hidden quando a play começa. Continua sendo o mesmo nó para o foco.
    const trigger = canvas.getByRole('button', { name: TRIGGER_NAME, hidden: true });
    onConfirmSpy.mockClear();

    await step('Clique na ação dispara o handler, fecha e devolve o foco ao gatilho', async () => {
      const dialog = await ensureOpen(trigger);
      await userEvent.click(within(dialog).getByRole('button', { name: ACTION_NAME }));
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('Enter na ação confirma pelo teclado e devolve o foco ao gatilho', async () => {
      // Reabre pelo gatilho (e não por estado) para que o retorno de foco tenha
      // de onde partir.
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      const action = within(dialog).getByRole('button', { name: ACTION_NAME });
      // O foco entra no Cancelar; Tab leva à ação.
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: CANCEL_NAME })).toHaveFocus(),
      );
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      // Duas saídas com handler cada uma: é o que a do meta não tem.
      source: { transform: alertDialogCanceladoSource },
      description: {
        story: 'O Cancelar, por clique ou por Espaço, fecha sem executar a ação e devolve o foco ao gatilho.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      onCancelSpy.mockClear();
      onCancelActionSpy.mockClear();
      return { onCancel: onCancelSpy, onAction: onCancelActionSpy };
    },
    // O gatilho existe para que o retorno de foco ao fechar tenha destino.
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">${L.triggerLabel}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>${L.title}</AlertDialogTitle>
            <AlertDialogDescription>${L.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="onCancel">${L.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              @click="onAction"
            >
              ${L.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    // `hidden: true`: a story nasce aberta, então o trigger já está sob
    // aria-hidden quando a play começa.
    const trigger = canvas.getByRole('button', { name: TRIGGER_NAME, hidden: true });
    onCancelSpy.mockClear();
    onCancelActionSpy.mockClear();

    await step('Clique no Cancelar fecha sem executar a ação e devolve o foco', async () => {
      const dialog = await ensureOpen(trigger);
      await userEvent.click(within(dialog).getByRole('button', { name: CANCEL_NAME }));
      await waitFor(() => expect(onCancelSpy).toHaveBeenCalledTimes(1));
      await expect(onCancelActionSpy).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('Espaço no Cancelar focado cancela pelo teclado', async () => {
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: CANCEL_NAME });
      await waitFor(() => expect(cancel).toHaveFocus());

      await userEvent.keyboard(' ');
      await waitFor(() => expect(onCancelSpy).toHaveBeenCalledTimes(2));
      await expect(onCancelActionSpy).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      // O gatilho sai de dentro do componente e vira botão do consumidor, com
      // o estado num `ref`: script e marcação que a do meta não tem.
      source: { transform: alertDialogControlledSource },
      description: {
        story:
          'Abertura comandada pelo estado de quem consome: o botão fica fora do componente, e cada fechamento chega como pedido de mudança que o pai aplica.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      onOpenChangeSpy.mockClear();
      onControlledActionSpy.mockClear();
      const onOpenChange = (value: boolean) => {
        onOpenChangeSpy(value);
        open.value = value;
      };
      return { open, onOpenChange, onAction: onControlledActionSpy };
    },
    // A ação não fecha por conta própria: ela pede o fechamento pelo mesmo
    // evento de mudança que o Cancelar e o Escape, e o pai o aplica. O handler
    // dela está aqui só para a play conferir a ORDEM (último passo).
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Button variant="destructive" @click="open = true">${L.triggerLabel}</Button>
        <AlertDialog :open="open" @update:open="onOpenChange">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>${L.title}</AlertDialogTitle>
              <AlertDialogDescription>${L.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>${L.cancel}</AlertDialogCancel>
              <AlertDialogAction variant="destructive" @click="onAction">${L.action}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    // Guardado como nó: com o diálogo aberto o botão de fora recebe
    // aria-hidden, e uma nova query por role não o encontraria.
    const trigger = canvas.getByRole('button', { name: TRIGGER_NAME });

    await step('O botão de fora abre o diálogo pelo estado', async () => {
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Escape pede o fechamento, o pai fecha e o foco volta ao botão', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(onOpenChangeSpy).toHaveBeenCalledWith(false));
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    // Neste modo o pedido de mudança sai SÍNCRONO de dentro do fechamento da
    // lib. Se o clique de quem consome chegasse depois dele, quem marca a
    // confirmação no clique (a docs page, para o `reason` do `dialog_close`)
    // receberia o fechamento antes da marca. O wrapper entrega o clique na
    // captura; esta é a prova de que a ordem vale no modo em que ela importa.
    await step('A ação avisa quem consome ANTES de pedir o fechamento', async () => {
      onOpenChangeSpy.mockClear();
      onControlledActionSpy.mockClear();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      await userEvent.click(within(dialog).getByRole('button', { name: ACTION_NAME }));
      await waitFor(() => expect(onOpenChangeSpy).toHaveBeenCalledWith(false));
      await expect(onControlledActionSpy).toHaveBeenCalledTimes(1);
      await expect(onControlledActionSpy.mock.invocationCallOrder[0]).toBeLessThan(
        onOpenChangeSpy.mock.invocationCallOrder[0],
      );
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
    });
  },
};
