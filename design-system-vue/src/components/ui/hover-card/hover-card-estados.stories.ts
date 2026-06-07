import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/HoverCard/Estados',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do HoverCard: Fechado (apenas trigger renderizado), Aberto (defaultOpen) e Controlado (open + @update:open).',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger, Button };

export const Fechado: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. Portal vazio.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <HoverCard>
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent>
            <p class="text-sm">Conteúdo do preview.</p>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('link', { name: /@joana/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story: 'HoverCard aberto via defaultOpen. Captura visual no Chromatic — Content com role=dialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <HoverCard :default-open="true" :open-delay="0" :close-delay="0">
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <div class="flex gap-3">
              <div class="size-10 rounded-full bg-muted" aria-hidden="true"></div>
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none">Joana Silva</p>
                <p class="text-xs text-muted-foreground">Designer · 142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
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
      <div class="flex flex-col gap-3" style="contain: layout; min-height: 240px;">
        <Button @click="open = !open">Toggle externo ({{ open ? 'aberto' : 'fechado' }})</Button>
        <HoverCard :open="open" @update:open="(v) => open = v" :open-delay="0" :close-delay="0">
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <p class="text-sm">Preview controlado externamente.</p>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click no toggle externo abre o HoverCard', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
    });

    await step('Click no toggle novamente fecha', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      await waitFor(
        () => {
          if (body.queryByRole('dialog')) throw new Error('hover card ainda aberto');
        },
        { timeout: 2000 },
      );
    });
  },
};
