// @jsxImportSource react
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
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
      <Collapsible :key="String(args.defaultOpen)" v-bind="args" class="nds-stack" data-spacing="sm" style="width: 20rem">
        <CollapsibleTrigger :disabled="args.disabled" class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" data-align="center" data-justify="between">
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
