import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { ref } from 'vue';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import { ChevronDown } from 'lucide-vue-next';

const meta = {
  title: 'UI/Collapsible/Estados',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Estados do Collapsible: modo não-controlado, modo controlado com estado externo e trigger desabilitado.',
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NaoControlado: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible class="nds-stack" data-spacing="sm" style="width: 20rem">
        <CollapsibleTrigger class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-align="center" data-justify="between">
          Exibir filtros avançados
          <ChevronDown
            aria-hidden="true"
            class="transition-transform [[data-state=open]_&]:rotate-180" style="height: 1rem; width: 1rem"
          />
        </CollapsibleTrigger>
        <CollapsibleContent class="nds-stack" data-spacing="sm">
          <div class="nds-rounded-md nds-border-default nds-border-default nds-bg-muted nds-px-4 nds-py-2 nds-text-body">
            Filtro avançado 1
          </div>
          <div class="nds-rounded-md nds-border-default nds-border-default nds-bg-muted nds-px-4 nds-py-2 nds-text-body">
            Filtro avançado 2
          </div>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger presente com estado inicial fechado', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar abre o painel (estado interno)', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Conteúdo visível após abertura', async () => {
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });

    await step('Clicar novamente fecha o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Controlado: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() {
      const isOpen = ref(false);
      function toggle() { isOpen.value = !isOpen.value; }
      return { isOpen, toggle };
    },
    template: `
      <div class="nds-stack" data-spacing="sm" style="width: 20rem">
        <div class="nds-cluster" data-justify="between">
          <span class="nds-text-body nds-text-muted-foreground">
            Estado externo: <strong>{{ isOpen ? 'aberto' : 'fechado' }}</strong>
          </span>
          <button
            class="nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-py-1 nds-text-caption nds-font-medium nds-hover-bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style="padding-inline: 0.75rem"
            @click="toggle"
          >
            {{ isOpen ? 'Fechar' : 'Abrir' }} externamente
          </button>
        </div>
        <Collapsible :open="isOpen" @update:open="(v) => isOpen = v" class="nds-stack" data-spacing="sm">
          <CollapsibleTrigger class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-align="center" data-justify="between">
            {{ isOpen ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}
            <ChevronDown
              aria-hidden="true"
              class="transition-transform [[data-state=open]_&]:rotate-180" style="height: 1rem; width: 1rem"
            />
          </CollapsibleTrigger>
          <CollapsibleContent class="nds-stack" data-spacing="sm">
            <div class="nds-rounded-md nds-border-default nds-border-default nds-bg-muted nds-px-4 nds-py-2 nds-text-body">
              Filtro avançado 1
            </div>
            <div class="nds-rounded-md nds-border-default nds-border-default nds-bg-muted nds-px-4 nds-py-2 nds-text-body">
              Filtro avançado 2
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Estado inicial: painel fechado', async () => {
      const trigger = canvas.getByRole('button', { name: /Exibir/ });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Botão externo abre o painel', async () => {
      const externalBtn = canvas.getByRole('button', { name: /Abrir externamente/ });
      await userEvent.click(externalBtn);
      const trigger = canvas.getByRole('button', { name: /Ocultar/ });
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Conteúdo visível no modo controlado', async () => {
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });

    await step('Trigger interno também alterna o estado', async () => {
      const trigger = canvas.getByRole('button', { name: /Ocultar/ });
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};

export const Desabilitado: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible disabled class="nds-stack" data-spacing="sm" style="width: 20rem">
        <CollapsibleTrigger
          disabled
          class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium opacity-50 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" data-align="center" data-justify="between"
        >
          Filtros avançados (desabilitado)
          <ChevronDown aria-hidden="true" class="" style="height: 1rem; width: 1rem" />
        </CollapsibleTrigger>
        <CollapsibleContent class="nds-stack" data-spacing="sm">
          <div class="nds-rounded-md nds-border-default nds-border-default nds-bg-muted nds-px-4 nds-py-2 nds-text-body">
            Este conteúdo não deve aparecer
          </div>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger desabilitado está presente', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
    });

    await step('Trigger tem atributo disabled', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeDisabled();
    });

    await step('Clicar no trigger desabilitado não abre o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
