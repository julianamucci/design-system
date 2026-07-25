import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
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
            <a href="#" class="nds-font-medium nds-text-primary underline-offset-4 nds-hover-underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <div class="nds-cluster" data-spacing="sm">
              <div class="nds-size-10 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
              <div class="nds-stack" data-spacing="xs">
                <p class="nds-text-body nds-font-medium" style="line-height: 1">Joana Silva</p>
                <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async () => {
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
            <a href="#" class="nds-font-medium nds-text-primary underline-offset-4 nds-hover-underline">@bruno</a>
          </HoverCardTrigger>
          <HoverCardContent side="bottom" align="start">
            <div class="nds-cluster" data-spacing="sm">
              <div class="nds-size-10 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
              <div class="nds-stack" data-spacing="xs">
                <p class="nds-text-body nds-font-medium" style="line-height: 1">Bruno Lima</p>
                <p class="nds-text-caption nds-text-muted-foreground">Engenharia · 89 seguidores</p>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    `,
  }),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};
