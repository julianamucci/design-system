import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/HoverCard/Variantes',
  component: HoverCard,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do HoverCard: Default (delays padrão da lib — openDelay 700ms, closeDelay 300ms) e ComDelayCurto (delays customizados de 100ms para previews mais responsivos).',
      },
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { HoverCard, HoverCardContent, HoverCardTrigger };

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Variante padrão — w-64, p-2.5, shadow-md, rounded-lg, ring-foreground/10. Delays padrão da lib.',
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

export const ComDelayCurto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Delay customizado — openDelay 100ms / closeDelay 50ms. Útil para previews onde resposta rápida é desejada (ex: lista de @mentions).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <HoverCard :default-open="true" :open-delay="0" :close-delay="0">
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">@bruno</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <div class="flex gap-3">
              <div class="size-10 rounded-full bg-muted" aria-hidden="true"></div>
              <div class="space-y-1">
                <p class="text-sm font-medium leading-none">Bruno Lima</p>
                <p class="text-xs text-muted-foreground">Engenharia · 89 seguidores</p>
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
