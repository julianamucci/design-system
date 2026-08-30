import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { ref } from 'vue';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import { ChevronDown } from 'lucide-vue-next';
import {
  defaultCollapsibleOpenSource,
  collapsibleControlledSource,
  collapsibleDisabledSource,
  collapsibleNotControlledSource,
} from './collapsible.source';

// Mesmo markup do Playground e do Vanilla (referência cross-stack).
const PANEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
const TRIGGER_CLASSES =
  'nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4';
const CHEVRON_CLASSES = 'nds-icon nds-shrink-0 nds-transition-transform nds-chevron';

const meta = {
  title: 'Primitives/Disclosure/Collapsible/States',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: collapsibleNotControlledSource },
      description: {
        component: 'Estados do Collapsible: não-controlado, aberto por padrão, controlado com estado externo e trigger desabilitado.',
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Par idempotente — ver a nota em collapsible.stories.ts. */
const open = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const close = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

// reka-ui NÃO desmonta o painel ao fechar: mantém o nó com `hidden` e
// `data-state="closed"` — o mesmo contrato do Vanilla. Por isso as asserções de
// "fechado" olham VISIBILIDADE, não ausência do nó.
const panelOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="collapsible-content"]');

export const Uncontrolled: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible class="nds-w-sm">
        <CollapsibleTrigger class="${TRIGGER_CLASSES}" data-justify="between">
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('o estado nasce e vive dentro do componente', async () => {
      // Ninguém de fora escreveu `open`: o painel abre porque o próprio
      // primitivo guarda o estado.
      await close(trigger);
      await expect(panelOf(canvasElement)).not.toBeVisible();
      await open(trigger);
      await expect(panelOf(canvasElement)).toBeInTheDocument();
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });

    await step('e continua alternando sem controle externo', async () => {
      await close(trigger);
      await waitFor(() => expect(panelOf(canvasElement)).not.toBeVisible());
    });
  },
};

export const OpenByDefault: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item2'],
    // `default-open` e o rótulo que o acompanha: a do meta mostraria o painel
    // fechado, que é o estado oposto.
    docs: { source: { transform: defaultCollapsibleOpenSource } },
  },
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible default-open class="nds-w-sm">
        <CollapsibleTrigger class="${TRIGGER_CLASSES}" data-justify="between">
          <span>Ocultar filtros avançados</span>
          <ChevronDown aria-hidden="true" class="${CHEVRON_CLASSES}" />
        </CollapsibleTrigger>
        <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('monta já expandido, sem estado externo nenhum', async () => {
      // Asserção de MONTAGEM: por isso o passo anterior não interage. No replay
      // o DOM não remonta, e o passo seguinte devolve o estado aberto.
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(panelOf(canvasElement)).toBeInTheDocument();
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });

    await step('defaultOpen é ponto de partida, não trava', async () => {
      await close(trigger);
      await open(trigger);
      // Termina aberto de propósito: é o quadro que o Chromatic fotografa e o
      // estado que o axe varre nesta story (visual.item2).
      await expect(panelOf(canvasElement)).toBeInTheDocument();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item3'],
    // O estado externo e os botões que mandam nele são a composição inteira —
    // sem eles não há modo controlado a mostrar.
    docs: { source: { transform: collapsibleControlledSource } },
  },
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() {
      const isOpen = ref(false);
      return { isOpen };
    },
    template: `
      <div class="nds-stack nds-w-sm" data-spacing="sm">
        <p class="nds-text-caption nds-text-muted-foreground">
          Estado externo: <strong>{{ isOpen ? 'aberto' : 'fechado' }}</strong>
        </p>
        <div class="nds-cluster" data-spacing="sm">
          <!-- Nomes próprios, diferentes do trigger: dois botões com o mesmo
               nome acessível são ambíguos na lista de controles do leitor. -->
          <button class="nds-button nds-button-outline nds-button-sm" @click="isOpen = true">
            Abrir pelo estado externo
          </button>
          <button class="nds-button nds-button-outline nds-button-sm" @click="isOpen = false">
            Fechar pelo estado externo
          </button>
        </div>
        <Collapsible :open="isOpen" @update:open="(v) => isOpen = v" class="nds-w-full">
          <CollapsibleTrigger class="${TRIGGER_CLASSES}" data-justify="between">
            <span>{{ isOpen ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}</span>
            <ChevronDown aria-hidden="true" class="${CHEVRON_CLASSES}" />
          </CollapsibleTrigger>
          <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
            <p>Filtro avançado 1</p>
            <p>Filtro avançado 2</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="collapsible-trigger"]',
    )!;

    await step('o painel obedece ao estado externo', async () => {
      // Nenhum clique no trigger: quem manda é a prop, e é isso que distingue o
      // modo controlado.
      if (trigger.getAttribute('aria-expanded') !== 'true') {
        await userEvent.click(canvas.getByRole('button', { name: /Abrir pelo estado externo/ }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
      await expect(panelOf(canvasElement)).toBeInTheDocument();
      await expect(trigger).toHaveTextContent('Ocultar filtros avançados');
    });

    await step('o trigger devolve a mudança para o estado externo', async () => {
      await close(trigger);
      await expect(trigger).toHaveTextContent('Exibir filtros avançados');
      await waitFor(() => expect(panelOf(canvasElement)).not.toBeVisible());
    });

    await step('e o botão externo fecha de volta', async () => {
      if (trigger.getAttribute('aria-expanded') !== 'false') {
        await userEvent.click(canvas.getByRole('button', { name: /Fechar pelo estado externo/ }));
      }
      await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item5'],
    // `disabled` nas duas pontas e o chevron sem rotação: nada disso está nos
    // args desta story.
    docs: { source: { transform: collapsibleDisabledSource } },
  },
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible disabled class="nds-w-sm">
        <CollapsibleTrigger disabled class="${TRIGGER_CLASSES}" data-justify="between">
          <span>Filtros avançados (desabilitado)</span>
          <ChevronDown aria-hidden="true" class="nds-icon nds-shrink-0" />
        </CollapsibleTrigger>
        <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Filtro avançado 1</p>
          <p>Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');

    await step('o botão é desabilitado de verdade, não só na aparência', async () => {
      await expect(trigger).toBeDisabled();
    });

    await step('clique não altera o estado do painel', async () => {
      // Exceção legítima à idempotência: elemento desabilitado não muda de
      // estado em rodada nenhuma.
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(panelOf(canvasElement)).not.toBeVisible();
    });

    await step('teclado também não', async () => {
      trigger.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
