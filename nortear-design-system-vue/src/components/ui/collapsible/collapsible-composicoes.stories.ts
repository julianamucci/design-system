import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
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
      <Collapsible class="nds-stack" data-spacing="sm" style="width: 20rem">
        <CollapsibleTrigger class="nds-cluster nds-w-full nds-rounded-md nds-border-default nds-border-default nds-bg-background nds-px-4 nds-py-2 nds-text-body nds-font-medium nds-hover-bg-accent nds-hover-text-accent-foreground nds-focus-ring" data-align="center" data-spacing="sm">
          <Filter aria-hidden="true" class="nds-shrink-0" style="height: 1rem; width: 1rem" />
          <span class="nds-flex-1 nds-text-left">Filtros avançados</span>
          <ChevronDown
            aria-hidden="true"
            class="nds-shrink-0 transition-transform [[data-state=open]_&]:rotate-180" style="height: 1rem; width: 1rem"
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
      <Collapsible class="nds-rounded-md nds-border-default nds-border-default nds-bg-background" style="width: 20rem">
        <CollapsibleTrigger class="nds-cluster nds-w-full nds-px-4 nds-text-body nds-font-medium nds-hover-bg-accent nds-hover-text-accent-foreground nds-focus-ring nds-rounded-md" data-align="center" data-justify="between" style="padding-block: 0.75rem">
          <div class="nds-cluster" data-spacing="sm">
            <Settings aria-hidden="true" class="" style="height: 1rem; width: 1rem" />
            <span>Configuracoes avançadas</span>
          </div>
          <ChevronDown
            aria-hidden="true"
            class="transition-transform duration-200 [[data-state=open]_&]:rotate-180" style="height: 1rem; width: 1rem"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="border-t nds-border-default nds-px-4" data-spacing="sm" style="padding-block: 0.75rem">
            <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
              <span class="nds-text-muted-foreground">Modo debug</span>
              <span class="nds-text-foreground nds-font-medium">Desativado</span>
            </div>
            <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
              <span class="nds-text-muted-foreground">Cache</span>
              <span class="nds-text-foreground nds-font-medium">Habilitado</span>
            </div>
            <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
              <span class="nds-text-muted-foreground">Timeout</span>
              <span class="nds-text-foreground nds-font-medium">30s</span>
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
