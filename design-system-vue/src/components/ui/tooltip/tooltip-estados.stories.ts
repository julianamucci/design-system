import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-vue-next';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Tooltip/Estados',
  component: Tooltip,
  tags: ['overlay'],
  decorators: [
    (story) => ({
      components: { TooltipProvider, story },
      template: '<TooltipProvider :delay-duration="0"><story /></TooltipProvider>',
    }),
  ],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Tooltip: Fechado (apenas trigger), Aberto (defaultOpen), Foco (Tab abre sem delay) e Controlado (open + @update:open).',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tooltip, TooltipContent, TooltipTrigger, Button, Save };

export const Fechado: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas trigger renderizado. Portal vazio.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout;" class="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Salvar</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Salvar/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tooltip aberto via defaultOpen. Captura visual no Chromatic — role=tooltip presente.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 160px;" class="flex items-center justify-center">
        <Tooltip :default-open="true">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const tip = await waitForPortal('tooltip');
    await expect(tip).toBeVisible();
  },
};

export const ComFoco: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Foco via Tab abre o Tooltip imediatamente (sem delay) — WCAG 1.4.13.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 160px;" class="flex items-center justify-center">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Tab foca o trigger e abre o Tooltip', async () => {
      const trigger = canvas.getByRole('button', { name: /Salvar/i });
      trigger.focus();
      const tip = await waitForPortal('tooltip', { timeout: 2000 });
      await expect(tip).toBeVisible();
    });

    await step('Escape fecha o Tooltip mantendo foco no trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          if (body.queryByRole('tooltip')) throw new Error('tooltip ainda aberto');
        },
        { timeout: 2000 },
      );
    });
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via open + @update:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="flex flex-col items-center gap-3" style="contain: layout; min-height: 200px;">
        <Button variant="secondary" @click="open = !open">
          Toggle externo ({{ open ? 'aberto' : 'fechado' }})
        </Button>
        <Tooltip :open="open" @update:open="(v) => open = v">
          <TooltipTrigger as-child>
            <Button variant="outline" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click no toggle externo abre o Tooltip', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      const tip = await waitForPortal('tooltip', { timeout: 2000 });
      await expect(tip).toBeVisible();
    });

    await step('Click no toggle novamente fecha', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      await waitFor(
        () => {
          if (body.queryByRole('tooltip')) throw new Error('tooltip ainda aberto');
        },
        { timeout: 2000 },
      );
    });
  },
};
