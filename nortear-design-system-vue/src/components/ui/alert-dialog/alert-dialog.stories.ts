import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { TriangleAlert } from 'lucide-vue-next';
import AlertDialogDocs from '@/components/docs/AlertDialogDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { alertDialogSource } from './alert-dialog.source';

// Args da raiz + args que montam a composição. Os segundos ficam na categoria
// "Demonstração" — mesmos nomes, ordem e valores nas 4 stacks, para o painel de
// controls ser o mesmo em qualquer Storybook do design system.
type PlaygroundArgs = {
  defaultOpen: boolean;
  unmountOnHide: boolean;
  // Documentadas na aba API Reference, sem control (o template não as encaminha).
  open?: boolean;
  'onUpdate:open': (open: boolean) => void;
  default?: unknown;
  tone: 'destructive' | 'default';
  showMedia: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

const DEMO = { table: { category: 'Demonstração' } } as const;

const meta = {
  title: 'Primitives/Overlay/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    docs: { page: withAutoDocsTab(AlertDialogDocs), source: { transform: alertDialogSource } },
  },
  // A aba "API Reference" combina o docgen com estes argTypes. Props que o
  // template não encaminha ficam como documentação (control: false).
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não controlado. Útil para capturas visuais.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    unmountOnHide: {
      control: 'boolean',
      description: 'Desmonta o conteúdo ao fechar. Desligue para manter o painel no DOM.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    open: {
      control: false,
      description: 'Estado controlado de abertura, via v-model:open.',
      table: { type: { summary: 'boolean' } },
    },
    'onUpdate:open': {
      control: false,
      description: 'Emitido ao abrir ou fechar. Recebe o novo estado.',
      table: { category: 'events', type: { summary: '(open: boolean) => void' } },
    },
    default: {
      control: false,
      description: 'Slot de composição: Trigger, Content, Header, Footer, Cancel e Action.',
      table: { type: { summary: 'slot' } },
    },

    tone: {
      control: 'select',
      options: ['destructive', 'default'],
      description: 'Severidade da confirmação — escolhe a variante do Button do trigger e da ação.',
      ...DEMO,
    },
    showMedia: {
      control: 'boolean',
      description:
        'Bloco de ícone no topo do header (AlertDialogMedia). Quando presente, o CSS centraliza header e texto.',
      ...DEMO,
    },
    triggerLabel: { control: 'text', description: 'Rótulo do botão que abre o diálogo.', ...DEMO },
    title: { control: 'text', description: 'Título, associado por aria-labelledby.', ...DEMO },
    description: {
      control: 'text',
      description: 'Descrição, associada por aria-describedby.',
      ...DEMO,
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo do botão que fecha sem executar a ação.',
      ...DEMO,
    },
    actionLabel: { control: 'text', description: 'Rótulo do botão que confirma.', ...DEMO },
  },
  // Conteúdo dos rótulos: docs/shared/content/alert-dialog/translations.json →
  // demonstration.labels. É o mesmo exemplo da seção Demonstração da docs page.
  args: {
    defaultOpen: false,
    unmountOnHide: true,
    // Popula a aba Actions e deixa o play asseverar cada transição de abertura.
    'onUpdate:open': fn(),
    tone: 'destructive',
    showMedia: false,
    triggerLabel: 'Excluir conta',
    title: 'Excluir conta',
    description:
      'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Excluir',
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

// Spies em escopo de módulo: a story renderiza uma vez por execução e o play
// precisa inspecioná-los. São limpos no início do play, antes de qualquer ação.
const onConfirm = fn();
const onCancel = fn();

export const Playground: Story = {
  parameters: {
    // Contrato de teste (docs/shared/content/alert-dialog/translations.json →
    // testes.*). Só entra aqui o que os steps abaixo realmente asseveram.
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'functional.item5',
      'functional.item6',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogMedia,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
      TriangleAlert,
    },
    setup() {
      // Só as props da raiz vão no v-bind: os args de demonstração montam a
      // composição e cairiam como atributos soltos.
      const rootProps = computed(() => ({
        defaultOpen: args.defaultOpen,
        unmountOnHide: args.unmountOnHide,
        'onUpdate:open': args['onUpdate:open'],
      }));
      return { args, rootProps, onConfirm, onCancel };
    },
    template: `
      <AlertDialog :key="String(args.defaultOpen)" v-bind="rootProps">
        <AlertDialogTrigger as-child>
          <Button :variant="args.tone">{{ args.triggerLabel }}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia v-if="args.showMedia">
              <TriangleAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>{{ args.title }}</AlertDialogTitle>
            <AlertDialogDescription>{{ args.description }}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="onCancel">{{ args.cancelLabel }}</AlertDialogCancel>
            <AlertDialogAction
              :variant="args.tone"
              @click="onConfirm"
            >
              {{ args.actionLabel }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    // Guardado como nó: com o diálogo aberto o conteúdo externo recebe
    // aria-hidden/inert, então uma nova query por role não o encontraria.
    const trigger = canvas.getByRole('button', { name: /^Excluir conta$/i });
    const onOpenChange = args['onUpdate:open'] as unknown as ReturnType<typeof fn>;
    const openedWith = (open: boolean) =>
      onOpenChange.mock.calls.some((call) => call[0] === open);

    onOpenChange.mockClear();
    onConfirm.mockClear();
    onCancel.mockClear();

    await step('Trigger está presente e anuncia que abre um diálogo', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Diálogo abre ao clicar no trigger e notifica a mudança', async () => {
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      await expect(dialog).toBeVisible();
      // O backdrop faz parte do contrato de abertura (functional.item1): sem ele
      // o fundo continua clicável e a modalidade é só visual.
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await waitFor(() => expect(openedWith(true)).toBe(true));
    });

    await step('Content expõe role alertdialog, aria-modal e isola o fundo', async () => {
      const dialog = await waitForPortal('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      // O atributo sai do wrapper do design system: a lib não o emite (marca
      // tudo fora do painel com aria-hidden). Os dois são verificados aqui — o
      // contrato documentado e o isolamento real.
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
      // O painel em si fica fora da subárvore escondida.
      await expect(dialog.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('aria-labelledby e aria-describedby apontam para Title e Description', async () => {
      const dialog = await waitForPortal('alertdialog');
      const title = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-title"]');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(title).not.toBeNull();
      await expect(description).not.toBeNull();
      await expect(title!.id).not.toBe('');
      await expect(description!.id).not.toBe('');
      await expect(dialog).toHaveAttribute('aria-labelledby', title!.id);
      await expect(dialog).toHaveAttribute('aria-describedby', description!.id);
      await expect(title).toHaveTextContent(/^Excluir conta$/i);
      await expect(description).toHaveTextContent(/removidos permanentemente/i);
    });

    await step('Bloco de mídia segue o control showMedia', async () => {
      const dialog = await waitForPortal('alertdialog');
      const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
      if (!args.showMedia) {
        await expect(media).toBeNull();
        return;
      }
      // A mídia é o PRIMEIRO filho do header: é dessa ordem que dependem o
      // :has() do CSS e a ordem de leitura ícone → título → descrição.
      const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
      await expect(header!.firstElementChild).toBe(media);
      await expect(media!.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    await step('Foco inicial em Cancelar, não na ação destrutiva', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      // O foco entra no painel depois da animação de abertura — daí o waitFor.
      await waitFor(() => expect(cancel).toHaveFocus());
      await expect(action).not.toHaveFocus();
    });

    await step('Tab e Shift+Tab alternam entre Cancelar e a ação', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });

      // Movimentação de foco por teclado é síncrona: sem waitFor, senão um bug
      // real de ordem de tabulação passaria despercebido.
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.tab({ shift: true });
      await expect(cancel).toHaveFocus();
    });

    await step('Focus trap: Tab repetido nunca sai do diálogo', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      const focused = new Set<Element>();

      // 4 tabulações: com o trap ativo o foco só pode alternar entre os dois
      // botões (ou o próprio painel, que tem tabindex -1).
      for (let i = 0; i < 4; i += 1) {
        await userEvent.tab();
        await expect(dialog).toContainElement(document.activeElement as HTMLElement);
        focused.add(document.activeElement!);
      }
      await expect(focused.has(cancel)).toBe(true);
      await expect(focused.has(action)).toBe(true);
    });

    await step('Clique no overlay não fecha — a decisão é obrigatória', async () => {
      const dialog = await waitForPortal('alertdialog');
      const overlay = document.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-overlay"]',
      );
      await expect(overlay).not.toBeNull();
      overlay!.click();
      await expect(dialog).toBeVisible();
      await expect(openedWith(false)).toBe(false);
    });

    await step('Escape fecha o diálogo e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('alertdialog');
      await waitFor(() => expect(openedWith(false)).toBe(true));
      // Restauração de foco é síncrona ao desmonte: sem waitFor.
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Reaberto, Cancelar dispara o handler e fecha o diálogo', async () => {
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });

      await userEvent.click(cancel);
      await expect(onCancel).toHaveBeenCalled();
      await waitForPortalGone('alertdialog');
      // A ação destrutiva nunca foi acionada em nenhum momento do fluxo.
      await expect(onConfirm).not.toHaveBeenCalled();
      await expect(trigger).toHaveFocus();
    });
  },
};
