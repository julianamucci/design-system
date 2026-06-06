import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
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
      <Collapsible class="w-80 space-y-2">
        <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Exibir filtros avançados
          <ChevronDown
            aria-hidden="true"
            class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent class="space-y-2">
          <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
            Filtro avançado 1
          </div>
          <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
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
      <div class="w-80 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">
            Estado externo: <strong>{{ isOpen ? 'aberto' : 'fechado' }}</strong>
          </span>
          <button
            class="rounded-md border border-input bg-background px-3 py-1 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            @click="toggle"
          >
            {{ isOpen ? 'Fechar' : 'Abrir' }} externamente
          </button>
        </div>
        <Collapsible :open="isOpen" @update:open="(v) => isOpen = v" class="space-y-2">
          <CollapsibleTrigger class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {{ isOpen ? 'Ocultar filtros avançados' : 'Exibir filtros avançados' }}
            <ChevronDown
              aria-hidden="true"
              class="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-2">
            <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
              Filtro avançado 1
            </div>
            <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
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
      <Collapsible disabled class="w-80 space-y-2">
        <CollapsibleTrigger
          disabled
          class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Filtros avançados (desabilitado)
          <ChevronDown aria-hidden="true" class="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent class="space-y-2">
          <div class="rounded-md border border-input bg-muted px-4 py-2 text-sm">
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
