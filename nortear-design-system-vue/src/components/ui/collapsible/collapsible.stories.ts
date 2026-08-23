import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect, fn } from 'storybook/test';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import CollapsibleDocs from '@/components/docs/CollapsibleDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { ChevronDown } from 'lucide-vue-next';
import { collapsibleSource } from './collapsible.source';

// Markup alinhado ao Vanilla, que é a referência cross-stack. As classes que
// estavam aqui (`transition-transform`, `[[data-state=open]_&]:rotate-180`,
// `disabled:opacity-50`) são resíduo do Tailwind: não existem no CSS .nds-* e
// não pintavam nada. A rotação já é global em `.nds-chevron`, que gira sozinha
// sob `[aria-expanded="true"]` — não é preciso utilitário nenhum.
const PANEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
const TRIGGER_CLASSES =
  'nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4';
const CHEVRON_CLASSES = 'nds-icon nds-shrink-0 nds-transition-transform nds-chevron';

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(CollapsibleDocs), source: { transform: collapsibleSource } },
    layout: 'centered',
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger impedindo interação',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    // O modo controlado é demonstrado na story Controlled: aqui o control não
    // encaminharia nada, então entra como documentação, não como controle morto.
    open: {
      control: false,
      description: 'Estado aberto/fechado no modo controlado',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: '—' } },
    },
    // Sem entrada aqui o evento fica fora da aba API Reference, mesmo estando em
    // args e alimentando a aba Actions.
    'onUpdate:open': {
      control: false,
      description: 'Emitido a cada alternância, com o novo estado',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
    // Sem isto a aba Actions fica vazia — o evento de mudança é a única saída
    // pública do componente.
    'onUpdate:open': fn(),
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Par idempotente. O painel Interactions REEXECUTA a play no mesmo DOM, sem
 * remontar: num toggle, o clique cego parte do estado que a rodada anterior
 * deixou e inverte todas as asserções seguintes.
 */
const open = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return { args }; },
    template: `
      <Collapsible :key="String(args.defaultOpen)" v-bind="args" class="nds-w-sm">
        <CollapsibleTrigger :disabled="args.disabled" class="${TRIGGER_CLASSES}" data-justify="between">
          <span>Exibir filtros avançados</span>
          <ChevronDown aria-hidden="true" class="${CHEVRON_CLASSES}" />
        </CollapsibleTrigger>
        <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    const panel = () =>
      canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

    await step('trigger está presente e visível', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step('o chevron é decorativo', async () => {
      await expect(trigger.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    });

    if (args.disabled) {
      await step('desabilitado, o trigger não responde ao clique', async () => {
        const antes = trigger.getAttribute('aria-expanded');
        await userEvent.click(trigger, { pointerEventsCheck: 0 });
        await expect(trigger.getAttribute('aria-expanded')).toBe(antes);
      });
      return;
    }

    await step('clicar com o painel fechado expande o conteúdo', async () => {
      // fechar/abrir e não só abrir: o par garante um clique REAL nesta rodada,
      // que é o que a contagem do spy abaixo mede.
      await close(trigger);
      const spy = args['onUpdate:open'] as unknown as ReturnType<typeof fn>;
      const antes = spy.mock.calls.length;
      await open(trigger);
      await expect(panel()).toBeInTheDocument();
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
      await expect(spy.mock.calls.length).toBe(antes + 1);
    });

    await step('aberto, aria-controls aponta para o id real do painel', async () => {
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(panel());
    });

    await step('Enter alterna o painel', async () => {
      await close(trigger);
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Space alterna o painel, idêntico a Enter', async () => {
      await close(trigger);
      trigger.focus();
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('clicar com o painel aberto recolhe o conteúdo', async () => {
      // Último passo de propósito: a story declara visual.item1 (fechado por
      // padrão), e é o quadro final que o Chromatic fotografa e o axe varre.
      await open(trigger);
      await close(trigger);
      // Divergência de lib, verificada em node_modules e no DOM renderizado:
      // reka-ui NÃO desmonta o painel ao fechar — mantém o nó com `hidden` e
      // `data-state="closed"`, igual ao Vanilla. Asserir ausência do nó seria
      // asserir o comportamento de outra stack.
      await waitFor(() => expect(panel()).not.toBeVisible());
    });
  },
};
