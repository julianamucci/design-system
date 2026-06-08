import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import { ChevronDown, Filter, Settings } from 'lucide-vue-next';

const meta = {
  title: 'UI/Collapsible/Composicoes',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composicoes do Collapsible: com ícone no trigger, com ícone giratório e conteúdo estruturado.',
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeNoTrigger: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown, Filter },
    setup() { return {}; },
    template: `
      <Collapsible class="w-80 space-y-2">
        <CollapsibleTrigger class="flex w-full items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Filter aria-hidden="true" class="h-4 w-4 shrink-0" />
          <span class="flex-1 text-left">Filtros avançados</span>
          <ChevronDown
            aria-hidden="true"
            class="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180"
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

    await step('Trigger com ícone está presente', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
    });

    await step('Ícone do trigger tem aria-hidden', async () => {
      const trigger = canvas.getByRole('button');
      const svgs = trigger.querySelectorAll('svg');
      for (const svg of svgs) {
        await expect(svg).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Clicar abre o painel', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const ComIconeGiratório: Story = {
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown, Settings },
    setup() { return {}; },
    template: `
      <Collapsible class="w-80 rounded-md border border-input bg-background">
        <CollapsibleTrigger class="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
          <div class="flex items-center gap-2">
            <Settings aria-hidden="true" class="h-4 w-4" />
            <span>Configuracoes avançadas</span>
          </div>
          <ChevronDown
            aria-hidden="true"
            class="h-4 w-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="border-t border-input px-4 py-3 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Modo debug</span>
              <span class="text-foreground font-medium">Desativado</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Cache</span>
              <span class="text-foreground font-medium">Habilitado</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Timeout</span>
              <span class="text-foreground font-medium">30s</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Collapsible com painel de configurações renderizado', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toBeInTheDocument();
    });

    await step('Expandir mostra as configurações', async () => {
      const trigger = canvas.getByRole('button');
      await userEvent.click(trigger);
      await expect(canvas.getByText('Modo debug')).toBeVisible();
      await expect(canvas.getByText('Cache')).toBeVisible();
      await expect(canvas.getByText('Timeout')).toBeVisible();
    });

    await step('data-state=open aplicado ao trigger', async () => {
      const trigger = canvas.getByRole('button');
      await expect(trigger).toHaveAttribute('data-state', 'open');
    });
  },
};
