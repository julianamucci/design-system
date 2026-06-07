import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from './index';
import HoverCardDocs from '@/components/docs/HoverCardDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/HoverCard',
  component: HoverCard,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: {
      page: withAutoDocsTab(HoverCardDocs),
      description: {
        component:
          'HoverCard (reka-ui) é um cartão flutuante exibido ao passar o cursor ou focar um elemento. Renderiza em portal com role=dialog, suporta delays configuráveis e abre tanto por hover quanto por foco (Tab). Usar para previews opcionais — não para ações críticas (touch users perdem).',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    openDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 50 },
      description: 'Delay em ms antes de abrir após hover.',
    },
    closeDelay: {
      control: { type: 'number', min: 0, max: 2000, step: 50 },
      description: 'Delay em ms antes de fechar após cursor sair.',
    },
  },
  args: {
    defaultOpen: false,
    openDelay: 0,
    closeDelay: 0,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<Meta<any>>;

export const Playground: Story = {
  argTypes: {
    side: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    align: {
      control: { type: 'select' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento horizontal do Content.',
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
  },
  render: (args) => ({
    components: { HoverCard, HoverCardContent, HoverCardTrigger },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout; min-height: 220px;" class="flex items-center justify-center">
        <HoverCard
          :key="String(args.defaultOpen) + String(args.openDelay) + String(args.closeDelay)"
          :default-open="args.defaultOpen"
          :open-delay="args.openDelay"
          :close-delay="args.closeDelay"
        >
          <HoverCardTrigger as-child>
            <a href="#" class="font-medium text-primary underline-offset-4 hover:underline">@joana</a>
          </HoverCardTrigger>
          <HoverCardContent :side="args.side" :align="args.align">
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog) throw new Error('hover card ainda aberto');
        },
        { timeout: 2000 },
      );
    };

    await step('1. Trigger renderiza como link', async () => {
      const trigger = canvas.getByRole('link', { name: /@joana/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('2. Hover no trigger abre o Content (role=dialog)', async () => {
      const trigger = canvas.getByRole('link', { name: /@joana/i });
      await userEvent.hover(trigger);
      const dialog = await waitForPortal('dialog', { timeout: 2000 });
      await expect(dialog).toBeVisible();
    });

    await step('3. Mover cursor para fora fecha o Content', async () => {
      const trigger = canvas.getByRole('link', { name: /@joana/i });
      await userEvent.unhover(trigger);
      await userEvent.click(canvasElement);
      await waitForClose();
    });
  },
};
