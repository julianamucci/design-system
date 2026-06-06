// @jsxImportSource react
import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { ref } from 'vue';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import CollapsibleDocs from '@/components/docs/CollapsibleDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { ChevronDown } from 'lucide-vue-next';

const meta = {
  title: 'UI/Collapsible',
  component: Collapsible,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(CollapsibleDocs) },
    layout: 'centered',
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial no modo não-controlado',
    },
    disabled: {
      control: 'boolean',
      description: 'Desabilita o trigger impedindo interação',
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return { args }; },
    template: `
      <Collapsible :key="String(args.defaultOpen)" v-bind="args" class="w-80 space-y-2">
        <CollapsibleTrigger :disabled="args.disabled" class="flex w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
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

    await step('Trigger está presente e acessível', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step('Painel começa fechado (aria-expanded false)', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar no trigger abre o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('Conteúdo fica visível após abertura', async () => {
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
      await expect(canvas.getByText('Filtro avançado 2')).toBeVisible();
    });

    await step('Clicar novamente fecha o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
